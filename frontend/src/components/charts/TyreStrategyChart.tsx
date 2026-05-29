"use client";

import type { TyreStint } from "@/types";
import { COMPOUND_COLORS } from "@/types";

interface Props {
  stints: TyreStint[];
  driver: string;
  maxLap: number;
}

export default function TyreStrategyChart({ stints, driver, maxLap }: Props) {
  return (
    <div className="card">
      <h3 className="mb-4 font-semibold">Tyre Strategy — {driver}</h3>
      <div className="space-y-3">
        {stints.map((stint) => {
          const widthPct = ((stint.end_lap - stint.start_lap + 1) / maxLap) * 100;
          const leftPct = ((stint.start_lap - 1) / maxLap) * 100;
          const color = COMPOUND_COLORS[stint.compound.toUpperCase()] || COMPOUND_COLORS.UNKNOWN;
          return (
            <div key={stint.stint} className="relative h-10 rounded-lg bg-f1-bg">
              <div
                className="absolute top-1 h-8 rounded-md border border-white/10"
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 2)}%`,
                  backgroundColor: color,
                }}
                title={`${stint.compound} L${stint.start_lap}-${stint.end_lap}`}
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-black/70 mix-blend-difference">
                Stint {stint.stint}: {stint.compound} (L{stint.start_lap}–{stint.end_lap})
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-f1-muted">
        {Object.entries(COMPOUND_COLORS)
          .filter(([k]) => k !== "UNKNOWN")
          .map(([name, color]) => (
            <span key={name} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: color }} />
              {name}
            </span>
          ))}
      </div>
    </div>
  );
}
