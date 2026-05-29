import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request

from app.config import settings
from app.schemas import (
    ExplainAskRequest,
    ExplainPaceGapRequest,
    ExplainResponse,
    ExplainTelemetryRequest,
    GlossaryResponse,
)
from app.services.fastf1_service import fastf1_service
from app.services.groq_service import groq_service

router = APIRouter(prefix="/explain", tags=["explain"])

_rate_limit: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 60


def _check_rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _rate_limit[ip] = [t for t in _rate_limit[ip] if now - t < RATE_WINDOW]
    if len(_rate_limit[ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Try again in a minute.")
    _rate_limit[ip].append(now)


async def _event_name(round_num: int) -> str:
    schedule = await fastf1_service.get_schedule(settings.season)
    event = next((e for e in schedule if e["round"] == round_num), None)
    return event["event_name"] if event else f"Round {round_num}"


@router.get("/f1-glossary", response_model=GlossaryResponse)
async def get_glossary():
    return {"terms": groq_service.get_glossary()}


@router.post("/telemetry", response_model=ExplainResponse)
async def explain_telemetry(body: ExplainTelemetryRequest, request: Request):
    _check_rate_limit(request)
    round_num = body.round
    if round_num is None:
        round_num = await fastf1_service.get_latest_round(settings.season)
        if round_num is None:
            raise HTTPException(status_code=404, detail="No race available")
    try:
        telemetry = await fastf1_service.get_telemetry(
            settings.season, round_num, body.driver, body.lap
        )
        summary = fastf1_service.build_telemetry_summary(telemetry)
        event = await _event_name(round_num)
        explanation, cached = await groq_service.explain_telemetry(summary, event)
        return {"explanation": explanation, "cached": cached}
    except ValueError as exc:
        if "GROQ_API_KEY" in str(exc):
            raise HTTPException(status_code=503, detail="AI explanations not configured") from exc
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/pace-gap", response_model=ExplainResponse)
async def explain_pace_gap(body: ExplainPaceGapRequest, request: Request):
    _check_rate_limit(request)
    round_num = body.round
    if round_num is None:
        round_num = await fastf1_service.get_latest_round(settings.season)
        if round_num is None:
            raise HTTPException(status_code=404, detail="No race available")
    try:
        pace = await fastf1_service.get_pace_gap(
            settings.season, round_num, body.driver, body.reference
        )
        summary = fastf1_service.build_pace_gap_summary(pace)
        event = await _event_name(round_num)
        explanation, cached = await groq_service.explain_pace_gap(summary, event)
        return {"explanation": explanation, "cached": cached}
    except ValueError as exc:
        if "GROQ_API_KEY" in str(exc):
            raise HTTPException(status_code=503, detail="AI explanations not configured") from exc
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/ask", response_model=ExplainResponse)
async def explain_ask(body: ExplainAskRequest, request: Request):
    _check_rate_limit(request)
    try:
        explanation, cached = await groq_service.ask(body.question)
        return {"explanation": explanation, "cached": cached}
    except ValueError as exc:
        raise HTTPException(status_code=503, detail="AI explanations not configured") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
