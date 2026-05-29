"use client";

import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { PredictMatchRow } from "@/components/platform/predictions/PredictMatchRow";
import { Clock } from "lucide-react";

export function PredictionsClosingSoon({ matches }: { matches: EnrichedPrediction[] }) {
  if (!matches.length) return null;

  return (
    <section className="bf-predict-quick-block is-closing" aria-labelledby="predict-closing-title">
      <div className="bf-predict-quick-head">
        <h2 id="predict-closing-title" className="bf-predict-pickem-section-title">
          <Clock size={13} aria-hidden /> Cierran pronto
        </h2>
        <p className="bf-predict-quick-hint">Mismo partido en la lista de abajo — vota antes de que empiece.</p>
      </div>
      <div className="bf-predict-quick-list">
        {matches.map((e) => (
          <PredictMatchRow key={e.id} event={e} showTime accent="closing" />
        ))}
      </div>
    </section>
  );
}
