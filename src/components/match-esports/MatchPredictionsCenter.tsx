"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import {
  getMatchPredictionsConfig,
  getMatchPredictionPoints,
  hasAdvancedPredictionOptions,
} from "@/lib/data/match-meta";
import { teamName } from "@/lib/data";
import { ScoreStepperPicker } from "@/components/match-esports/ScoreStepperPicker";
import { PlayerMvpPicker } from "@/components/match-esports/PlayerMvpPicker";
import { BrawlerSearchPicker } from "@/components/match-esports/BrawlerSearchPicker";
import { MatchCommunityPulse } from "@/components/match-esports/MatchCommunityPulse";
import { MatchWinnerDuel } from "@/components/match-esports/MatchWinnerDuel";
import { MatchAdvancedMapWinners } from "@/components/match-esports/MatchAdvancedMapWinners";
import { MatchMapAnalysisSection } from "@/components/match-esports/MatchMapAnalysisSection";
import { MatchPredictionPointsBar } from "@/components/match-esports/MatchPredictionPointsBar";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import {
  getMatchPrediction,
  patchMatchPrediction,
  type MatchExtendedPrediction,
} from "@/lib/match-predictions-storage";
import type { VoteAggregate } from "@/lib/supabase/game-types";

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
  const points = getMatchPredictionPoints(meta);
  const closed = match.status === "finished";
  const savedPick = votes[match.id] ?? null;
  const [optimisticPick, setOptimisticPick] = useState<"A" | "B" | null>(savedPick);
  const winnerPick = savedPick ?? optimisticPick;
  const showUnlocked = Boolean(winnerPick) && !closed;
  const hasMain =
    cfg.winner ||
    cfg.exact_score ||
    cfg.mvp ||
    cfg.brawler_mvp ||
    cfg.brawler_most_used;
  const hasAdvancedMaps = cfg.map_winners;
  const hasMapAnalysis =
    (meta.maps?.order?.length ?? 0) > 0 || (meta.maps?.possible?.length ?? 0) > 0;

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

  const extWithScore = useMemo(
    () => ({
      ...ext,
      exactScore: game?.exactScores?.[match.id] ?? ext.exactScore,
    }),
    [ext, game?.exactScores, match.id],
  );

  const matchBans = useMemo(
    () => [...(meta.bans?.brawlers_a ?? []), ...(meta.bans?.brawlers_b ?? [])],
    [meta.bans],
  );

  const patch = useCallback(
    (p: Partial<MatchExtendedPrediction>) => {
      const next = patchMatchPrediction(match.id, p);
      setExt(next);
      if (isLoggedIn && winnerPick) {
        void saveMatchPicks(match.id, {
          ...next,
          exactScore: game?.exactScores?.[match.id] ?? next.exactScore,
        });
      }
    },
    [match.id, isLoggedIn, winnerPick, saveMatchPicks, game?.exactScores],
  );

  if (!hasMain && !hasAdvancedMaps && !hasMapAnalysis) return null;

  return (
    <>
      <section className="bf-match-predict-center is-compact" id="match-predictions">
        <header className="bf-match-section-head">
          <h2 className="bf-match-esports-h2">Predicciones</h2>
          <MatchPredictionPointsBar points={points} />
        </header>

        <div className="bf-match-predict-unified-card">
          {cfg.winner && (
            <MatchWinnerDuel
              match={match}
              pick={winnerPick}
              onPickChange={setOptimisticPick}
              disabled={closed}
            />
          )}

          {!closed && (hasMain || hasAdvancedMaps) && !showUnlocked && (
            <p className="bf-match-predict-hint">
              Elige el ganador para desbloquear el resto de predicciones.
            </p>
          )}

          {(showUnlocked || closed) && hasMain && (
            <div className="bf-match-predict-main-grid">
              {!closed && !isLoggedIn && (
                <p className="bf-match-predict-hint is-full">
                  <Link href={`/login?next=/matches/${match.id}`}>Inicia sesión</Link> para guardar.
                </p>
              )}

              {cfg.exact_score && (
                <div className="bf-match-predict-main-item is-score">
                  <h4 className="bf-match-predict-subh">Resultado exacto</h4>
                  <ScoreStepperPicker
                    matchId={match.id}
                    format={match.format}
                    teamASlug={match.teamASlug}
                    teamBSlug={match.teamBSlug}
                    teamAName={teamName(match.teamASlug)}
                    teamBName={teamName(match.teamBSlug)}
                    initialScore={game?.exactScores?.[match.id] ?? ext.exactScore}
                    disabled={closed}
                    onExactChange={(exact) =>
                      setExt((prev) => ({ ...prev, exactScore: exact ?? undefined }))
                    }
                  />
                </div>
              )}

              {cfg.mvp && (
                <div className="bf-match-predict-main-item">
                  <h4 className="bf-match-predict-subh">MVP</h4>
                  <PlayerMvpPicker
                    teamASlug={match.teamASlug}
                    teamBSlug={match.teamBSlug}
                    value={ext.mvpPlayerSlug ?? null}
                    onChange={(slug) => patch({ mvpPlayerSlug: slug })}
                  />
                </div>
              )}

              {cfg.brawler_mvp && (
                <div className="bf-match-predict-main-item">
                  <BrawlerSearchPicker
                    label="Brawler MVP"
                    selected={ext.brawlerMvp ? [ext.brawlerMvp] : []}
                    onChange={(list) => patch({ brawlerMvp: list[0] })}
                    banned={matchBans}
                    max={1}
                  />
                </div>
              )}

              {cfg.brawler_most_used && (
                <div className="bf-match-predict-main-item">
                  <BrawlerSearchPicker
                    label="Brawler más usado"
                    selected={ext.brawlerMostUsed ? [ext.brawlerMostUsed] : []}
                    onChange={(list) => patch({ brawlerMostUsed: list[0] })}
                    banned={matchBans}
                    max={1}
                  />
                </div>
              )}
            </div>
          )}

          {(showUnlocked || closed) && hasAdvancedMaps && (
            <MatchAdvancedMapWinners
              match={match}
              meta={meta}
              ext={extWithScore}
              onPatch={patch}
              interactive={!closed}
            />
          )}
        </div>

        <MatchCommunityPulse
          matchId={match.id}
          teamASlug={match.teamASlug}
          teamBSlug={match.teamBSlug}
          aggregates={aggregates}
          metaBrawler={ext.brawlerMostUsed ?? meta.brawlers?.most_used?.[0]}
          exactLeader={ext.exactScore ?? game?.exactScores?.[match.id]}
        />
      </section>

      {hasMapAnalysis && (showUnlocked || closed) && (
        <MatchMapAnalysisSection
          match={match}
          meta={meta}
          ext={extWithScore}
          onPatch={patch}
          interactive={!closed && cfg.map_brawler_picks}
        />
      )}
    </>
  );
}
