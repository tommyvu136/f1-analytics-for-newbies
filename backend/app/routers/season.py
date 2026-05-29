from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas import CountdownResponse, LatestRace, ScheduleEvent
from app.services.fastf1_service import fastf1_service

router = APIRouter(prefix="/season", tags=["season"])


@router.get("/{season}/schedule", response_model=list[ScheduleEvent])
async def get_schedule(season: int):
    try:
        return await fastf1_service.get_schedule(season)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{season}/latest-race", response_model=LatestRace)
async def get_latest_race(season: int):
    info = await fastf1_service.get_latest_race_info(season)
    if not info:
        raise HTTPException(status_code=404, detail="No completed races found for this season")
    return info


@router.get("/{season}/countdown", response_model=CountdownResponse)
async def get_countdown(season: int):
    try:
        return await fastf1_service.get_countdown(season)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
