"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MatchCompetitiveNarrative } from "@/components/match-esports/MatchCompetitiveNarrative";
import { MatchPredictionsCenter } from "@/components/match-esports/MatchPredictionsCenter";
import { MatchMapsVisual } from "@/components/match-esports/MatchMapsVisual";
import { MatchBrawlersVisual } from "@/components/match-esports/MatchBrawlersVisual";
import { MatchStatsVisual } from "@/components/match-esports/MatchStatsVisual";
import { MatchFinishedRecap } from "@/components/match-esports/MatchFinishedRecap";
import { useGame } from "@/contexts/GameContext";

export function MatchEsportsExperience({ match }: { match: EsportsMatch }) {
  const { aggregates } = useGame();
  const meta = parseMatchMeta(match.meta);
  const finished = match.status === "finished";

  return (
    <div className="bf-match-esports">
      <MatchCompetitiveNarrative match={match} />
      <MatchStatsVisual match={match} />
      <MatchMapsVisual
        meta={match.meta}
        format={match.format}
        teamASlug={match.teamASlug}
        teamBSlug={match.teamBSlug}
      />
      <MatchBrawlersVisual meta={match.meta} teamASlug={match.teamASlug} teamBSlug={match.teamBSlug} />
      {!finished && (
        <MatchPredictionsCenter match={match} meta={meta} aggregates={aggregates} />
      )}
      {finished && (
        <>
          <MatchFinishedRecap match={match} meta={meta} />
          <MatchPredictionsCenter match={match} meta={meta} aggregates={aggregates} />
        </>
      )}
    </div>
  );
}
