"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useGame } from "@/contexts/GameContext";
import { buildPredictionEvents } from "@/lib/data/predictions-build";
import { predictChronologySort } from "@/lib/data/predictions-filters";
import { buildAllPlayoffBrackets, enrichPrediction } from "@/lib/data/predictions-ui";
import { getMatch, isPickemMatchEligible } from "@/lib/data";
import { isPickemMatchOpen } from "@/lib/data/match-effective-status";
import { PredictionsQuickVoteSection } from "@/components/platform/predictions/PredictionsQuickVoteSection";

/** Predicciones en home — se monta en idle para no bloquear el arranque en móvil. */
export function HomePredictionsSection() {
  const { aggregates, game } = useGame();

  const voteEvents = useMemo(() => {
    const { open } = buildPredictionEvents(aggregates, game?.votes ?? {});
    const votes = game?.votes ?? {};
    return open
      .filter((e) => {
        const m = getMatch(e.matchId);
        if (m) return isPickemMatchEligible(m) && isPickemMatchOpen(m);
        return isPickemMatchEligible({
          id: e.matchId,
          teamASlug: e.teamASlug,
          teamBSlug: e.teamBSlug,
          stage: e.stage,
          scoreA: 0,
          scoreB: 0,
          tournamentSlug: e.tournamentSlug,
          date: e.deadline,
          status: "upcoming",
          region: "GLOBAL",
          format: "Bo3",
        });
      })
      .map((e) => enrichPrediction(e, votes))
      .sort(predictChronologySort);
  }, [aggregates, game?.votes]);

  const homeVoteBrackets = useMemo(() => buildAllPlayoffBrackets(voteEvents), [voteEvents]);

  if (voteEvents.length === 0) return null;

  return (
    <section className="fu-panel fu-panel-glow" style={{ gridColumn: "1 / -1" }}>
      <div className="fu-panel-head">
        <h2>Predicciones · comunidad</h2>
        <Link href="/predictions">Todas las predicciones</Link>
      </div>
      <div className="bf-predict-bsc bf-predict-bsc-home">
        <PredictionsQuickVoteSection
          events={voteEvents}
          votes={game?.votes ?? {}}
          brackets={homeVoteBrackets}
          title="Predicción rápida"
          hint="Todos los partidos abiertos — bracket 2×2 y grupos."
        />
      </div>
    </section>
  );
}
