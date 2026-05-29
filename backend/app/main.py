from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import explain, race, season, standings
from app.services.fastf1_service import fastf1_service

scheduler = AsyncIOScheduler()


async def refresh_latest_race():
    await fastf1_service.preload_latest(settings.season)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await refresh_latest_race()
    scheduler.add_job(refresh_latest_race, "interval", hours=6, id="refresh_latest")
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="F1 Analytics for Noobs API",
    description="Backend API for F1 analytics with FastF1 and Groq explanations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.post("/refresh")
async def manual_refresh():
    latest = await refresh_latest_race()
    return {"status": "ok", "latest_round": latest}


app.include_router(season.router, prefix="/api/v1")
app.include_router(race.router, prefix="/api/v1")
app.include_router(standings.router, prefix="/api/v1")
app.include_router(explain.router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.get("/health")
async def health():
    latest = await fastf1_service.get_latest_round(settings.season)
    return {"status": "ok", "season": settings.season, "latest_round": latest}
