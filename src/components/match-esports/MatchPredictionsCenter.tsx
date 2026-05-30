"use client";

import { useCallback, useState } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { getMatchPredictionsConfig } from "@/lib/data/match-meta";
import { enrichPrediction } from "@/lib/data/predictions-ui";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getMatchStageMeta } from "@/lib/data/match-stage-meta";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { ScoreStepperPicker } from "@/components/match-esports/ScoreStepperPicker";
import { TeamSidePick } from "@/components/match-esports/TeamSidePick";
import { PlayerMvpPicker } from "@/components/match-esports/PlayerMvpPicker";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { MatchCommunityPulse } from "@/components/match-esports/MatchCommunityPulse";
import { useGame } from "@/contexts/GameContext";
import { teamName } from "@/lib/data";
import {
  getMatchPrediction,
  patchMatchPrediction,
  type MatchExtendedPrediction,
} from "@/lib/match-predictions-storage";
import type { VoteAggregate } from "@/lib/supabase/game-types";
import { BS_BRAWLER_CATALOG } from "@/lib/data/bs-catalog";

function toEvent(m: EsportsMatch, votes: Record<string, "A" | "B">): PredictionEvent {
  const stageMeta = getMatchStageMeta(m.stage);
  const parsed = parseMatchMeta(m.meta);
  return {
    id: `match-predict-${m.id}`,
    matchId: m.id,
    teamASlug: m.teamASlug,
    teamBSlug: m.teamBSlug,
    pickAPct: 50,
    pickBPct: 50,
    totalVotes: 0,
    rewardPoints: 55,
    deadline: m.date,
    stage: m.stage,
    tournamentSlug: m.tournamentSlug,
    status: m.status === "finished" ? "closed" : "open",
    userPick: votes[m.id] ?? null,
    importance: parsed.importance,
    featured: stageMeta.tier >= 4,
  };
}

export function MatchPredictionsCenter({
  match,
  meta,
  aggregates,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  aggregates: Record<string, VoteAggregate>;
}) {
  const { game } = useGame();
  const votes = game?.votes ?? {};
  const cfg = getMatchPredictionsConfig(meta);
  const [ext, setExt] = useState<MatchExtendedPrediction>(() => ({
    ...getMatchPrediction(match.id),
    exactScore: game?.exactScores?.[match.id] ?? getMatchPrediction(match.id).exactScore,
  }));

  const event = enrichPrediction(toEvent(match, votes), votes);
  const closed = match.status === "finished";
  const brawlerPool =
    meta.brawlers?.meta?.length ? meta.brawlers.meta : BS_BRAWLER_CATALOG.map((b) => b.name);

  const patch = useCallback(
    (p: Partial<MatchExtendedPrediction>) => {
      const next = patchMatchPrediction(match.id, p);
      setExt(next);
    },
    [match.id],
  );

  if (closed && !votes[match.id]) {
    return (
      <section className="bf-match-predict-center is-closed">
        <h2 className="bf-match-esports-h2">Predicciones cerradas</h2>
        <MatchCommunityPulse
          matchId={match.id}
          teamASlug={match.teamASlug}
          teamBSlug={match.teamBSlug}
          aggregates={aggregates}
          metaBrawler={meta.brawlers?.meta?.[0]}
          exactLeader={ext.exactScore}
        />
      </section>
    );
  }

  return (
    <section className="bf-match-predict-center">
      <h2 className="bf-match-esports-h2">Predicciones</h2>

      {cfg.winner && (
        <div className="bf-match-predict-winner">
          <InteractiveVoteCard event={event} featured />
        </div>
      )}

      {cfg.exact_score && votes[match.id] && !closed && (
        <ScoreStepperPicker
          matchId={match.id}
          format={match.format}
          teamASlug={match.teamASlug}
          teamBSlug={match.teamBSlug}
          teamAName={teamName(match.teamASlug)}
          teamBName={teamName(match.teamBSlug)}
          initialScore={game?.exactScores?.[match.id] ?? ext.exactScore}
        />
      )}

      {cfg.first_map && votes[match.id] && !closed && (
        <TeamSidePick
          label="Primer mapa — ¿quién gana?"
          teamASlug={match.teamASlug}
          teamBSlug={match.teamBSlug}
          teamAName={teamName(match.teamASlug)}
          teamBName={teamName(match.teamBSlug)}
          value={ext.firstMapWinner ?? null}
          onChange={(v) => patch({ firstMapWinner: v })}
        />
      )}

      {cfg.decisive_map && votes[match.id] && !closed && (
        <TeamSidePick
          label="Mapa decisivo — ¿quién gana?"
          teamASlug={match.teamASlug}
          teamBSlug={match.teamBSlug}
          teamAName={teamName(match.teamASlug)}
          teamBName={teamName(match.teamBSlug)}
          value={ext.decisiveMapWinner ?? null}
          onChange={(v) => patch({ decisiveMapWinner: v })}
        />
      )}

      {cfg.mvp && votes[match.id] && !closed && (
        <div className="bf-match-predict-block">
          <h3 className="bf-match-predict-subh">MVP del partido</h3>
          <PlayerMvpPicker
            teamASlug={match.teamASlug}
            teamBSlug={match.teamBSlug}
            value={ext.mvpPlayerSlug ?? null}
            onChange={(slug) => patch({ mvpPlayerSlug: slug })}
          />
        </div>
      )}

      {cfg.brawler_most_used && votes[match.id] && !closed && (
        <div className="bf-match-predict-block">
          <h3 className="bf-match-predict-subh">Brawler más usado</h3>
          <div className="bf-brawler-pick-row">
            {brawlerPool.slice(0, 12).map((name) => (
              <BrawlerAssetIcon
                key={name}
                name={name}
                variant="pick"
                size={64}
                selected={ext.brawlerMostUsed === name}
                onClick={() => patch({ brawlerMostUsed: name })}
              />
            ))}
          </div>
        </div>
      )}

      {cfg.brawler_mvp && votes[match.id] && !closed && (
        <div className="bf-match-predict-block">
          <h3 className="bf-match-predict-subh">Brawler MVP</h3>
          <div className="bf-brawler-pick-row">
            {brawlerPool.slice(0, 12).map((name) => (
              <BrawlerAssetIcon
                key={name}
                name={name}
                variant="pick"
                size={64}
                selected={ext.brawlerMvp === name}
                onClick={() => patch({ brawlerMvp: name })}
              />
            ))}
          </div>
        </div>
      )}

      <MatchCommunityPulse
        matchId={match.id}
        teamASlug={match.teamASlug}
        teamBSlug={match.teamBSlug}
        aggregates={aggregates}
        metaBrawler={ext.brawlerMostUsed ?? meta.brawlers?.meta?.[0]}
        exactLeader={ext.exactScore}
      />
    </section>
  );
}
