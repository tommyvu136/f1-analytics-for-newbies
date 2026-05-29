import asyncio
from datetime import datetime, timezone
from functools import partial
from typing import Any

import httpx
import pandas as pd

from app.config import settings


class ErgastService:
    def __init__(self) -> None:
        self._cache: dict[str, tuple[datetime, Any]] = {}
        self._cache_ttl = 3600

    def _get_cached(self, key: str) -> Any | None:
        if key in self._cache:
            ts, data = self._cache[key]
            if (datetime.now(timezone.utc) - ts).total_seconds() < self._cache_ttl:
                return data
        return None

    def _set_cached(self, key: str, data: Any) -> None:
        self._cache[key] = (datetime.now(timezone.utc), data)

    async def _fetch_all(self, path: str) -> list[dict]:
        cache_key = path
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        url = f"{settings.jolpica_base_url}/{path}.json"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params={"limit": 100, "offset": 0})
            response.raise_for_status()
            payload = response.json()

        mr = payload.get("MRData", {})
        table_key = next((k for k in mr if k.endswith("Table")), None)
        if not table_key:
            self._set_cached(cache_key, [])
            return []

        table = mr[table_key]
        results: list[dict] = []

        # Current season format: StandingsLists[].DriverStandings / ConstructorStandings
        lists_key = next((k for k in table if k.endswith("Lists")), None)
        if lists_key and table.get(lists_key):
            for lst in table[lists_key]:
                row_key = next((k for k in lst if k.endswith("Standings")), None)
                if row_key:
                    results.extend(lst[row_key])
        elif "Standings" in table:
            results = table["Standings"]
        elif "Races" in table:
            results = table["Races"]

        self._set_cached(cache_key, results)
        return results

    async def get_driver_standings(self, season: int) -> list[dict]:
        rows = await self._fetch_all(f"{season}/driverStandings")
        standings = []
        for row in rows:
            driver = row["Driver"]
            constructors = row.get("Constructors", [{}])
            constructor = constructors[0] if constructors else {}
            standings.append(
                {
                    "position": int(row["position"]),
                    "points": float(row["points"]),
                    "wins": int(row["wins"]),
                    "driver_id": driver["driverId"],
                    "code": driver.get("code"),
                    "given_name": driver["givenName"],
                    "family_name": driver["familyName"],
                    "constructor": constructor.get("name", ""),
                }
            )
        return standings

    async def get_constructor_standings(self, season: int) -> list[dict]:
        rows = await self._fetch_all(f"{season}/constructorStandings")
        standings = []
        for row in rows:
            constructor = row["Constructor"]
            standings.append(
                {
                    "position": int(row["position"]),
                    "points": float(row["points"]),
                    "wins": int(row["wins"]),
                    "constructor_id": constructor["constructorId"],
                    "name": constructor["name"],
                }
            )
        return standings


ergast_service = ErgastService()
