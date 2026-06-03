"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { BracketMatchCard } from "@/components/platform/predictions/BracketMatchCard";
import { GranFinalRound } from "@/components/platform/predictions/PredictionsRoundSections";
import type { EnrichedPrediction, PlayoffBracketView } from "@/lib/data/predictions-ui";
import { getAllPlayoffBracketMatchIds } from "@/lib/data/predictions-ui";
import { resolveSemiReveal } from "@/lib/data/bracket-reveal";
import { resolveBracketLayout } from "@/lib/data/bracket-config";

function sortByDate(list: EnrichedPrediction[]): EnrichedPrediction[] {
  return [...list].sort((a, b) =>
    (a.matchDate ?? a.deadline).localeCompare(b.matchDate ?? b.deadline),
  );
}

function BracketQuickBoard({
  bracket,
  votes,
  events,
}: {
  bracket: PlayoffBracketView;
  votes: Record<string, "A" | "B">;
  events: EnrichedPrediction[];
}) {
  const qf = bracket.quarters;
  const sf = bracket.semis;
  const qfLayout = resolveBracketLayout(bracket.layout, qf.length);
  const sfLayout = resolveBracketLayout(bracket.layout, sf.length);

  return (
    <div className="bf-predict-quick-bracket-board" id={`pickem-${bracket.tournamentSlug}`}>
      <h3 className="bf-predict-bracket-round-title">{bracket.tournamentName}</h3>

      {qf.length > 0 && (
        <section className="bf-predict-bracket-round">
          <h4 className="bf-predict-bracket-round-sub">Cuartos</h4>
          <div
            className={
              qf.length === 1 || qfLayout === "1"
                ? "bf-predict-bracket-qf bf-predict-bracket-stack is-solo-round"
                : "bf-predict-bracket-qf-grid"
            }
            data-layout={qf.length >= 4 || qfLayout === "2" ? "2" : "1"}
          >
            {qf.map((e) => (
              <BracketMatchCard key={`${e.id}-${votes[e.matchId] ?? ""}`} event={e} votes={votes} />
            ))}
          </div>
        </section>
      )}

      {sf.length > 0 && (
        <section className="bf-predict-bracket-round">
          <h4 className="bf-predict-bracket-round-sub">Semifinales</h4>
          <div
            className={`bf-predict-bracket-sf ${sf.length === 1 || sfLayout === "1" ? "is-solo-round bf-predict-bracket-stack" : "is-layout-2"}`}
            data-layout={sfLayout}
          >
            {sf.map((e, i) => (
              <BracketMatchCard
                key={`${e.id}-${votes[e.matchId] ?? ""}-${revealKey(resolveSemiReveal(i, e, qf, votes))}`}
                event={e}
                votes={votes}
                bracketReveal={resolveSemiReveal(i, e, qf, votes)}
              />
            ))}
          </div>
        </section>
      )}

      {(sf.length > 0 || bracket.final || qf.length >= 4) && (
        <GranFinalRound bracket={bracket} votes={votes} events={events} compact />
      )}
    </div>
  );
}

function revealKey(r: { sideA: { teamSlug: string | null }; sideB: { teamSlug: string | null } }): string {
  return `${r.sideA.teamSlug ?? "-"}-${r.sideB.teamSlug ?? "-"}`;
}

export function PredictionsQuickVoteSection({
  events,
  votes,
  brackets = [],
  title = "Predicción rápida",
  hint,
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
  const bracketIds = getAllPlayoffBracketMatchIds(brackets);
  const bracketBoards = brackets.filter(
    (b) => b.quarters.length >= 4 || b.semis.length >= 2 || Boolean(b.final),
  );
  const useBracketLayout = bracketBoards.length > 0;

  const otherEvents = sortByDate(events.filter((e) => !bracketIds.has(e.matchId)));
  const otherList = maxItems ? otherEvents.slice(0, maxItems) : otherEvents;

  if (!useBracketLayout && events.length === 0) return null;

  return (
    <section
      className={`bf-predict-quick-vote-section ${useBracketLayout ? "is-bracket-layout" : ""} ${compact ? "is-compact" : ""}`}
      aria-labelledby="predict-quick-vote-title"
    >
      <div className="bf-predict-quick-vote-head">
        <h2 id="predict-quick-vote-title" className="bf-predict-pickem-section-title">
          <Zap size={14} aria-hidden />
          {title}
          <span className="bf-predict-pickem-count">{events.length}</span>
        </h2>
        <p className="bf-predict-quick-vote-hint">
          {hint ??
            (useBracketLayout
              ? "Cuartos en 2×2 — al votar, semifinales y final se actualizan al instante."
              : "Vota en segundos en cada partido abierto.")}
        </p>
      </div>

      {useBracketLayout ? (
        <div className="bf-predict-quick-bracket-stack">
          {bracketBoards.map((b) => (
            <BracketQuickBoard key={b.tournamentSlug} bracket={b} votes={votes} events={events} />
          ))}
        </div>
      ) : (
        <div className="bf-predict-quick-vote-grid is-flat">
          {(maxItems ? events.slice(0, maxItems) : events).map((e) => (
            <div key={e.id} id={`pick-${e.matchId}`} className="bf-predict-quick-vote-cell">
              <BracketMatchCard event={e} votes={votes} />
            </div>
          ))}
        </div>
      )}

      {otherList.length > 0 && (
        <section className="bf-predict-quick-other">
          <h3 className="bf-predict-bracket-round-sub">Jornada y grupos</h3>
          <div className="bf-predict-quick-other-grid">
            {otherList.map((e) => (
              <div key={e.id} id={`pick-${e.matchId}`} className="bf-predict-quick-vote-cell">
                <BracketMatchCard event={e} votes={votes} />
              </div>
            ))}
          </div>
        </section>
      )}

      {maxItems && otherEvents.length > maxItems && (
        <p className="bf-predict-quick-vote-more">
          +{otherEvents.length - maxItems} más en{" "}
          <Link href="/predictions">Predicciones</Link>
        </p>
      )}
    </section>
  );
}
