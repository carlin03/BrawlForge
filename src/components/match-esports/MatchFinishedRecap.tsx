"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import { teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { useGame } from "@/contexts/GameContext";
import { getMatchPrediction } from "@/lib/match-predictions-storage";
import { parseExactScore } from "@/lib/data/match-format-rules";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import type { MatchMeta } from "@/lib/data/match-meta";
import { getMatchPredictionPoints } from "@/lib/data/match-meta";

export function MatchFinishedRecap({
  match,
  meta,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
}) {
  if (match.status !== "finished") return null;

  const { game, aggregates } = useGame();
  const points = getMatchPredictionPoints(meta);
  const agg = aggregates[match.id];
  const total = agg?.total_votes ?? 0;
  const pctA = total ? Math.round(((agg?.votes_a ?? 0) / total) * 100) : 0;
  const pctB = 100 - pctA;
  const communityWinner = pctA >= pctB ? "A" : "B";
  const realWinner = match.scoreA > match.scoreB ? "A" : match.scoreB > match.scoreA ? "B" : null;
  const userPick = game?.votes?.[match.id] ?? null;
  const stored = getMatchPrediction(match.id);
  const userExt = { ...stored, ...game?.matchPicks?.[match.id] };
  const userExact = game?.exactScores?.[match.id] ?? userExt.exactScore;
  const realExact = `${match.scoreA}-${match.scoreB}`;
  const pickCorrect = userPick && realWinner && userPick === realWinner;
  const communityCorrect = realWinner && communityWinner === realWinner;
  const exactParsed = parseExactScore(userExact);
  const exactMatch =
    exactParsed &&
    exactParsed.a === match.scoreA &&
    exactParsed.b === match.scoreB;

  const mapWinnerPicks = userExt.mapWinners ?? {};
  const mapPickCount = Object.keys(mapWinnerPicks).length;

  const accuracyPct = total && realWinner
    ? Math.round(
        (((realWinner === "A" ? agg?.votes_a : agg?.votes_b) ?? 0) / total) * 100,
      )
    : null;

  const mvpMeta =
    meta.advanced_predictions?.mvp_player_slug ?? meta.brawlers?.most_used?.[0];
  const brawlerMvpMeta = meta.advanced_predictions?.match_mvp_brawler;
  const brawlerUsedMeta = meta.advanced_predictions?.most_used_brawler ?? meta.brawlers?.most_used?.[0];

  return (
    <section className="bf-match-finished-recap bf-match-esports-panel">
      <h2 className="bf-match-esports-h2">Resultado y comunidad</h2>

      <div className="bf-finished-hero">
        <div className="bf-finished-team">
          <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={64} />
          <span>{teamName(match.teamASlug)}</span>
        </div>
        <div className="bf-finished-score">
          <strong>
            {match.scoreA} <span>–</span> {match.scoreB}
          </strong>
          <span>Resultado oficial</span>
        </div>
        <div className="bf-finished-team">
          <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={64} />
          <span>{teamName(match.teamBSlug)}</span>
        </div>
      </div>

      <div className="bf-finished-compare-grid">
        <article className={`bf-finished-compare-card ${pickCorrect ? "is-hit" : userPick ? "is-miss" : ""}`}>
          <h3>Tu predicción</h3>
          {userPick ? (
            <>
              <TeamLogo
                slug={userPick === "A" ? match.teamASlug : match.teamBSlug}
                name={teamName(userPick === "A" ? match.teamASlug : match.teamBSlug)}
                size={48}
              />
              <strong>{teamName(userPick === "A" ? match.teamASlug : match.teamBSlug)}</strong>
              <span className={pickCorrect ? "is-ok" : "is-ko"}>
                {pickCorrect ? "Acierto" : "Fallaste"}
              </span>
            </>
          ) : (
            <p className="bf-finished-muted">No votaste el ganador</p>
          )}
          {userExact && (
            <p className="bf-finished-exact">
              Marcador: <strong>{userExact}</strong>
              {exactMatch ? " · exacto" : ""}
            </p>
          )}
          {mapPickCount > 0 && (
            <p className="bf-finished-exact">
              Mapas predichos: <strong>{mapPickCount}</strong>
            </p>
          )}
          {userExt.brawlerMvp && (
            <p className="bf-finished-exact">
              Brawler MVP: <strong>{userExt.brawlerMvp}</strong>
            </p>
          )}
        </article>

        <article className={`bf-finished-compare-card ${communityCorrect ? "is-hit" : ""}`}>
          <h3>Comunidad</h3>
          <TeamLogo
            slug={communityWinner === "A" ? match.teamASlug : match.teamBSlug}
            name={teamName(communityWinner === "A" ? match.teamASlug : match.teamBSlug)}
            size={48}
          />
          <strong>{teamName(communityWinner === "A" ? match.teamASlug : match.teamBSlug)}</strong>
          <span>
            {pctA}% · {pctB}% ({total} votos)
          </span>
          {accuracyPct != null && (
            <p className="bf-finished-accuracy">
              <strong>{accuracyPct}%</strong> acertó el ganador
            </p>
          )}
          <p className="bf-finished-exact">
            Marcador oficial: <strong>{realExact}</strong>
          </p>
        </article>

        <article className="bf-finished-compare-card is-official">
          <h3>Oficial</h3>
          {realWinner ? (
            <>
              <TeamLogo
                slug={realWinner === "A" ? match.teamASlug : match.teamBSlug}
                name={teamName(realWinner === "A" ? match.teamASlug : match.teamBSlug)}
                size={48}
              />
              <strong>{teamName(realWinner === "A" ? match.teamASlug : match.teamBSlug)}</strong>
              <span>{realExact}</span>
            </>
          ) : (
            <p className="bf-finished-muted">Empate</p>
          )}
        </article>
      </div>

      {(brawlerUsedMeta || brawlerMvpMeta || mvpMeta) && (
        <div className="bf-finished-brawlers">
          {brawlerUsedMeta && (
            <div>
              <span>Brawler más usado (partido)</span>
              <BrawlerAssetIcon name={brawlerUsedMeta} size={72} variant="meta" />
            </div>
          )}
          {brawlerMvpMeta && (
            <div>
              <span>Brawler MVP (partido)</span>
              <BrawlerAssetIcon name={brawlerMvpMeta} size={72} variant="meta" />
            </div>
          )}
        </div>
      )}

      {points.perfect_bonus ? (
        <p className="bf-finished-bonus-hint">
          Bonus perfecto disponible: <strong>+{points.perfect_bonus} pts</strong> si acertaste ganador, exacto,
          MVP, mapas y brawlers.
        </p>
      ) : null}
    </section>
  );
}
