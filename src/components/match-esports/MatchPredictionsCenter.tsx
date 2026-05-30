"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import {
  getMatchPredictionsConfig,
  hasAdvancedPredictionOptions,
} from "@/lib/data/match-meta";
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
import { useAuth } from "@/contexts/AuthContext";
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
  const { isLoggedIn } = useAuth();
  const { game, saveMatchPicks } = useGame();
  const votes = game?.votes ?? {};
  const cfg = getMatchPredictionsConfig(meta);
  const closed = match.status === "finished";
  const savedPick = votes[match.id] ?? null;
  const [optimisticPick, setOptimisticPick] = useState<"A" | "B" | null>(savedPick);
  const winnerPick = savedPick ?? optimisticPick;
  const showAdvanced = Boolean(winnerPick) && !closed;
  const hasAdvanced = hasAdvancedPredictionOptions(cfg);

  const loadExt = useCallback((): MatchExtendedPrediction => {
    const fromDb = game?.matchPicks?.[match.id];
    const local = getMatchPrediction(match.id);
    return {
      ...local,
      ...fromDb,
      exactScore: game?.exactScores?.[match.id] ?? local.exactScore ?? fromDb?.exactScore,
    };
  }, [game?.matchPicks, game?.exactScores, match.id]);

  const [ext, setExt] = useState<MatchExtendedPrediction>(loadExt);

  useEffect(() => {
    setOptimisticPick(savedPick);
  }, [savedPick]);

  useEffect(() => {
    setExt(loadExt());
  }, [loadExt]);

  const event = enrichPrediction(
    toEvent(match, { ...votes, [match.id]: winnerPick ?? votes[match.id] }),
    votes,
  );

  const brawlerPool = useMemo(() => {
    const fromMeta = [
      ...(meta.brawlers?.meta ?? []),
      ...(meta.brawlers?.recommended ?? []),
      ...(meta.brawlers?.most_used ?? []),
    ];
    const unique = [...new Set(fromMeta)];
    if (unique.length >= 8) return unique;
    return BS_BRAWLER_CATALOG.map((b) => b.name);
  }, [meta.brawlers]);

  const patch = useCallback(
    (p: Partial<MatchExtendedPrediction>) => {
      const next = patchMatchPrediction(match.id, p);
      setExt(next);
      if (isLoggedIn && winnerPick) {
        void saveMatchPicks(match.id, next);
      }
    },
    [match.id, isLoggedIn, winnerPick, saveMatchPicks],
  );

  if (!cfg.winner && !hasAdvanced) return null;

  return (
    <section className="bf-match-predict-center" id="match-predictions">
      <h2 className="bf-match-esports-h2">Predicciones</h2>

      {cfg.winner && (
        <div className="bf-match-predict-winner">
          <InteractiveVoteCard
            event={event}
            featured
            hideEmbeddedExactScore
            loginNextPath={`/login?next=/matches/${match.id}`}
            onPickChange={setOptimisticPick}
          />
        </div>
      )}

      {!closed && hasAdvanced && !showAdvanced && (
        <p className="bf-match-predict-hint">
          Elige el ganador del partido para desbloquear la predicción avanzada (marcador, MVP, mapas y
          brawlers).
        </p>
      )}

      {!closed && hasAdvanced && !showAdvanced && cfg.advanced && (
        <p className="bf-match-predict-hint is-muted">
          En admin tienes activadas las predicciones avanzadas para este partido.
        </p>
      )}

      {showAdvanced && hasAdvanced && (
        <div className="bf-match-predict-advanced">
          <h3 className="bf-match-predict-advanced-title">Predicción avanzada</h3>
          <p className="bf-match-predict-advanced-lead">
            Ganador: <strong>{winnerPick === "A" ? teamName(match.teamASlug) : teamName(match.teamBSlug)}</strong>
            {isLoggedIn ? " — completa los extras." : " — inicia sesión para guardarlos en tu cuenta."}
          </p>

          {!isLoggedIn && (
            <p className="bf-match-predict-hint">
              <Link href={`/login?next=/matches/${match.id}`}>Inicia sesión</Link> para guardar en Supabase.
            </p>
          )}

          {cfg.exact_score && (
            <div className="bf-match-predict-block">
              <ScoreStepperPicker
                matchId={match.id}
                format={match.format}
                teamASlug={match.teamASlug}
                teamBSlug={match.teamBSlug}
                teamAName={teamName(match.teamASlug)}
                teamBName={teamName(match.teamBSlug)}
                initialScore={game?.exactScores?.[match.id] ?? ext.exactScore}
                disabled={!isLoggedIn}
              />
            </div>
          )}

          {cfg.first_map && (
            <div className="bf-match-predict-block">
              <TeamSidePick
                label="Primer mapa — ¿quién gana?"
                teamASlug={match.teamASlug}
                teamBSlug={match.teamBSlug}
                teamAName={teamName(match.teamASlug)}
                teamBName={teamName(match.teamBSlug)}
                value={ext.firstMapWinner ?? null}
                onChange={(v) => patch({ firstMapWinner: v })}
              />
            </div>
          )}

          {cfg.decisive_map && (
            <div className="bf-match-predict-block">
              <TeamSidePick
                label="Mapa decisivo — ¿quién gana?"
                teamASlug={match.teamASlug}
                teamBSlug={match.teamBSlug}
                teamAName={teamName(match.teamASlug)}
                teamBName={teamName(match.teamBSlug)}
                value={ext.decisiveMapWinner ?? null}
                onChange={(v) => patch({ decisiveMapWinner: v })}
              />
            </div>
          )}

          {cfg.mvp && (
            <div className="bf-match-predict-block">
              <h4 className="bf-match-predict-subh">MVP del partido</h4>
              <PlayerMvpPicker
                teamASlug={match.teamASlug}
                teamBSlug={match.teamBSlug}
                value={ext.mvpPlayerSlug ?? null}
                onChange={(slug) => patch({ mvpPlayerSlug: slug })}
              />
            </div>
          )}

          {cfg.brawler_most_used && (
            <div className="bf-match-predict-block">
              <h4 className="bf-match-predict-subh">Brawler más usado</h4>
              <div className="bf-brawler-pick-row">
                {brawlerPool.slice(0, 16).map((name) => (
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

          {cfg.brawler_mvp && (
            <div className="bf-match-predict-block">
              <h4 className="bf-match-predict-subh">Brawler MVP</h4>
              <div className="bf-brawler-pick-row">
                {brawlerPool.slice(0, 16).map((name) => (
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
        </div>
      )}

      {closed && hasAdvanced && (
        <p className="bf-match-predict-hint">Partido cerrado — predicción avanzada no disponible.</p>
      )}

      <MatchCommunityPulse
        matchId={match.id}
        teamASlug={match.teamASlug}
        teamBSlug={match.teamBSlug}
        aggregates={aggregates}
        metaBrawler={ext.brawlerMostUsed ?? meta.brawlers?.most_used?.[0] ?? meta.brawlers?.meta?.[0]}
        exactLeader={ext.exactScore ?? game?.exactScores?.[match.id]}
      />
    </section>
  );
}
