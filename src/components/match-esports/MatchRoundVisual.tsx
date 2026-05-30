"use client";

import { MATCH_ROUND_OPTIONS } from "@/lib/data/match-round-types";

const ROUND_STYLES: Record<string, { className: string; short: string }> = {
  "Group Stage": { className: "is-group", short: "Grupos" },
  "Swiss Stage": { className: "is-swiss", short: "Swiss" },
  "Round of 16": { className: "is-ro16", short: "R16" },
  Quarterfinal: { className: "is-quarter", short: "Cuartos" },
  Semifinal: { className: "is-semi", short: "Semis" },
  "Grand Final": { className: "is-final", short: "Final" },
  "Third Place Match": { className: "is-third", short: "3º" },
  "Upper Bracket": { className: "is-upper", short: "Upper" },
  "Lower Bracket": { className: "is-lower", short: "Lower" },
  "Winner Bracket": { className: "is-winner", short: "Winner" },
  "Loser Bracket": { className: "is-loser", short: "Loser" },
};

export function MatchRoundVisual({ stage, size = "md" }: { stage: string; size?: "sm" | "md" | "lg" }) {
  const opt = MATCH_ROUND_OPTIONS.find((o) => o.id === stage);
  const label = opt?.label ?? stage;
  const style = ROUND_STYLES[stage] ?? { className: "is-other", short: label.slice(0, 8) };

  return (
    <span
      className={`bf-round-visual ${style.className} is-size-${size}`}
      title={label}
      aria-label={`Ronda: ${label}`}
    >
      <span className="bf-round-visual-icon" aria-hidden />
      <span className="bf-round-visual-label">{label}</span>
    </span>
  );
}
