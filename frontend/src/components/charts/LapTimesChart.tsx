"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LapTimePoint } from "@/types";

interface Props {
  laps: LapTimePoint[];
  driver: string;
}

export default function LapTimesChart({ laps, driver }: Props) {
  const data = laps
    .filter((l) => l.lap_time_seconds !== null)
    .map((l) => ({
      lap: l.lap_number,
      time: l.lap_time_seconds,
      compound: l.compound,
    }));

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold">Lap Times — {driver}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis dataKey="lap" stroke="#8888a0" label={{ value: "Lap", position: "insideBottom", offset: -5, fill: "#8888a0" }} />
          <YAxis stroke="#8888a0" domain={["auto", "auto"]} tickFormatter={(v) => `${Math.floor(v / 60)}:${(v % 60).toFixed(1).padStart(4, "0")}`} />
          <Tooltip
            contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a" }}
            formatter={(value: number) => [`${value.toFixed(3)}s`, "Lap time"]}
          />
          <Bar dataKey="time" fill="#e10600" opacity={0.3} />
          <Line type="monotone" dataKey="time" stroke="#e10600" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
