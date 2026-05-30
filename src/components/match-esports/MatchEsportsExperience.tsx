"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MatchCompetitiveNarrative } from "@/components/match-esports/MatchCompetitiveNarrative";
import { MatchPredictionsCenter } from "@/components/match-esports/MatchPredictionsCenter";
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
      {finished && <MatchFinishedRecap match={match} meta={meta} />}
      <MatchPredictionsCenter match={match} meta={meta} aggregates={aggregates} />
    </div>
  );
}
