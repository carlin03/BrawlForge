"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { teamName, tournamentName, getTeam } from "@/lib/data";
import {
  parseMatchMeta,
  getMatchPredictionsConfig,
  displayStatusLabel,
  featuredLabelFromMeta,
} from "@/lib/data/match-meta";
import { getH2HStats, getTeamMatchStats, formatRecentScore } from "@/lib/data/match-team-stats";
import { InteractiveVoteCard } from "@/components/platform/InteractiveVoteCard";
import { ScoreStepperPicker } from "@/components/match-esports/ScoreStepperPicker";
import { enrichPrediction } from "@/lib/data/predictions-ui";
import type { PredictionEvent } from "@/lib/data/predictions";
import { getMatchStageMeta } from "@/lib/data/match-stage-meta";
import { useGame } from "@/contexts/GameContext";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { FormDots } from "@/components/platform/ui";

function toOpenPrediction(m: EsportsMatch, votes: Record<string, "A" | "B">): PredictionEvent {
  const meta = getMatchStageMeta(m.stage);
  const parsed = parseMatchMeta(m.meta);
  return {
    id: `match-detail-${m.id}`,
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
    featured: meta.tier >= 4,
  };
}

function InfoCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bf-match-pro-info-cell">
      <span className="bf-match-pro-info-label">{label}</span>
      <div className="bf-match-pro-info-value">{children}</div>
    </div>
  );
}

