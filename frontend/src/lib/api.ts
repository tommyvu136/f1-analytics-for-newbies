import type {
  ConstructorStanding,
  CountdownResponse,
  DriverInfo,
  DriverStanding,
  ExplainResponse,
  GlossaryResponse,
  LapTimesResponse,
  LatestRace,
  PaceGapResponse,
  PositionsResponse,
  ScheduleEvent,
  StandingsResponse,
  TelemetryResponse,
  TyreStrategyResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

export const api = {
  getSchedule: (season: number) => fetchApi<ScheduleEvent[]>(`/season/${season}/schedule`),
  getLatestRace: (season: number) => fetchApi<LatestRace>(`/season/${season}/latest-race`),
  getCountdown: (season: number) => fetchApi<CountdownResponse>(`/season/${season}/countdown`),
  getDrivers: (round: number) => fetchApi<DriverInfo[]>(`/race/${round}/drivers`),
  getTelemetry: (round: number, driver: string, lap = "fastest") =>
    fetchApi<TelemetryResponse>(`/race/${round}/telemetry?driver=${driver}&lap=${lap}`),
  getLapTimes: (round: number, driver: string) =>
    fetchApi<LapTimesResponse>(`/race/${round}/lap-times?driver=${driver}`),
  getPositions: (round: number, topN?: number) =>
    fetchApi<PositionsResponse>(
      `/race/${round}/positions${topN ? `?top_n=${topN}` : ""}`
    ),
  getTyreStrategy: (round: number, driver: string) =>
    fetchApi<TyreStrategyResponse>(`/race/${round}/tyre-strategy?driver=${driver}`),
  getPaceGap: (round: number, driver: string, reference = "leader") =>
    fetchApi<PaceGapResponse>(
      `/race/${round}/pace-gap?driver=${driver}&reference=${reference}`
    ),
  getDriverStandings: (season: number) =>
    fetchApi<StandingsResponse<DriverStanding>>(`/standings/drivers?season=${season}`),
  getConstructorStandings: (season: number) =>
    fetchApi<StandingsResponse<ConstructorStanding>>(
      `/standings/constructors?season=${season}`
    ),
  getGlossary: () => fetchApi<GlossaryResponse>("/explain/f1-glossary"),
  explainTelemetry: (driver: string, round?: number) =>
    fetchApi<ExplainResponse>("/explain/telemetry", {
      method: "POST",
      body: JSON.stringify({ driver, round }),
    }),
  explainPaceGap: (driver: string, round?: number) =>
    fetchApi<ExplainResponse>("/explain/pace-gap", {
      method: "POST",
      body: JSON.stringify({ driver, round }),
    }),
  explainAsk: (question: string) =>
    fetchApi<ExplainResponse>("/explain/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};
