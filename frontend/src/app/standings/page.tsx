"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConstructorStanding, DriverStanding } from "@/types";
import { SEASON } from "@/types";

export default function StandingsPage() {
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getDriverStandings(SEASON), api.getConstructorStandings(SEASON)])
      .then(([d, c]) => {
        setDrivers(d.standings);
        setConstructors(c.standings);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-f1-muted">Loading standings...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">2026 Standings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-x-auto">
          <h2 className="mb-4 font-semibold text-f1-red">Drivers Championship</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1-border text-left text-f1-muted">
                <th className="pb-2 pr-4">Pos</th>
                <th className="pb-2 pr-4">Driver</th>
                <th className="pb-2 pr-4">Team</th>
                <th className="pb-2 pr-4">Wins</th>
                <th className="pb-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.driver_id} className="border-b border-f1-border/50">
                  <td className="py-2 pr-4 font-mono">{d.position}</td>
                  <td className="py-2 pr-4 font-medium">
                    {d.given_name} {d.family_name}
                    {d.code && <span className="ml-1 text-f1-muted">({d.code})</span>}
                  </td>
                  <td className="py-2 pr-4 text-f1-muted">{d.constructor}</td>
                  <td className="py-2 pr-4">{d.wins}</td>
                  <td className="py-2 font-mono font-bold text-f1-red">{d.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <h2 className="mb-4 font-semibold text-f1-red">Constructors Championship</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1-border text-left text-f1-muted">
                <th className="pb-2 pr-4">Pos</th>
                <th className="pb-2 pr-4">Team</th>
                <th className="pb-2 pr-4">Wins</th>
                <th className="pb-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((c) => (
                <tr key={c.constructor_id} className="border-b border-f1-border/50">
                  <td className="py-2 pr-4 font-mono">{c.position}</td>
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4">{c.wins}</td>
                  <td className="py-2 font-mono font-bold text-f1-red">{c.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
