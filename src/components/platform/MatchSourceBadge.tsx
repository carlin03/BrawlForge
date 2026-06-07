"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import { getMatchDataSource, getMatchDataSourceLabel } from "@/lib/data/match-data-source";

export function MatchSourceBadge({ match, className = "" }: { match: EsportsMatch; className?: string }) {
  const label = getMatchDataSourceLabel(match);
  if (!label) return null;
  const src = getMatchDataSource(match);
  const chipClass =
    src === "bsc-official" ? "bp-chip bp-chip-gold" : "bp-chip bp-chip-muted bf-chip-liquipedia";
  return (
    <span className={`${chipClass} ${className}`.trim()} title={label}>
      {label}
    </span>
  );
}
