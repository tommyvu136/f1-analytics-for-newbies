from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DriverInfo(BaseModel):
    driver_number: int | None = None
    abbreviation: str
    full_name: str
    team: str
    team_color: str | None = None
    position: int | None = None


class ScheduleEvent(BaseModel):
    round: int
    country: str
    location: str
    event_name: str
    event_date: str | None = None
    race_datetime_utc: str | None = None
    f1_api_support: bool = True


class LatestRace(BaseModel):
    round: int
    event_name: str
    country: str
    session_loaded: bool
    race_datetime_utc: str | None = None


class CountdownResponse(BaseModel):
    next_event: ScheduleEvent | None = None
    seconds_until_race: int | None = None
    is_race_weekend: bool = False


class TelemetryPoint(BaseModel):
    distance: float
    speed: float | None = None
    throttle: float | None = None
    brake: float | None = None
    gear: int | None = None


class TelemetryResponse(BaseModel):
    round: int
    driver: str
    lap_number: int
    lap_time_seconds: float | None = None
    points: list[TelemetryPoint]


class LapTimePoint(BaseModel):
    lap_number: int
    lap_time_seconds: float | None = None
    compound: str | None = None
    tyre_life: int | None = None
    position: int | None = None


class LapTimesResponse(BaseModel):
    round: int
    driver: str
    laps: list[LapTimePoint]


class PositionSeries(BaseModel):
    driver: str
    team_color: str | None = None
    points: list[dict[str, Any]]


class PositionsResponse(BaseModel):
    round: int
    series: list[PositionSeries]


class TyreStint(BaseModel):
    stint: int
    compound: str
    start_lap: int
    end_lap: int
    tyre_life_start: int | None = None
    pit_in_time: str | None = None


class TyreStrategyResponse(BaseModel):
    round: int
    driver: str
    stints: list[TyreStint]


class PaceGapPoint(BaseModel):
    lap_number: int
    gap_seconds: float | None = None
    lap_time_seconds: float | None = None


class PaceGapResponse(BaseModel):
    round: int
    driver: str
    reference: str
    points: list[PaceGapPoint]


class DriverStanding(BaseModel):
    position: int
    points: float
    wins: int
    driver_id: str
    code: str | None = None
    given_name: str
    family_name: str
    constructor: str


class ConstructorStanding(BaseModel):
    position: int
    points: float
    wins: int
    constructor_id: str
    name: str


class StandingsResponse(BaseModel):
    season: int
    round: int | None = None
    standings: list[Any]


class ExplainTelemetryRequest(BaseModel):
    round: int | None = None
    driver: str
    lap: str | int = "fastest"


class ExplainPaceGapRequest(BaseModel):
    round: int | None = None
    driver: str
    reference: str = "leader"


class ExplainAskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)


class ExplainResponse(BaseModel):
    explanation: str
    cached: bool = False


class GlossaryTerm(BaseModel):
    term: str
    definition: str
    example: str | None = None


class GlossaryResponse(BaseModel):
    terms: list[GlossaryTerm]
