"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MatchCompetitiveContext } from "@/components/match-esports/MatchCompetitiveContext";
import { MatchPredictionsCenter } from "@/components/match-esports/MatchPredictionsCenter";
import { MatchMapsVisual } from "@/components/match-esports/MatchMapsVisual";
import { MatchBrawlersVisual } from "@/components/match-esports/MatchBrawlersVisual";
import { MatchStatsVisual } from "@/components/match-esports/MatchStatsVisual";
import { useGame } from "@/contexts/GameContext";

export function MatchEsportsExperience({ match }: { match: EsportsMatch }) {
  const { aggregates } = useGame();
  const meta = parseMatchMeta(match.meta);

  return (
    <div className="bf-match-esports">
      <MatchCompetitiveContext match={match} />
      <MatchPredictionsCenter match={match} meta={meta} aggregates={aggregates} />
      <MatchMapsVisual meta={match.meta} teamASlug={match.teamASlug} teamBSlug={match.teamBSlug} />
      <MatchBrawlersVisual meta={match.meta} teamASlug={match.teamASlug} teamBSlug={match.teamBSlug} />
      <MatchStatsVisual match={match} />
    </div>
  );
}
