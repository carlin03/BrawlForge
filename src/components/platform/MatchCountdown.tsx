"use client";

import { useEffect, useState } from "react";

function formatCountdown(dateStr: string): string | null {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 48) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function MatchCountdown({
  dateStr,
  className,
  prefix,
}: {
  dateStr: string;
  className?: string;
  prefix?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(formatCountdown(dateStr));
    tick();
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, [dateStr]);

  if (!label) return null;

  return (
    <span className={className}>
      {prefix}
      {label}
    </span>
  );
}
