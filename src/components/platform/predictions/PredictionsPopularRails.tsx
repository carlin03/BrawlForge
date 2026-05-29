"use client";

import { Scale, Users, Zap } from "lucide-react";
import type { EnrichedPrediction, PopularPickCategory } from "@/lib/data/predictions-ui";
import { PredictMatchRow } from "@/components/platform/predictions/PredictMatchRow";

const RAILS: { id: PopularPickCategory; title: string; icon: typeof Users; accent?: "upset" }[] = [
  { id: "most_voted", title: "Más votados", icon: Users },
  { id: "even", title: "Más igualados", icon: Scale },
  { id: "upset", title: "Upsets potenciales", icon: Zap, accent: "upset" },
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
    <section className="bf-predict-quick-block is-popular" aria-labelledby="predict-popular-title">
      <h2 id="predict-popular-title" className="bf-predict-pickem-section-title">
        Destacados de la comunidad
      </h2>
      <p className="bf-predict-quick-hint">Atajos rápidos — el voto completo está en Todos los partidos.</p>

      <div className="bf-predict-popular-cols">
        {RAILS.map((rail) => {
          const list = buckets[rail.id].filter((e) => e.matchId !== excludeId).slice(0, 2);
          if (!list.length) return null;
          const Icon = rail.icon;
          return (
            <div key={rail.id} className="bf-predict-popular-col">
              <h3 className="bf-predict-popular-col-title">
                <Icon size={13} aria-hidden /> {rail.title}
              </h3>
              <div className="bf-predict-quick-list">
                {list.map((e) => (
                  <PredictMatchRow key={e.id} event={e} accent={rail.accent} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
