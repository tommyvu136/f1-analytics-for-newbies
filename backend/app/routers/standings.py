from fastapi import APIRouter, HTTPException, Query

from app.schemas import StandingsResponse
from app.services.ergast_service import ergast_service

router = APIRouter(prefix="/standings", tags=["standings"])


@router.get("/drivers", response_model=StandingsResponse)
async def get_driver_standings(season: int = Query(2026)):
    try:
        standings = await ergast_service.get_driver_standings(season)
        return {"season": season, "round": None, "standings": standings}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch driver standings: {exc}") from exc


@router.get("/constructors", response_model=StandingsResponse)
async def get_constructor_standings(season: int = Query(2026)):
    try:
        standings = await ergast_service.get_constructor_standings(season)
        return {"season": season, "round": None, "standings": standings}
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch constructor standings: {exc}"
        ) from exc
