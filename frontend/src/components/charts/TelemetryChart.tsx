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
import type { TelemetryPoint } from "@/types";

interface Props {
  points: TelemetryPoint[];
  driver: string;
  lapNumber: number;
}

export default function TelemetryChart({ points, driver, lapNumber }: Props) {
  const data = points.map((p) => ({
    distance: Math.round(p.distance),
    throttle: p.throttle,
    brake: p.brake ? p.brake * 100 : 0,
    speed: p.speed,
  }));

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold">
        Telemetry — {driver} (Lap {lapNumber})
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis dataKey="distance" stroke="#8888a0" label={{ value: "Distance (m)", position: "insideBottom", offset: -5, fill: "#8888a0" }} />
          <YAxis yAxisId="left" stroke="#8888a0" domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" stroke="#8888a0" domain={[0, 350]} />
          <Tooltip contentStyle={{ background: "#14141f", border: "1px solid #2a2a3a" }} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="throttle" stroke="#22c55e" dot={false} name="Throttle %" strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="brake" stroke="#ef4444" dot={false} name="Brake %" strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#60a5fa" dot={false} name="Speed km/h" strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
