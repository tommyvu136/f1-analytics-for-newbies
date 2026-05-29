from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from functools import partial
from typing import Any

import fastf1
import numpy as np
import pandas as pd

from app.config import settings


async def _run_sync(func, *args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(func, *args, **kwargs))


def _timedelta_to_seconds(value) -> float | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if hasattr(value, "total_seconds"):
        return float(value.total_seconds())
    return None


def _safe_int(value) -> int | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    return int(value)


def _downsample(df: pd.DataFrame, max_points: int = 500) -> pd.DataFrame:
    if len(df) <= max_points:
        return df
    indices = np.linspace(0, len(df) - 1, max_points, dtype=int)
    return df.iloc[indices]


class FastF1Service:
    def __init__(self) -> None:
        self._initialized = False
        self._session_cache: dict[int, Any] = {}
        self._schedule_cache: pd.DataFrame | None = None
        self._latest_round: int | None = None

    def _ensure_cache(self) -> None:
        if not self._initialized:
            settings.cache_path.mkdir(parents=True, exist_ok=True)
            fastf1.Cache.enable_cache(str(settings.cache_path))
            self._initialized = True

    def _load_session_sync(self, season: int, round_num: int):
        self._ensure_cache()
        if round_num in self._session_cache:
            return self._session_cache[round_num]
        session = fastf1.get_session(season, round_num, "R")
        session.load(laps=True, telemetry=True, weather=False, messages=False)
        self._session_cache[round_num] = session
        return session

    async def load_session(self, season: int, round_num: int):
        return await _run_sync(self._load_session_sync, season, round_num)

    def _get_schedule_sync(self, season: int) -> pd.DataFrame:
        self._ensure_cache()
        if self._schedule_cache is not None:
            return self._schedule_cache
        schedule = fastf1.get_event_schedule(season, include_testing=False)
        self._schedule_cache = schedule
        return schedule

    async def get_schedule(self, season: int) -> list[dict]:
        schedule = await _run_sync(self._get_schedule_sync, season)
        events = []
        for _, row in schedule.iterrows():
            round_num = _safe_int(row.get("RoundNumber"))
            if round_num is None or round_num <= 0:
                continue
            race_dt = row.get("Session5DateUtc")
            race_iso = None
            if race_dt is not None and not pd.isna(race_dt):
                if hasattr(race_dt, "isoformat"):
                    race_iso = race_dt.isoformat()
                else:
                    race_iso = str(race_dt)
            event_date = row.get("EventDate")
            events.append(
                {
                    "round": round_num,
                    "country": str(row.get("Country", "")),
                    "location": str(row.get("Location", "")),
                    "event_name": str(row.get("EventName", "")),
                    "event_date": event_date.isoformat() if hasattr(event_date, "isoformat") else None,
                    "race_datetime_utc": race_iso,
                    "f1_api_support": bool(row.get("F1ApiSupport", True)),
                }
            )
        return events

    def _detect_latest_round_sync(self, season: int) -> int | None:
        schedule = self._get_schedule_sync(season)
        now = datetime.now(timezone.utc)
        latest = None
        for _, row in schedule.iterrows():
            round_num = _safe_int(row.get("RoundNumber"))
            if round_num is None or round_num <= 0:
                continue
            race_dt = row.get("Session5DateUtc")
            if race_dt is None or pd.isna(race_dt):
                continue
            if hasattr(race_dt, "tzinfo") and race_dt.tzinfo is None:
                race_dt = race_dt.replace(tzinfo=timezone.utc)
            if race_dt <= now:
                latest = round_num
        self._latest_round = latest
        return latest

    async def get_latest_round(self, season: int) -> int | None:
        return await _run_sync(self._detect_latest_round_sync, season)

    async def preload_latest(self, season: int) -> int | None:
        latest = await self.get_latest_round(season)
        if latest is not None:
            try:
                await self.load_session(season, latest)
            except Exception:
                pass
        return latest

    async def get_latest_race_info(self, season: int) -> dict | None:
        latest = await self.get_latest_round(season)
        if latest is None:
            return None
        schedule = await self.get_schedule(season)
        event = next((e for e in schedule if e["round"] == latest), None)
        if not event:
            return None
        loaded = latest in self._session_cache
        return {
            "round": latest,
            "event_name": event["event_name"],
            "country": event["country"],
            "session_loaded": loaded,
            "race_datetime_utc": event.get("race_datetime_utc"),
        }

    async def get_countdown(self, season: int) -> dict:
        schedule = await self.get_schedule(season)
        now = datetime.now(timezone.utc)
        next_event = None
        seconds_until = None
        for event in schedule:
            race_iso = event.get("race_datetime_utc")
            if not race_iso:
                continue
            race_dt = pd.Timestamp(race_iso).tz_convert("UTC").to_pydatetime()
            if race_dt > now:
                next_event = event
                seconds_until = int((race_dt - now).total_seconds())
                break
        is_race_weekend = False
        if next_event:
            race_dt = pd.Timestamp(next_event["race_datetime_utc"]).tz_convert("UTC").to_pydatetime()
            days = (race_dt - now).days
            is_race_weekend = days <= 3
        return {
            "next_event": next_event,
            "seconds_until_race": seconds_until,
            "is_race_weekend": is_race_weekend,
        }

    async def get_drivers(self, season: int, round_num: int) -> list[dict]:
        session = await self.load_session(season, round_num)
        results = session.results
        drivers = []
        for _, row in results.iterrows():
            drivers.append(
                {
                    "driver_number": _safe_int(row.get("DriverNumber")),
                    "abbreviation": str(row.get("Abbreviation", "")),
                    "full_name": str(row.get("FullName", "")),
                    "team": str(row.get("TeamName", "")),
                    "team_color": str(row.get("TeamColor", "")) if row.get("TeamColor") else None,
                    "position": _safe_int(row.get("Position")),
                }
            )
        return drivers

    async def get_telemetry(
        self, season: int, round_num: int, driver: str, lap: str | int = "fastest"
    ) -> dict:
        session = await self.load_session(season, round_num)
        driver_laps = session.laps.pick_drivers(driver)
        if driver_laps.empty:
            raise ValueError(f"No laps found for driver {driver}")
        if lap == "fastest":
            target_lap = driver_laps.pick_fastest()
        else:
            target_lap = driver_laps[driver_laps["LapNumber"] == int(lap)].iloc[0]
        car_data = target_lap.get_telemetry()
        car_data = _downsample(car_data)
        points = []
        for _, row in car_data.iterrows():
            dist = row.get("Distance")
            if dist is None or (isinstance(dist, float) and pd.isna(dist)):
                dist = row.get("RelativeDistance")
            if dist is None or (isinstance(dist, float) and pd.isna(dist)):
                continue
            brake_val = row.get("Brake")
            brake_num = float(brake_val) if isinstance(brake_val, (int, float)) and pd.notna(brake_val) else (1.0 if brake_val else 0.0)
            points.append(
                {
                    "distance": float(dist),
                    "speed": float(row["Speed"]) if "Speed" in row and pd.notna(row["Speed"]) else None,
                    "throttle": float(row["Throttle"]) if "Throttle" in row and pd.notna(row["Throttle"]) else None,
                    "brake": brake_num,
                    "gear": _safe_int(row["nGear"]) if "nGear" in row else None,
                }
            )
        return {
            "round": round_num,
            "driver": driver.upper(),
            "lap_number": _safe_int(target_lap["LapNumber"]) or 0,
            "lap_time_seconds": _timedelta_to_seconds(target_lap.get("LapTime")),
            "points": points,
        }

    async def get_lap_times(self, season: int, round_num: int, driver: str) -> dict:
        session = await self.load_session(season, round_num)
        driver_laps = session.laps.pick_drivers(driver).pick_accurate_laps()
        laps = []
        for _, row in driver_laps.iterrows():
            laps.append(
                {
                    "lap_number": _safe_int(row["LapNumber"]) or 0,
                    "lap_time_seconds": _timedelta_to_seconds(row.get("LapTime")),
                    "compound": str(row["Compound"]) if pd.notna(row.get("Compound")) else None,
                    "tyre_life": _safe_int(row.get("TyreLife")),
                    "position": _safe_int(row.get("Position")),
                }
            )
        return {"round": round_num, "driver": driver.upper(), "laps": laps}

    async def get_positions(self, season: int, round_num: int, top_n: int | None = None) -> dict:
        session = await self.load_session(season, round_num)
        laps = session.laps.pick_accurate_laps()
        drivers = laps["Driver"].unique().tolist()
        if top_n:
            results = session.results.sort_values("Position")
            drivers = results["Abbreviation"].head(top_n).tolist()
        series = []
        team_colors = {
            str(r["Abbreviation"]): str(r["TeamColor"]) if pd.notna(r.get("TeamColor")) else None
            for _, r in session.results.iterrows()
        }
        for drv in drivers:
            drv_laps = laps[laps["Driver"] == drv].sort_values("LapNumber")
            points = [
                {"lap_number": _safe_int(r["LapNumber"]), "position": _safe_int(r["Position"])}
                for _, r in drv_laps.iterrows()
                if _safe_int(r.get("Position")) is not None
            ]
            series.append({"driver": drv, "team_color": team_colors.get(drv), "points": points})
        return {"round": round_num, "series": series}

    async def get_tyre_strategy(self, season: int, round_num: int, driver: str) -> dict:
        session = await self.load_session(season, round_num)
        driver_laps = session.laps.pick_drivers(driver).pick_accurate_laps()
        if driver_laps.empty:
            raise ValueError(f"No laps found for driver {driver}")
        stints = []
        for stint_num, stint_laps in driver_laps.groupby("Stint"):
            stint_laps = stint_laps.sort_values("LapNumber")
            compound = stint_laps["Compound"].iloc[0]
            if pd.isna(compound):
                compound = "UNKNOWN"
            pit_in = stint_laps["PitInTime"].iloc[-1]
            stints.append(
                {
                    "stint": int(stint_num),
                    "compound": str(compound),
                    "start_lap": _safe_int(stint_laps["LapNumber"].iloc[0]) or 0,
                    "end_lap": _safe_int(stint_laps["LapNumber"].iloc[-1]) or 0,
                    "tyre_life_start": _safe_int(stint_laps["TyreLife"].iloc[0]),
                    "pit_in_time": str(pit_in) if pd.notna(pit_in) else None,
                }
            )
        return {"round": round_num, "driver": driver.upper(), "stints": stints}

    async def get_pace_gap(
        self, season: int, round_num: int, driver: str, reference: str = "leader"
    ) -> dict:
        session = await self.load_session(season, round_num)
        laps = session.laps.pick_accurate_laps()
        driver_laps = laps[laps["Driver"] == driver.upper()].sort_values("LapNumber")
        if driver_laps.empty:
            raise ValueError(f"No laps found for driver {driver}")

        ref_driver = reference.upper()
        if ref_driver == "LEADER":
            lap1 = laps[laps["LapNumber"] == 1]
            if not lap1.empty and lap1["Position"].notna().any():
                leader_row = lap1.loc[lap1["Position"].idxmin()]
                ref_driver = str(leader_row["Driver"])

        ref_laps = laps[laps["Driver"] == ref_driver].sort_values("LapNumber")
        ref_cumulative: dict[int, float] = {}
        cumulative = 0.0
        for _, row in ref_laps.iterrows():
            lt = _timedelta_to_seconds(row.get("LapTime"))
            if lt is not None:
                cumulative += lt
                ref_cumulative[_safe_int(row["LapNumber"]) or 0] = cumulative

        points = []
        cumulative = 0.0
        for _, row in driver_laps.iterrows():
            lap_num = _safe_int(row["LapNumber"]) or 0
            lt = _timedelta_to_seconds(row.get("LapTime"))
            if lt is not None:
                cumulative += lt
            ref_time = ref_cumulative.get(lap_num)
            gap = cumulative - ref_time if ref_time is not None else None
            points.append(
                {
                    "lap_number": lap_num,
                    "gap_seconds": round(gap, 3) if gap is not None else None,
                    "lap_time_seconds": lt,
                }
            )
        return {
            "round": round_num,
            "driver": driver.upper(),
            "reference": ref_driver,
            "points": points,
        }

    def build_telemetry_summary(self, telemetry_data: dict) -> dict:
        points = telemetry_data.get("points", [])
        if not points:
            return {}
        brakes = [p["brake"] for p in points if p.get("brake") is not None]
        throttles = [p["throttle"] for p in points if p.get("throttle") is not None]
        speeds = [p["speed"] for p in points if p.get("speed") is not None]
        brake_zones = sum(
            1
            for i in range(1, len(brakes))
            if brakes[i] > 0 and brakes[i - 1] == 0
        )
        return {
            "driver": telemetry_data.get("driver"),
            "lap_number": telemetry_data.get("lap_number"),
            "lap_time_seconds": telemetry_data.get("lap_time_seconds"),
            "avg_throttle_pct": round(sum(throttles) / len(throttles), 1) if throttles else None,
            "max_speed_kmh": round(max(speeds), 1) if speeds else None,
            "brake_zone_count": brake_zones,
            "full_throttle_pct": round(100 * sum(1 for t in throttles if t >= 99) / len(throttles), 1)
            if throttles
            else None,
        }

    def build_pace_gap_summary(self, pace_data: dict) -> dict:
        points = [p for p in pace_data.get("points", []) if p.get("gap_seconds") is not None]
        if not points:
            return {}
        gaps = [p["gap_seconds"] for p in points]
        max_gap_lap = max(points, key=lambda p: p["gap_seconds"])
        min_gap_lap = min(points, key=lambda p: p["gap_seconds"])
        return {
            "driver": pace_data.get("driver"),
            "reference": pace_data.get("reference"),
            "start_gap": gaps[0],
            "end_gap": gaps[-1],
            "max_gap_seconds": max_gap_lap["gap_seconds"],
            "max_gap_lap": max_gap_lap["lap_number"],
            "min_gap_seconds": min_gap_lap["gap_seconds"],
            "min_gap_lap": min_gap_lap["lap_number"],
            "gap_change": round(gaps[-1] - gaps[0], 3),
        }


fastf1_service = FastF1Service()
