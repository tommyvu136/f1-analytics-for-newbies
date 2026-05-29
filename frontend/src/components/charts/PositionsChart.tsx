"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PositionSeries } from "@/types";

interface Props {
  series: PositionSeries[];
}

const COLORS = ["#e10600", "#60a5fa", "#22c55e", "#eab308", "#a855f7", "#f97316", "#ec4899", "#14b8a6", "#f43f5e", "#84cc16"];

export default function PositionsChart({ series }: Props) {
  const maxLap = Math.max(...series.flatMap((s) => s.points.map((p) => p.lap_number)), 1);
  const data = Array.from({ length: maxLap }, (_, i) => {
    const lap = i + 1;
    const row: Record<string, number | string> = { lap };
    for (const s of series) {
      const pt = s.points.find((p) => p.lap_number === lap);
      if (pt) row[s.driver] = pt.position;
    }
    return row;
  });

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold">Race Position Changes</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis dataKey="lap" stroke="#8888a0" />
          <YAxis stroke="#8888a0" reversed domain={[1, 22]} ticks={[1, 5, 10, 15, 20]} />
          <Tooltip contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a" }} />
          <Legend />
          {series.map((s, i) => (
            <Line
              key={s.driver}
              type="stepAfter"
              dataKey={s.driver}
              stroke={s.team_color ? `#${s.team_color}` : COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
