"use client";

import { Scale, Users } from "lucide-react";
import type { EnrichedPrediction, PopularPickCategory } from "@/lib/data/predictions-ui";
import { PredictCompactPickCard } from "@/components/platform/predictions/PredictCompactPickCard";

const RAILS: { id: PopularPickCategory; title: string; icon: typeof Users }[] = [
  { id: "most_voted", title: "Más votados", icon: Users },
  { id: "even", title: "Más igualados", icon: Scale },
  { id: "controversial", title: "Más polémicos", icon: Scale },
];

export function PredictionsPopularRails({
  buckets,
  excludeId,
}: {
  buckets: Record<PopularPickCategory, EnrichedPrediction[]>;
  excludeId?: string;
}) {
  const hasAny = RAILS.some((r) => buckets[r.id].some((e) => e.matchId !== excludeId));
  if (!hasAny) return null;

  return (
    <section className="bf-predict-popular-compact" aria-labelledby="predict-popular-title">
      <h2 id="predict-popular-title" className="bf-predict-pickem-section-title">
        Partidos populares
      </h2>
      <div className="bf-predict-popular-compact-grid">
        {RAILS.map((rail) => {
          const list = buckets[rail.id].filter((e) => e.matchId !== excludeId).slice(0, 3);
          if (!list.length) return null;
          const Icon = rail.icon;
          return (
            <div key={rail.id} className="bf-predict-popular-col">
              <h3>
                <Icon size={12} aria-hidden /> {rail.title}
              </h3>
              <div className="bf-predict-popular-col-list">
                {list.map((e) => (
                  <PredictCompactPickCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
