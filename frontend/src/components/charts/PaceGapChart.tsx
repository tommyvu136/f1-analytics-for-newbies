"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PaceGapPoint } from "@/types";

interface Props {
  points: PaceGapPoint[];
  driver: string;
  reference: string;
}

export default function PaceGapChart({ points, driver, reference }: Props) {
  const data = points.filter((p) => p.gap_seconds !== null);

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold">
        Pace Gap — {driver} vs {reference}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis dataKey="lap_number" stroke="#8888a0" label={{ value: "Lap", position: "insideBottom", offset: -5, fill: "#8888a0" }} />
          <YAxis stroke="#8888a0" tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}s`} />
          <Tooltip
            contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a" }}
            formatter={(value: number) => [`${value > 0 ? "+" : ""}${value.toFixed(3)}s`, "Gap"]}
          />
          <Area type="monotone" dataKey="gap_seconds" stroke="#e10600" fill="#e1060033" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
