"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import { getEffectiveMatchStatus } from "@/lib/data/match-effective-status";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MatchCompetitiveNarrative } from "@/components/match-esports/MatchCompetitiveNarrative";
import { MatchPickemBracketBanner } from "@/components/match-esports/MatchPickemBracketBanner";
import { MatchPredictionsCenter } from "@/components/match-esports/MatchPredictionsCenter";
import { MatchStatsVisual } from "@/components/match-esports/MatchStatsVisual";
import { MatchFinishedRecap } from "@/components/match-esports/MatchFinishedRecap";
import { useGame } from "@/contexts/GameContext";

export function MatchEsportsExperience({ match }: { match: EsportsMatch }) {
  const { aggregates } = useGame();
  const meta = parseMatchMeta(match.meta);
  const effective = { ...match, status: getEffectiveMatchStatus(match) };
  const finished = effective.status === "finished";

  return (
    <div className="bf-match-esports">
      <MatchCompetitiveNarrative match={effective} />
      <MatchStatsVisual match={effective} />
      {finished && <MatchFinishedRecap match={effective} meta={meta} />}
      <MatchPickemBracketBanner match={effective} />
      <MatchPredictionsCenter match={effective} meta={meta} aggregates={aggregates} />
    </div>
  );
}
