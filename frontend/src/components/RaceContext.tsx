"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DriverInfo, ScheduleEvent } from "@/types";
import { SEASON } from "@/types";

interface RaceContextProps {
  round: number | null;
  driver: string;
  onRoundChange: (round: number) => void;
  onDriverChange: (driver: string) => void;
}

export function useRaceContext() {
  const [round, setRound] = useState<number | null>(null);
  const [driver, setDriver] = useState("");
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [latest, sched] = await Promise.all([
          api.getLatestRace(SEASON),
          api.getSchedule(SEASON),
        ]);
        setSchedule(sched.filter((e) => e.round > 0));
        setRound(latest.round);
        const drv = await api.getDrivers(latest.round);
        setDrivers(drv);
        if (drv.length > 0) {
          setDriver(drv[0].abbreviation);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load race data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (round === null) return;
    api
      .getDrivers(round)
      .then((drv) => {
        setDrivers(drv);
        if (drv.length > 0 && !drv.find((d) => d.abbreviation === driver)) {
          setDriver(drv[0].abbreviation);
        }
      })
      .catch(() => setDrivers([]));
  }, [round]);

  return {
    round,
    setRound,
    driver,
    setDriver,
    drivers,
    schedule,
    loading,
    error,
  };
}

export function RaceSelectors({
  round,
  driver,
  onRoundChange,
  onDriverChange,
}: RaceContextProps & { schedule: ScheduleEvent[]; drivers: DriverInfo[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-f1-muted">
        Round
        <select
          className="select-input"
          value={round ?? ""}
          onChange={(e) => onRoundChange(Number(e.target.value))}
        >
          {schedule.map((e) => (
            <option key={e.round} value={e.round}>
              R{e.round} — {e.event_name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-f1-muted">
        Driver
        <select
          className="select-input"
          value={driver}
          onChange={(e) => onDriverChange(e.target.value)}
        >
          {drivers.map((d) => (
            <option key={d.abbreviation} value={d.abbreviation}>
              {d.abbreviation} — {d.full_name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
