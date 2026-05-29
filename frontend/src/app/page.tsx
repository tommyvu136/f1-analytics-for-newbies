"use client";

import { useEffect, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { api } from "@/lib/api";
import type { ConstructorStanding, CountdownResponse, DriverStanding, LatestRace } from "@/types";
import { SEASON } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const [latest, setLatest] = useState<LatestRace | null>(null);
  const [countdown, setCountdown] = useState<CountdownResponse | null>(null);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLatestRace(SEASON),
      api.getCountdown(SEASON),
      api.getDriverStandings(SEASON),
      api.getConstructorStandings(SEASON),
    ])
      .then(([lat, cd, ds, cs]) => {
        setLatest(lat);
        setCountdown(cd);
        setDrivers(ds.standings.slice(0, 5));
        setConstructors(cs.standings.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-f1-muted">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="card border-f1-red/40 bg-gradient-to-br from-f1-card to-red-950/20">
        <h1 className="mb-2 text-3xl font-black">F1 Analytics for Noobs</h1>
        <p className="mb-4 max-w-2xl text-f1-muted">
          Race data from FastF1, explained in plain English by AI. Perfect if you&apos;re new to Formula 1
          and want to understand telemetry, tyre strategy, and pace gaps.
        </p>
        {latest && (
          <p className="text-sm">
            Latest race:{" "}
            <span className="font-semibold text-white">
              R{latest.round} — {latest.event_name}
            </span>
            {latest.session_loaded && (
              <span className="ml-2 rounded bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                Data loaded
              </span>
            )}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/analytics" className="btn-primary">
            Explore Race Analytics
          </Link>
          <Link href="/noobs" className="btn-secondary">
            Learn F1 Basics
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {countdown && (
            <CountdownTimer
              secondsUntil={countdown.seconds_until_race}
              eventName={countdown.next_event?.event_name}
            />
          )}
        </div>

        <div className="card lg:col-span-1">
          <h2 className="mb-3 font-semibold">Driver Standings (Top 5)</h2>
          <ul className="space-y-2">
            {drivers.map((d) => (
              <li key={d.driver_id} className="flex justify-between text-sm">
                <span>
                  P{d.position} {d.given_name} {d.family_name}
                </span>
                <span className="font-mono text-f1-red">{d.points} pts</span>
              </li>
            ))}
          </ul>
          <Link href="/standings" className="mt-3 inline-block text-sm text-f1-red hover:underline">
            View all →
          </Link>
        </div>

        <div className="card lg:col-span-1">
          <h2 className="mb-3 font-semibold">Constructor Standings (Top 5)</h2>
          <ul className="space-y-2">
            {constructors.map((c) => (
              <li key={c.constructor_id} className="flex justify-between text-sm">
                <span>
                  P{c.position} {c.name}
                </span>
                <span className="font-mono text-f1-red">{c.points} pts</span>
              </li>
            ))}
          </ul>
          <Link href="/standings" className="mt-3 inline-block text-sm text-f1-red hover:underline">
            View all →
          </Link>
        </div>
      </div>
    </div>
  );
}
