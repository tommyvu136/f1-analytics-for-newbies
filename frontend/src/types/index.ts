export interface DriverInfo {
  driver_number: number | null;
  abbreviation: string;
  full_name: string;
  team: string;
  team_color: string | null;
  position: number | null;
}

export interface ScheduleEvent {
  round: number;
  country: string;
  location: string;
  event_name: string;
  event_date: string | null;
  race_datetime_utc: string | null;
  f1_api_support: boolean;
}

export interface LatestRace {
  round: number;
  event_name: string;
  country: string;
  session_loaded: boolean;
  race_datetime_utc: string | null;
}

export interface CountdownResponse {
  next_event: ScheduleEvent | null;
  seconds_until_race: number | null;
  is_race_weekend: boolean;
}

export interface TelemetryPoint {
  distance: number;
  speed: number | null;
  throttle: number | null;
  brake: number | null;
  gear: number | null;
}

export interface TelemetryResponse {
  round: number;
  driver: string;
  lap_number: number;
  lap_time_seconds: number | null;
  points: TelemetryPoint[];
}

export interface LapTimePoint {
  lap_number: number;
  lap_time_seconds: number | null;
  compound: string | null;
  tyre_life: number | null;
  position: number | null;
}

export interface LapTimesResponse {
  round: number;
  driver: string;
  laps: LapTimePoint[];
}

export interface PositionSeries {
  driver: string;
  team_color: string | null;
  points: { lap_number: number; position: number }[];
}

export interface PositionsResponse {
  round: number;
  series: PositionSeries[];
}

export interface TyreStint {
  stint: number;
  compound: string;
  start_lap: number;
  end_lap: number;
  tyre_life_start: number | null;
  pit_in_time: string | null;
}

export interface TyreStrategyResponse {
  round: number;
  driver: string;
  stints: TyreStint[];
}

export interface PaceGapPoint {
  lap_number: number;
  gap_seconds: number | null;
  lap_time_seconds: number | null;
}

export interface PaceGapResponse {
  round: number;
  driver: string;
  reference: string;
  points: PaceGapPoint[];
}

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driver_id: string;
  code: string | null;
  given_name: string;
  family_name: string;
  constructor: string;
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructor_id: string;
  name: string;
}

export interface StandingsResponse<T> {
  season: number;
  round: number | null;
  standings: T[];
}

export interface ExplainResponse {
  explanation: string;
  cached: boolean;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example: string | null;
}

export interface GlossaryResponse {
  terms: GlossaryTerm[];
}

export const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#ef4444",
  MEDIUM: "#eab308",
  HARD: "#f8fafc",
  INTERMEDIATE: "#22c55e",
  WET: "#3b82f6",
  UNKNOWN: "#64748b",
};

export const SEASON = 2026;
