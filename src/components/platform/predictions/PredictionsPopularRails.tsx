"use client";

import { BarChart3, Scale, Sparkles, Users } from "lucide-react";
import type { EnrichedPrediction, PopularPickCategory } from "@/lib/data/predictions-ui";
import { PredictCompactPickCard } from "@/components/platform/predictions/PredictCompactPickCard";

const RAILS: {
  id: PopularPickCategory;
  title: string;
  hint: string;
  icon: typeof Users;
}[] = [
  { id: "most_voted", title: "Más votados", hint: "Donde más opina la comunidad", icon: Users },
  { id: "controversial", title: "Más polémicos", hint: "50/50 — cualquier lado puede ganar", icon: Scale },
  { id: "even", title: "Más igualados", hint: "Porcentajes casi idénticos", icon: BarChart3 },
  { id: "upset", title: "Mayor sorpresa", hint: "Underdog con opciones reales", icon: Sparkles },
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
    <div className="bf-predict-popular-block">
      <h2 className="bf-predict-v2-section-title">Partidos con más tensión</h2>
      <div className="bf-predict-popular-rails">
        {RAILS.map((rail) => {
          const list = buckets[rail.id].filter((e) => e.matchId !== excludeId).slice(0, 4);
          if (!list.length) return null;
          const Icon = rail.icon;
          return (
            <section key={rail.id} className="bf-predict-popular-rail">
              <div className="bf-predict-popular-rail-head">
                <h3>
                  <Icon size={14} aria-hidden /> {rail.title}
                </h3>
                <span>{rail.hint}</span>
              </div>
              <div className="bf-predict-popular-scroll">
                {list.map((e) => (
                  <PredictCompactPickCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
