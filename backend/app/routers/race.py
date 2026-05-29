from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.schemas import (
    DriverInfo,
    LapTimesResponse,
    PaceGapResponse,
    PositionsResponse,
    TelemetryResponse,
    TyreStrategyResponse,
)
from app.services.fastf1_service import fastf1_service

router = APIRouter(prefix="/race", tags=["race"])


async def _resolve_round(round_num: int | None) -> int:
    if round_num is not None:
        return round_num
    latest = await fastf1_service.get_latest_round(settings.season)
    if latest is None:
        raise HTTPException(status_code=404, detail="No completed race available")
    return latest


@router.get("/{round}/drivers", response_model=list[DriverInfo])
async def get_drivers(round: int):
    try:
        return await fastf1_service.get_drivers(settings.season, round)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/latest/drivers", response_model=list[DriverInfo])
async def get_latest_drivers():
    round_num = await _resolve_round(None)
    return await get_drivers(round_num)


@router.get("/{round}/telemetry", response_model=TelemetryResponse)
async def get_telemetry(
    round: int,
    driver: str = Query(..., min_length=2, max_length=3),
    lap: str = Query("fastest"),
):
    try:
        return await fastf1_service.get_telemetry(settings.season, round, driver, lap)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{round}/lap-times", response_model=LapTimesResponse)
async def get_lap_times(round: int, driver: str = Query(..., min_length=2, max_length=3)):
    try:
        return await fastf1_service.get_lap_times(settings.season, round, driver)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{round}/positions", response_model=PositionsResponse)
async def get_positions(round: int, top_n: int | None = Query(None, ge=1, le=22)):
    try:
        return await fastf1_service.get_positions(settings.season, round, top_n)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{round}/tyre-strategy", response_model=TyreStrategyResponse)
async def get_tyre_strategy(round: int, driver: str = Query(..., min_length=2, max_length=3)):
    try:
        return await fastf1_service.get_tyre_strategy(settings.season, round, driver)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{round}/pace-gap", response_model=PaceGapResponse)
async def get_pace_gap(
    round: int,
    driver: str = Query(..., min_length=2, max_length=3),
    reference: str = Query("leader"),
):
    try:
        return await fastf1_service.get_pace_gap(settings.season, round, driver, reference)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
