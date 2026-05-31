"use client";

import type { MatchPredictionPoints } from "@/lib/data/match-meta";
import { PREDICTION_POINTS_BAR_ROWS } from "@/lib/predictions/match-prediction-defaults";

const TIER_ORDER: Array<"serie" | "mapas" | "brawlers" | "bonus"> = [
  "serie",
  "mapas",
  "brawlers",
  "bonus",
];

export function MatchPredictionPointsBar({ points }: { points: MatchPredictionPoints }) {
  const byTier = new Map<string, typeof PREDICTION_POINTS_BAR_ROWS>();
  for (const row of PREDICTION_POINTS_BAR_ROWS) {
    const pts = points[row.key];
    if (pts == null || pts <= 0) continue;
    const list = byTier.get(row.tier) ?? [];
    list.push(row);
    byTier.set(row.tier, list);
  }

  const tiers = TIER_ORDER.filter((t) => byTier.has(t));
  if (!tiers.length) return null;

  return (
    <div className="bf-predict-points-bar" role="list" aria-label="Puntos por predicción">
      {tiers.map((tier) => {
        const rows = byTier.get(tier)!;
        const tierLabel = rows[0]?.tierLabel ?? tier;
        return (
          <div key={tier} className="bf-predict-points-tier" role="group" aria-label={tierLabel}>
            <span className="bf-predict-points-tier-label">{tierLabel}</span>
            <div className="bf-predict-points-tier-chips">
              {rows.map(({ key, label }) => (
                <div key={key} className="bf-predict-points-chip" role="listitem">
                  <span className="bf-predict-points-label">{label}</span>
                  <span className="bf-predict-points-value">+{points[key]}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
