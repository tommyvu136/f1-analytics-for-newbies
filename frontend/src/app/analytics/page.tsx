"use client";

import { useEffect, useState } from "react";
import AiPanel from "@/components/AiPanel";
import LapTimesChart from "@/components/charts/LapTimesChart";
import PaceGapChart from "@/components/charts/PaceGapChart";
import PositionsChart from "@/components/charts/PositionsChart";
import TelemetryChart from "@/components/charts/TelemetryChart";
import TyreStrategyChart from "@/components/charts/TyreStrategyChart";
import { RaceSelectors, useRaceContext } from "@/components/RaceContext";
import { api } from "@/lib/api";
import type {
  LapTimesResponse,
  PaceGapResponse,
  PositionsResponse,
  TelemetryResponse,
  TyreStrategyResponse,
} from "@/types";

type Tab = "telemetry" | "positions" | "tyres" | "pace";

const TABS: { id: Tab; label: string }[] = [
  { id: "telemetry", label: "Telemetry" },
  { id: "positions", label: "Positions" },
  { id: "tyres", label: "Tyre Strategy" },
  { id: "pace", label: "Pace Gap" },
];

export default function AnalyticsPage() {
  const ctx = useRaceContext();
  const [tab, setTab] = useState<Tab>("telemetry");
  const [telemetry, setTelemetry] = useState<TelemetryResponse | null>(null);
  const [lapTimes, setLapTimes] = useState<LapTimesResponse | null>(null);
  const [positions, setPositions] = useState<PositionsResponse | null>(null);
  const [tyres, setTyres] = useState<TyreStrategyResponse | null>(null);
  const [paceGap, setPaceGap] = useState<PaceGapResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (ctx.round === null || !ctx.driver) return;

    async function load() {
      setDataLoading(true);
      setDataError(null);
      try {
        if (tab === "telemetry") {
          const [tel, laps] = await Promise.all([
            api.getTelemetry(ctx.round!, ctx.driver),
            api.getLapTimes(ctx.round!, ctx.driver),
          ]);
          setTelemetry(tel);
          setLapTimes(laps);
        } else if (tab === "positions") {
          setPositions(await api.getPositions(ctx.round!, 10));
        } else if (tab === "tyres") {
          setTyres(await api.getTyreStrategy(ctx.round!, ctx.driver));
        } else if (tab === "pace") {
          setPaceGap(await api.getPaceGap(ctx.round!, ctx.driver));
        }
      } catch (e) {
        setDataError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [ctx.round, ctx.driver, tab]);

  if (ctx.loading) return <p className="text-f1-muted">Loading...</p>;
  if (ctx.error) return <p className="text-red-400">{ctx.error}</p>;

  const maxLap = tyres?.stints.length
    ? Math.max(...tyres.stints.map((s) => s.end_lap))
    : 60;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Race Analytics</h1>
        <RaceSelectors
          round={ctx.round}
          driver={ctx.driver}
          onRoundChange={ctx.setRound}
          onDriverChange={ctx.setDriver}
          schedule={ctx.schedule}
          drivers={ctx.drivers}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-f1-red text-white" : "bg-f1-card text-f1-muted hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {dataLoading && <p className="text-f1-muted">Loading session data (first load may take a minute)...</p>}
      {dataError && (
        <div className="card border-yellow-600/50">
          <p className="text-yellow-400">{dataError}</p>
          <p className="mt-1 text-sm text-f1-muted">
            Session data may not be available yet. Try an earlier round or check back after the race.
          </p>
        </div>
      )}

      {tab === "telemetry" && telemetry && lapTimes && (
        <div className="space-y-6">
          <TelemetryChart points={telemetry.points} driver={telemetry.driver} lapNumber={telemetry.lap_number} />
          <LapTimesChart laps={lapTimes.laps} driver={lapTimes.driver} />
          <AiPanel
            title="Telemetry Explained by AI"
            onExplain={() => api.explainTelemetry(ctx.driver, ctx.round ?? undefined)}
          />
        </div>
      )}

      {tab === "positions" && positions && <PositionsChart series={positions.series} />}

      {tab === "tyres" && tyres && (
        <TyreStrategyChart stints={tyres.stints} driver={tyres.driver} maxLap={maxLap} />
      )}

      {tab === "pace" && paceGap && (
        <div className="space-y-6">
          <PaceGapChart points={paceGap.points} driver={paceGap.driver} reference={paceGap.reference} />
          <AiPanel
            title="Pace Gap Explained by AI"
            onExplain={() => api.explainPaceGap(ctx.driver, ctx.round ?? undefined)}
          />
        </div>
      )}
    </div>
  );
}
