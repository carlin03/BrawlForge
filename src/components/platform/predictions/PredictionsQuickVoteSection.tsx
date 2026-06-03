"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { BracketMatchCard } from "@/components/platform/predictions/BracketMatchCard";
import type { EnrichedPrediction, PlayoffBracketView } from "@/lib/data/predictions-ui";
import {
  resolveFinalReveal,
  resolveSemiReveal,
  type BracketRevealState,
} from "@/lib/data/bracket-reveal";
import { getMatchStageMeta } from "@/lib/data/match-stage-meta";

function bracketRevealForEvent(
  event: EnrichedPrediction,
  brackets: PlayoffBracketView[],
  votes: Record<string, "A" | "B">,
): BracketRevealState | undefined {
  for (const b of brackets) {
    const qf = b.quarters;
    const semiIdx = b.semis.findIndex((s) => s.matchId === event.matchId);
    if (semiIdx >= 0) {
      return resolveSemiReveal(semiIdx, event, qf, votes);
    }
    if (b.final?.matchId === event.matchId) {
      return resolveFinalReveal(b.semis, qf, votes);
    }
  }
  return undefined;
}

export function PredictionsQuickVoteSection({
  events,
  votes,
  brackets = [],
  title = "Predicción rápida",
  hint = "Vota en segundos — todos los partidos abiertos. Los mismos duelos del bracket de abajo.",
  compact = false,
  maxItems,
}: {
  events: EnrichedPrediction[];
  votes: Record<string, "A" | "B">;
  brackets?: PlayoffBracketView[];
  title?: string;
  hint?: string;
  compact?: boolean;
  maxItems?: number;
}) {
  const list = maxItems ? events.slice(0, maxItems) : events;
  if (!list.length) return null;

  return (
    <section
      className={`bf-predict-quick-vote-section ${compact ? "is-compact" : ""}`}
      aria-labelledby="predict-quick-vote-title"
    >
      <div className="bf-predict-quick-vote-head">
        <h2 id="predict-quick-vote-title" className="bf-predict-pickem-section-title">
          <Zap size={14} aria-hidden />
          {title}
          <span className="bf-predict-pickem-count">{events.length}</span>
        </h2>
        {hint && <p className="bf-predict-quick-vote-hint">{hint}</p>}
      </div>
      <div className="bf-predict-quick-vote-grid">
        {list.map((e) => {
          const rk = e.stageMeta?.roundKey ?? getMatchStageMeta(e.stage).roundKey;
          const reveal = bracketRevealForEvent(e, brackets, votes);
          const useBracketCard =
            reveal &&
            (rk === "semi" || rk === "grand_final" || rk === "final");

          return (
            <div key={e.id} id={`pick-${e.matchId}`} className="bf-predict-quick-vote-cell">
              {useBracketCard ? (
                <BracketMatchCard event={e} votes={votes} bracketReveal={reveal} />
              ) : (
                <InteractiveVoteCard
                  event={e}
                  featured={!compact && (e.importance !== "normal" || rk === "quarter")}
                />
              )}
            </div>
          );
        })}
      </div>
      {maxItems && events.length > maxItems && (
        <p className="bf-predict-quick-vote-more">
          +{events.length - maxItems} más en el{" "}
          <Link href="/predictions">centro de predicciones</Link>
        </p>
      )}
    </section>
  );
}
