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
import { TeamSidePick } from "@/components/match-esports/TeamSidePick";
import { PlayerMvpPicker } from "@/components/match-esports/PlayerMvpPicker";
import { BrawlerSearchPicker } from "@/components/match-esports/BrawlerSearchPicker";
import { MatchCommunityPulse } from "@/components/match-esports/MatchCommunityPulse";
import { MatchWinnerDuel } from "@/components/match-esports/MatchWinnerDuel";
import { MatchMapSeriesBoard } from "@/components/match-esports/MatchMapSeriesBoard";
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
  const showAdvanced = Boolean(winnerPick) && !closed;
  const hasAdvanced = hasAdvancedPredictionOptions(cfg);
  const hasMapSeries = cfg.map_winners || cfg.map_brawler_picks;

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

  const brawlerPool = useMemo(
    () => [
      ...(meta.brawlers?.meta ?? []),
      ...(meta.brawlers?.recommended ?? []),
      ...(meta.brawlers?.most_used ?? []),
    ],
    [meta.brawlers],
  );

  const patch = useCallback(
    (p: Partial<MatchExtendedPrediction>) => {
      const next = patchMatchPrediction(match.id, p);
      setExt(next);
      if (isLoggedIn && winnerPick) {
        void saveMatchPicks(match.id, { ...next, exactScore: game?.exactScores?.[match.id] ?? next.exactScore });
      }
    },
    [match.id, isLoggedIn, winnerPick, saveMatchPicks, game?.exactScores],
  );

  const pointsSummary = useMemo(() => {
    const parts: string[] = [];
    if (points.winner) parts.push(`Ganador +${points.winner}`);
    if (points.exact_score) parts.push(`Exacto +${points.exact_score}`);
    if (points.perfect_bonus) parts.push(`Perfecto +${points.perfect_bonus}`);
    return parts.length ? parts.join(" · ") : null;
  }, [points]);

  if (!cfg.winner && !hasAdvanced) return null;

  return (
    <section className="bf-match-predict-center is-unified" id="match-predictions">
      <header className="bf-match-section-head">
        <h2 className="bf-match-esports-h2">Predicciones</h2>
        <p className="bf-match-section-lead">
          Vota el ganador, el marcador exacto, MVP y picks de mapas y brawlers según lo configurado en este
          partido.
        </p>
        {pointsSummary && <p className="bf-match-predict-points-hint">{pointsSummary}</p>}
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

        {!closed && hasAdvanced && !showAdvanced && (
          <p className="bf-match-predict-hint">
            Elige el ganador para desbloquear marcador exacto, MVP, mapas y brawlers.
          </p>
        )}

        {showAdvanced && hasAdvanced && (
          <div className="bf-match-predict-advanced is-inline">
            {!isLoggedIn && (
              <p className="bf-match-predict-hint">
                <Link href={`/login?next=/matches/${match.id}`}>Inicia sesión</Link> para guardar predicciones
                avanzadas.
              </p>
            )}

            {cfg.exact_score && (
              <div className="bf-match-predict-block is-premium-score">
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

            {hasMapSeries && (
              <div className="bf-match-predict-block is-map-series">
                <h4 className="bf-match-predict-subh">Serie de mapas</h4>
                <p className="bf-match-predict-hint">
                  Con marcador 1-1 (BO3), 2-2 (BO5) o 3-3 (BO7) se destaca el mapa decisivo automáticamente.
                </p>
                <MatchMapSeriesBoard
                  match={match}
                  meta={meta}
                  ext={extWithScore}
                  onPatch={patch}
                  interactive={!closed}
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
                <BrawlerSearchPicker
                  label="Brawler más usado"
                  selected={ext.brawlerMostUsed ? [ext.brawlerMostUsed] : []}
                  onChange={(list) => patch({ brawlerMostUsed: list[0] })}
                  banned={[
                    ...(meta.bans?.brawlers_a ?? []),
                    ...(meta.bans?.brawlers_b ?? []),
                  ]}
                  max={1}
                  pool={brawlerPool}
                />
              </div>
            )}

            {cfg.brawler_mvp && (
              <div className="bf-match-predict-block">
                <BrawlerSearchPicker
                  label="Brawler MVP"
                  selected={ext.brawlerMvp ? [ext.brawlerMvp] : []}
                  onChange={(list) => patch({ brawlerMvp: list[0] })}
                  banned={[
                    ...(meta.bans?.brawlers_a ?? []),
                    ...(meta.bans?.brawlers_b ?? []),
                  ]}
                  max={1}
                  pool={brawlerPool}
                />
              </div>
            )}
          </div>
        )}

        {closed && hasAdvanced && (
          <p className="bf-match-predict-hint">Partido cerrado — predicción avanzada no disponible.</p>
        )}
      </div>

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
