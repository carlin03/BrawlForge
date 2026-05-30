"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import {
  getMatchPredictionsConfig,
  getMatchPredictionPoints,
  hasAdvancedPredictionOptions,
  parseMatchMeta,
} from "@/lib/data/match-meta";
import { teamName } from "@/lib/data";
import { ScoreStepperPicker } from "@/components/match-esports/ScoreStepperPicker";
import { PlayerMvpPicker } from "@/components/match-esports/PlayerMvpPicker";
import { BrawlerSearchPicker } from "@/components/match-esports/BrawlerSearchPicker";
import { MatchCommunityPulse } from "@/components/match-esports/MatchCommunityPulse";
import { MatchWinnerDuel } from "@/components/match-esports/MatchWinnerDuel";
import { MatchMapSeriesBoard } from "@/components/match-esports/MatchMapSeriesBoard";
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
  const parsed = parseMatchMeta(meta);
  const mapOrder = parsed.maps?.order?.length
    ? parsed.maps.order
    : (parsed.maps?.possible ?? []);
  const closed = match.status === "finished";
  const savedPick = votes[match.id] ?? null;
  const [optimisticPick, setOptimisticPick] = useState<"A" | "B" | null>(savedPick);
  const winnerPick = savedPick ?? optimisticPick;
  const showAdvanced = Boolean(winnerPick) && !closed;
  const hasAdvanced = hasAdvancedPredictionOptions(cfg);
  const hasMapSeries =
    mapOrder.length > 0 && (cfg.map_winners || cfg.map_brawler_picks || closed);

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

  if (!cfg.winner && !hasAdvanced && !hasMapSeries) return null;

  return (
    <section className="bf-match-predict-center is-unified is-map-first" id="match-predictions">
      <header className="bf-match-section-head">
        <h2 className="bf-match-esports-h2">Predicciones</h2>
        <p className="bf-match-section-lead">
          Serie por mapas: imagen, modo, ganador, picks y bloqueos centrales. Configura el pool en Admin →
          Mapas.
        </p>
        <MatchPredictionPointsBar points={points} />
      </header>

      <div className="bf-match-predict-unified-card">
        {cfg.winner && (
          <div className="bf-match-predict-tier is-winner">
            <MatchWinnerDuel
              match={match}
              pick={winnerPick}
              onPickChange={setOptimisticPick}
              disabled={closed}
            />
          </div>
        )}

        {!closed && (hasAdvanced || hasMapSeries) && !showAdvanced && (
          <p className="bf-match-predict-hint">
            Elige el ganador para desbloquear la serie de mapas, marcador exacto y brawlers.
          </p>
        )}

        {(showAdvanced || closed) && (hasAdvanced || hasMapSeries) && (
          <div className="bf-match-predict-advanced">
            {!closed && !isLoggedIn && (
              <p className="bf-match-predict-hint">
                <Link href={`/login?next=/matches/${match.id}`}>Inicia sesión</Link> para guardar
                predicciones.
              </p>
            )}

            {hasMapSeries && (
              <div className="bf-match-predict-tier is-map-axis">
                <MatchMapSeriesBoard
                  match={match}
                  meta={meta}
                  ext={extWithScore}
                  onPatch={patch}
                  interactive={!closed}
                />
              </div>
            )}

            {showAdvanced && cfg.exact_score && (
              <div className="bf-match-predict-tier is-score">
                <h4 className="bf-match-predict-subh">Resultado exacto de la serie</h4>
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

            {showAdvanced && (cfg.mvp || cfg.brawler_most_used || cfg.brawler_mvp) && (
              <div className="bf-match-predict-tier is-brawlers-extra">
                <h4 className="bf-match-predict-subh">Brawlers del partido</h4>
                <div className="bf-match-predict-brawler-grid">
                  {cfg.mvp && (
                    <div className="bf-match-predict-block">
                      <h5 className="bf-match-predict-mini-h">MVP jugador</h5>
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
                      <BrawlerSearchPicker
                        label="Brawler más usado"
                        selected={ext.brawlerMostUsed ? [ext.brawlerMostUsed] : []}
                        onChange={(list) => patch({ brawlerMostUsed: list[0] })}
                        banned={matchBans}
                        max={1}
                      />
                    </div>
                  )}
                  {cfg.brawler_mvp && (
                    <div className="bf-match-predict-block">
                      <BrawlerSearchPicker
                        label="Brawler MVP"
                        selected={ext.brawlerMvp ? [ext.brawlerMvp] : []}
                        onChange={(list) => patch({ brawlerMvp: list[0] })}
                        banned={matchBans}
                        max={1}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {closed && hasMapSeries && !hasAdvanced && (
          <MatchMapSeriesBoard
            match={match}
            meta={meta}
            ext={extWithScore}
            onPatch={patch}
            interactive={false}
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
  );
}
