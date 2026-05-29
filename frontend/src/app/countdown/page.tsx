"use client";

import { useEffect, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { api } from "@/lib/api";
import type { ScheduleEvent } from "@/types";
import { SEASON } from "@/types";

export default function CountdownPage() {
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSchedule(SEASON)
      .then((s) => setSchedule(s.filter((e) => e.round > 0)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-f1-muted">Loading schedule...</p>;

  const now = Date.now();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">2026 Grand Prix Countdown</h1>

      <div className="grid gap-4">
        {schedule.map((event) => {
          const raceTime = event.race_datetime_utc
            ? new Date(event.race_datetime_utc).getTime()
            : null;
          const isPast = raceTime !== null && raceTime < now;
          const isNext =
            raceTime !== null &&
            raceTime > now &&
            !schedule.some(
              (e) =>
                e.race_datetime_utc &&
                new Date(e.race_datetime_utc).getTime() > now &&
                new Date(e.race_datetime_utc).getTime() < raceTime
            );
          const secondsUntil =
            raceTime && raceTime > now ? Math.floor((raceTime - now) / 1000) : null;

          return (
            <div
              key={event.round}
              className={`card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
                isNext ? "border-f1-red/50" : ""
              } ${isPast ? "opacity-60" : ""}`}
            >
              <div>
                <p className="text-xs text-f1-muted">Round {event.round}</p>
                <p className="font-semibold">{event.event_name}</p>
                <p className="text-sm text-f1-muted">
                  {event.location}, {event.country}
                </p>
                {event.race_datetime_utc && (
                  <p className="mt-1 text-xs text-f1-muted">
                    {new Date(event.race_datetime_utc).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                {isPast && <span className="text-sm text-f1-muted">Completed</span>}
                {isNext && secondsUntil !== null && (
                  <CountdownTimer secondsUntil={secondsUntil} compact />
                )}
                {!isPast && !isNext && raceTime && (
                  <span className="text-sm text-f1-muted">Upcoming</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
