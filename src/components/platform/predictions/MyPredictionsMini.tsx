"use client";

import { useMemo, useState } from "react";
import type { EnrichedPrediction } from "@/lib/data/predictions-ui";
import { MyPredictionRow } from "@/components/platform/predictions/MyPredictionRow";

type MineFilter = "pending" | "hit" | "miss";

export function MyPredictionsMini({ picks }: { picks: EnrichedPrediction[] }) {
  const [tab, setTab] = useState<MineFilter>("pending");

  const counts = useMemo(
    () => ({
      pending: picks.filter((e) => e.outcome === "pending").length,
      hit: picks.filter((e) => e.outcome === "hit").length,
      miss: picks.filter((e) => e.outcome === "miss").length,
    }),
    [picks],
  );

  const list = useMemo(() => picks.filter((e) => e.outcome === tab).slice(0, 4), [picks, tab]);

  if (!picks.length) return null;

  const tabs: { id: MineFilter; label: string }[] = [
    { id: "pending", label: "Pendientes" },
    { id: "hit", label: "Acertadas" },
    { id: "miss", label: "Falladas" },
  ];

  return (
    <section className="bf-predict-mine-mini" aria-labelledby="predict-mine-title">
      <h2 id="predict-mine-title" className="bf-predict-pickem-section-title">
        Mis predicciones
      </h2>
      <div className="bf-predict-mine-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`bf-predict-mine-tab ${tab === t.id ? "is-on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label} <span>{counts[t.id]}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="bf-predict-mine-empty">Nada en esta categoría.</p>
      ) : (
        <div className="bf-predict-mine-list">
          {list.map((e) => (
            <MyPredictionRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}
