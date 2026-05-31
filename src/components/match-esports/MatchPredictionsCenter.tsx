"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import {
  getMatchPredictionsConfig,
  getMatchPredictionPoints,
} from "@/lib/data/match-meta";
import { teamName } from "@/lib/data";
import { ScoreStepperPicker } from "@/components/match-esports/ScoreStepperPicker";
import { PlayerMvpPicker } from "@/components/match-esports/PlayerMvpPicker";
import { BrawlerSearchPicker } from "@/components/match-esports/BrawlerSearchPicker";
import { MatchCommunityPulse } from "@/components/match-esports/MatchCommunityPulse";
import { MatchWinnerDuel } from "@/components/match-esports/MatchWinnerDuel";
import { MatchMapSeriesBoard } from "@/components/match-esports/MatchMapSeriesBoard";
import { MatchMapAnalysisSection } from "@/components/match-esports/MatchMapAnalysisSection";
import { MatchPredictionPointsBar } from "@/components/match-esports/MatchPredictionPointsBar";
import { mapCountFromExactScore, resolveMatchMapOrder } from "@/lib/data/series-map-utils";
import { pruneMapPredictionsForExactScore } from "@/lib/match-predictions-prune";
import { PredictionPointBadge } from "@/components/match-esports/PredictionPointBadge";
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
  const mapOrder = useMemo(() => resolveMatchMapOrder(meta, match.format), [meta, match.format]);
  const hasPerMapPredictions =
    mapOrder.length > 0 && (cfg.map_winners || cfg.map_brawler_picks || cfg.advanced);
  const hasMapAnalysis = mapOrder.length > 0;

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

  const exactForMaps = extWithScore.exactScore;
  const predictedMapCount = useMemo(
    () => mapCountFromExactScore(exactForMaps, match.format),
    [exactForMaps, match.format],
  );
  const canShowMapPredictions =
    hasPerMapPredictions && predictedMapCount != null && predictedMapCount > 0;

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

  if (!hasMain && !hasPerMapPredictions && !hasMapAnalysis) return null;

  return (
    <>
      <section className="bf-match-predict-center is-compact" id="match-predictions">
        <header className="bf-match-section-head">
          <h2 className="bf-match-esports-h2">Predicciones</h2>
          <MatchPredictionPointsBar points={points} />
        </header>

        <div className="bf-match-predict-unified-card is-mockup">
          {cfg.winner && (
            <MatchWinnerDuel
              match={match}
              pick={winnerPick}
              onPickChange={setOptimisticPick}
              disabled={closed}
              rewardPoints={points.winner ?? 55}
            />
          )}

          {!closed && (hasMain || hasPerMapPredictions) && !showUnlocked && (
            <p className="bf-match-predict-hint">
              Elige el ganador para desbloquear el resto de predicciones.
            </p>
          )}

          {(showUnlocked || closed) && cfg.exact_score && (
            <div className="bf-match-predict-exact-card">
              <h4 className="bf-match-predict-subh">Resultado exacto</h4>
              <ScoreStepperPicker
                matchId={match.id}
                format={match.format}
                teamASlug={match.teamASlug}
                teamBSlug={match.teamBSlug}
                teamAName={teamName(match.teamASlug)}
                teamBName={teamName(match.teamBSlug)}
                initialScore={exactForMaps}
                disabled={closed}
                pointsReward={points.exact_score}
                onExactChange={(exact) => {
                  const pruned = pruneMapPredictionsForExactScore(ext, exact ?? undefined, match.format);
                  const next = patchMatchPrediction(match.id, {
                    exactScore: exact ?? undefined,
                    ...pruned,
                  });
                  setExt(next);
                }}
              />
            </div>
          )}

          {(showUnlocked || closed) && hasPerMapPredictions && !canShowMapPredictions && !closed && (
            <p className="bf-match-predict-hint is-full">
              Elige un <strong>resultado exacto</strong> válido arriba para ver los mapas que debes
              predecir (p. ej. 2-0 = 2 mapas, 2-1 = 3 mapas en BO3).
            </p>
          )}

          {(showUnlocked || closed) && canShowMapPredictions && (
            <>
              <h3 className="bf-match-map-series-title">Serie por mapas · {match.format}</h3>
              <MatchMapSeriesBoard
                match={match}
                meta={meta}
                ext={extWithScore}
                points={points}
                onPatch={patch}
                interactive={!closed}
              />
            </>
          )}

          {(showUnlocked || closed) && hasMain && (
            <div className="bf-match-predict-main-grid is-secondary">
              {!closed && !isLoggedIn && (
                <p className="bf-match-predict-hint is-full">
                  <Link href={`/login?next=/matches/${match.id}`}>Inicia sesión</Link> para guardar.
                </p>
              )}

              {cfg.mvp && (
                <div className="bf-match-predict-main-item">
                  <h4 className="bf-match-predict-subh">
                    MVP
                    <PredictionPointBadge points={points.mvp} />
                  </h4>
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
                  <h4 className="bf-match-predict-subh">
                    Brawler MVP
                    <PredictionPointBadge points={points.brawler_mvp} />
                  </h4>
                  <BrawlerSearchPicker
                    selected={ext.brawlerMvp ? [ext.brawlerMvp] : []}
                    onChange={(list) => patch({ brawlerMvp: list[0] })}
                    banned={matchBans}
                    max={1}
                  />
                </div>
              )}

              {cfg.brawler_most_used && (
                <div className="bf-match-predict-main-item">
                  <h4 className="bf-match-predict-subh">
                    Brawler más usado
                    <PredictionPointBadge points={points.brawler_most_used} />
                  </h4>
                  <BrawlerSearchPicker
                    selected={ext.brawlerMostUsed ? [ext.brawlerMostUsed] : []}
                    onChange={(list) => patch({ brawlerMostUsed: list[0] })}
                    banned={matchBans}
                    max={1}
                  />
                </div>
              )}
            </div>
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
        <MatchMapAnalysisSection match={match} meta={meta} ext={extWithScore} />
      )}
    </>
  );
}
