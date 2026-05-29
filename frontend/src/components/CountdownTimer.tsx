"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  secondsUntil: number | null;
  eventName?: string;
  compact?: boolean;
}

function formatCountdown(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function CountdownTimer({ secondsUntil, eventName, compact }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(secondsUntil);

  useEffect(() => {
    setRemaining(secondsUntil);
  }, [secondsUntil]);

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => (r !== null && r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  if (remaining === null) {
    return <p className="text-f1-muted">Season complete</p>;
  }

  if (compact) {
    return (
      <span className="font-mono text-lg font-bold text-f1-red">
        {formatCountdown(remaining)}
      </span>
    );
  }

  return (
    <div className="card text-center">
      {eventName && <p className="mb-1 text-sm text-f1-muted">Next race</p>}
      {eventName && <p className="mb-3 font-semibold">{eventName}</p>}
      <p className="font-mono text-4xl font-black tracking-wider text-f1-red">
        {formatCountdown(remaining)}
      </p>
    </div>
  );
}