export function MatchDetailPro({ match }: { match: EsportsMatch }) {
  const { game } = useGame();
  const votes = game?.votes ?? {};
  const exactScores = game?.exactScores ?? {};
  const meta = parseMatchMeta(match.meta);
  const predCfg = getMatchPredictionsConfig(meta);
  const teamA = getTeam(match.teamASlug);
  const teamB = getTeam(match.teamBSlug);
  const statsA = getTeamMatchStats(match.teamASlug);
  const statsB = getTeamMatchStats(match.teamBSlug);
  const h2h = getH2HStats(match.teamASlug, match.teamBSlug, match.id);
  const predEvent = enrichPrediction(toOpenPrediction(match, votes), votes);
  const dt = new Date(match.date);
  const displayStatus = meta.display_status ?? match.status;
  const mapOrder = meta.maps?.order?.length ? meta.maps.order : meta.maps?.possible ?? [];
  const currentMap = meta.maps?.current;
  const decisiveMap = meta.maps?.decisive;

  return (
    <div className="bf-match-pro">
      <section className="bf-match-pro-panel bf-match-pro-info">
        <h2 className="bf-match-pro-h2">Información general</h2>
        <div className="bf-match-pro-info-grid">
          <InfoCell label="Torneo">
            <Link href={`/tournaments/${match.tournamentSlug}`} className="bf-match-pro-link-chip">
              <TournamentLogo slug={match.tournamentSlug} name={tournamentName(match.tournamentSlug)} size={20} />
              {tournamentName(match.tournamentSlug)}
            </Link>
          </InfoCell>
          <InfoCell label="Región">{match.region}</InfoCell>
          <InfoCell label="Fecha">
            {dt.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
          </InfoCell>
          <InfoCell label="Hora">{dt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</InfoCell>
          <InfoCell label="Estado">
            <span className={`bf-match-pro-status is-${displayStatus}`}>
              {displayStatusLabel(meta.display_status, match.status)}
            </span>
          </InfoCell>
          <InfoCell label="Ronda">{match.stage}</InfoCell>
          <InfoCell label="Formato">{match.format}</InfoCell>
          {meta.importance && meta.importance !== "normal" && (
            <InfoCell label="Importancia">{featuredLabelFromMeta(meta)}</InfoCell>
          )}
        </div>
      </section>

      {match.status !== "finished" && predCfg.winner && (
        <section className="bf-match-pro-panel">
          <div className="bf-match-pro-head">
            <h2 className="bf-match-pro-h2">Predicciones</h2>
            <Link href="/predictions" className="bf-match-pro-link">
              Todos los pick&apos;ems
            </Link>
          </div>
          <div className="bf-predict-bracket-grand-final">
            <InteractiveVoteCard event={predEvent} featured />
          </div>
          {predCfg.exact_score && (
            <ScoreStepperPicker
              matchId={match.id}
              format={match.format}
              teamASlug={match.teamASlug}
              teamBSlug={match.teamBSlug}
              teamAName={teamName(match.teamASlug)}
              teamBName={teamName(match.teamBSlug)}
              initialScore={exactScores[match.id] ?? null}
            />
          )}
          {(predCfg.mvp || predCfg.first_map || predCfg.advanced) && (
            <p className="bf-match-pro-future">
              Predicciones avanzadas (MVP, primer mapa, meta brawler) — arquitectura lista; activar desde Admin.
            </p>
          )}
        </section>
      )}

      {mapOrder.length > 0 && (
        <section className="bf-match-pro-panel">
          <h2 className="bf-match-pro-h2">Mapas</h2>
          <p className="bf-match-pro-sub">Map pool y orden de juego</p>
          <ol className="bf-match-pro-map-timeline">
            {mapOrder.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className={`bf-match-pro-map-step ${currentMap === name ? "is-current" : ""} ${decisiveMap === name ? "is-decisive" : ""}`}
              >
                <span className="bf-match-pro-map-num">{i + 1}</span>
                <span className="bf-match-pro-map-name">{name}</span>
                {currentMap === name && <span className="bf-match-pro-map-tag">En juego</span>}
                {decisiveMap === name && <span className="bf-match-pro-map-tag is-gold">Decisivo</span>}
                {meta.maps?.played?.find((p) => p.name === name)?.mvp_player && (
                  <span className="bf-match-pro-map-tag">MVP mapa</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {(meta.bans?.maps_a?.length || meta.bans?.maps_b?.length) && (
        <section className="bf-match-pro-panel">
          <h2 className="bf-match-pro-h2">Baneos de mapas</h2>
          <div className="bf-match-pro-bans">
            <div className="bf-match-pro-ban-col">
              <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={36} />
              <span className="bf-match-pro-ban-team">{teamName(match.teamASlug)}</span>
              <ul className="bf-match-pro-ban-chips">
                {(meta.bans?.maps_a ?? []).map((m) => (
                  <li key={m} className="is-banned">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bf-match-pro-ban-vs" aria-hidden>
              VS
            </div>
            <div className="bf-match-pro-ban-col">
              <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={36} />
              <span className="bf-match-pro-ban-team">{teamName(match.teamBSlug)}</span>
              <ul className="bf-match-pro-ban-chips">
                {(meta.bans?.maps_b ?? []).map((m) => (
                  <li key={m} className="is-banned">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {(meta.brawlers?.meta?.length ||
        meta.brawlers?.recommended?.length ||
        meta.brawlers?.most_used?.length ||
        meta.brawlers?.featured?.length ||
        meta.bans?.brawlers_a?.length ||
        meta.bans?.brawlers_b?.length) && (
        <section className="bf-match-pro-panel">
          <h2 className="bf-match-pro-h2">Brawlers</h2>
          <div className="bf-match-pro-brawler-grid">
            {meta.brawlers?.meta?.length ? (
              <div>
                <h3>Meta</h3>
                <ul className="bf-match-pro-chips">
                  {meta.brawlers.meta.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {meta.brawlers?.recommended?.length ? (
              <div>
                <h3>Recomendados</h3>
                <ul className="bf-match-pro-chips">
                  {meta.brawlers.recommended.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {meta.brawlers?.most_used?.length ? (
              <div>
                <h3>Más usados</h3>
                <ul className="bf-match-pro-chips">
                  {meta.brawlers.most_used.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {meta.brawlers?.featured?.length ? (
              <div>
                <h3>Destacados</h3>
                <ul className="bf-match-pro-chips">
                  {meta.brawlers.featured.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          {(meta.bans?.brawlers_a?.length || meta.bans?.brawlers_b?.length) && (
            <div className="bf-match-pro-brawler-bans">
              <div>
                <span>{teamName(match.teamASlug)}</span>
                <ul className="bf-match-pro-chips is-ban">
                  {(meta.bans?.brawlers_a ?? []).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span>{teamName(match.teamBSlug)}</span>
                <ul className="bf-match-pro-chips is-ban">
                  {(meta.bans?.brawlers_b ?? []).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="bf-match-pro-panel">
        <h2 className="bf-match-pro-h2">Estadísticas</h2>
        <div className="bf-match-pro-stats-compare">
          <div className="bf-match-pro-team-stat">
            <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={48} />
            <strong>{teamName(match.teamASlug)}</strong>
            {teamA && <FormDots form={teamA.form} />}
            <dl>
              <div>
                <dt>Win rate</dt>
                <dd>{statsA.winRate}%</dd>
              </div>
              <div>
                <dt>Victorias</dt>
                <dd>{statsA.wins}</dd>
              </div>
              <div>
                <dt>Derrotas</dt>
                <dd>{statsA.losses}</dd>
              </div>
            </dl>
          </div>
          <div className="bf-match-pro-h2h-center">
            {h2h.total > 0 ? (
              <>
                <span className="bf-match-pro-h2h-score">
                  {h2h.winsA} – {h2h.winsB}
                </span>
                <span className="bf-match-pro-h2h-label">H2H ({h2h.total} partidos)</span>
              </>
            ) : (
              <span className="bf-match-pro-h2h-label">Sin historial H2H</span>
            )}
          </div>
          <div className="bf-match-pro-team-stat">
            <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={48} />
            <strong>{teamName(match.teamBSlug)}</strong>
            {teamB && <FormDots form={teamB.form} />}
            <dl>
              <div>
                <dt>Win rate</dt>
                <dd>{statsB.winRate}%</dd>
              </div>
              <div>
                <dt>Victorias</dt>
                <dd>{statsB.wins}</dd>
              </div>
              <div>
                <dt>Derrotas</dt>
                <dd>{statsB.losses}</dd>
              </div>
            </dl>
          </div>
        </div>

        {h2h.matches.length > 0 && (
          <div className="bf-match-pro-h2h-list">
            <h3>Historial cara a cara</h3>
            <ul>
              {h2h.matches.map((m) => (
                <li key={m.id}>
                  <Link href={`/matches/${m.id}`}>
                    {teamName(m.teamASlug)} {m.scoreA}-{m.scoreB} {teamName(m.teamBSlug)} · {m.stage}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bf-match-pro-recent">
          <div>
            <h3>Forma · {teamName(match.teamASlug)}</h3>
            <ul>
              {statsA.recent.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <Link href={`/matches/${m.id}`}>{formatRecentScore(m, match.teamASlug)}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Forma · {teamName(match.teamBSlug)}</h3>
            <ul>
              {statsB.recent.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <Link href={`/matches/${m.id}`}>{formatRecentScore(m, match.teamBSlug)}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
