"use client";

import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";

export function PredictionsHistorySection({
  closed,
  limit = 12,
}: {
  closed: EnrichedPrediction[];
  limit?: number;
}) {
  const list = closed.slice(0, limit);
  if (!list.length) return null;

  return (
    <section className="bf-predict-history" aria-labelledby="predict-history-title">
      <h2 id="predict-history-title" className="bf-predict-pickem-section-title">
        Historial
        <span className="bf-predict-pickem-count">{closed.length}</span>
      </h2>
      <p className="bf-predict-history-lead">Partidos cerrados con resultado y tu acierto o fallo.</p>
      <div className="bf-predict-pickem-grid is-history">
        {list.map((e) => (
          <InteractiveVoteCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}
