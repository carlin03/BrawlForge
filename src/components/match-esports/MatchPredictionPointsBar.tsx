"use client";

import type { MatchPredictionPoints } from "@/lib/data/match-meta";

const ROWS: { key: keyof MatchPredictionPoints; label: string }[] = [
  { key: "winner", label: "Ganador" },
  { key: "exact_score", label: "Resultado exacto" },
  { key: "mvp", label: "MVP" },
  { key: "map_winner", label: "Mapa correcto" },
  { key: "map_pick", label: "Pick correcto" },
  { key: "brawler_ban", label: "Ban correcto" },
  { key: "brawler_mvp", label: "Brawler MVP" },
  { key: "brawler_most_used", label: "Brawler más usado" },
  { key: "brawler_most_banned", label: "Brawler más bloqueado" },
  { key: "brawler_lowest_wr", label: "Brawler menor WR" },
  { key: "participation", label: "Participar" },
  { key: "perfect_bonus", label: "Bonus perfecto" },
];

export function MatchPredictionPointsBar({ points }: { points: MatchPredictionPoints }) {
  const items = ROWS.filter((r) => points[r.key] != null && (points[r.key] ?? 0) > 0);
  if (!items.length) return null;

  return (
    <div className="bf-predict-points-bar" role="list" aria-label="Puntos por predicción">
      {items.map(({ key, label }) => (
        <div key={key} className="bf-predict-points-chip" role="listitem">
          <span className="bf-predict-points-label">{label}</span>
          <span className="bf-predict-points-value">+{points[key]}</span>
        </div>
      ))}
    </div>
  );
}
