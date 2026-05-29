"use client";

import Link from "next/link";
import { ExternalLink, Radio, Trophy } from "lucide-react";
import { MatchLine } from "@/components/platform/ui";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { DuelLogoShowcase, PageUltraHero } from "@/components/platform/PageUltraHero";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { tierBadgeClass, tierLabel, isTierBPlus } from "@/lib/data";
import {
  getTournament,
  teamName,
  hasFantasyForTournament,
  getTournamentParticipantSlugs,
  isKnownTeamSlug,
  getMatchesByTournament,
} from "@/lib/data";
import { formatTournamentDates, getTournamentStats } from "@/lib/data/tournament-stats";
import { getFantasyPlayersForTournament, getFantasyTeamsForTournament } from "@/lib/data/fantasy-rosters";
import { getPlayer, getPlayerPrice } from "@/lib/data";
import { getBscTournamentEnrichment, getBscEnrichmentSyncedAt } from "@/lib/data/bsc-tournaments-enriched";
import { PlayerCard } from "@/components/platform/PlayerCard";

function clean(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function TournamentDetailView({ slug }: { slug: string }) {
  const tournament = getTournament(slug);
  if (!tournament) {
    return (
      <PageUltraShell>
        <div className="fu-panel bf-home-empty">
          <p>Torneo no encontrado.</p>
          <Link href="/tournaments" className="fu-btn fu-btn-ghost">
            Ver torneos
          </Link>
        </div>
      </PageUltraShell>
    );
  }

  const stats = getTournamentStats(slug);
  const matches = getMatchesByTournament(slug);
  const participants = getTournamentParticipantSlugs(slug).filter(isKnownTeamSlug);
  const fantasyEnabled = hasFantasyForTournament(slug);
  const fantasyTeams = getFantasyTeamsForTournament(slug);
  const fantasyPool = getFantasyPlayersForTournament(slug).slice(0, 8);
  const dateLabel = formatTournamentDates(tournament.startDate, tournament.endDate);
  const wiki = getBscTournamentEnrichment(slug);
  const wikiSynced = getBscEnrichmentSyncedAt();

  const liveMatches = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const finished = matches.filter((m) => m.status === "finished").slice(0, 10);
  const spotlight = liveMatches[0] ?? upcoming[0] ?? finished[0];

  return (
    <PageUltraShell className="bf-tour-page-ultra">
      <PageUltraHero
        className={tournament.status === "live" ? "is-live-tour" : ""}
        kicker={
          <>
            {tournament.tier != null && (
              <span className={`bf-tier-badge ${tierBadgeClass(tournament.tier)}`}>{tierLabel(tournament.tier)}</span>
            )}
            {isTierBPlus(tournament) && <span className="bp-chip bp-chip-gold">B+</span>}
            <span className="bp-chip">{tournament.region}</span>
            {tournament.status === "live" && (
              <span className="bp-chip bp-chip-live">
                <span className="bp-live-dot" /> LIVE
              </span>
            )}
          </>
        }
        title={clean(tournament.name)}
        lead={`${tournament.prizePool} · ${dateLabel} · ${tournament.location}${tournament.stage ? ` · ${tournament.stage}` : ""}`}
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="fu-stat">
              <b>{stats.participantCount || participants.length}</b>
              <span>Equipos</span>
            </div>
            <div className="fu-stat">
              <b>{stats.totalMatches}</b>
              <span>Partidos</span>
            </div>
            <div className="fu-stat">
              <b>{stats.liveMatches || stats.upcomingMatches}</b>
              <span>{stats.liveMatches ? "En vivo" : "Próximos"}</span>
            </div>
            <div className="fu-stat">
              <b>{stats.finishedMatches}</b>
              <span>Jugados</span>
            </div>
          </div>
        }
        actions={
          <>
            {fantasyEnabled && (
              <Link href={`/fantasy?tournament=${slug}`} className="fu-btn fu-btn-gold">
                Fantasy
              </Link>
            )}
            <Link href="/predictions" className="fu-btn fu-btn-red">
              Predicciones
            </Link>
            <Link href="/matches" className="fu-btn fu-btn-ghost">
              Calendario
            </Link>
            {tournament.liquipediaUrl && (
              <a
                href={tournament.liquipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fu-btn fu-btn-ghost"
              >
                <ExternalLink size={16} /> Liquipedia
              </a>
            )}
          </>
        }
        showcase={
          spotlight ? (
            <Link href={`/matches/${spotlight.id}`} style={{ textDecoration: "none" }}>
              <DuelLogoShowcase
                teamA={<TeamLogo slug={spotlight.teamASlug} name={teamName(spotlight.teamASlug)} size={96} glow />}
                teamB={<TeamLogo slug={spotlight.teamBSlug} name={teamName(spotlight.teamBSlug)} size={96} glow />}
                labelA={teamName(spotlight.teamASlug)}
                labelB={teamName(spotlight.teamBSlug)}
              />
            </Link>
          ) : (
            <div className="fu-duel-showcase">
              <div className="fu-duel-logo fu-card-float fu-card-float-2">
                <TournamentLogo slug={slug} name={clean(tournament.shortName)} size={120} glow />
                <span>{clean(tournament.shortName)}</span>
              </div>
            </div>
          )
        }
      />

      {(tournament.organizer || tournament.venue || tournament.eventType || tournament.series || wiki?.matchCount) && (
        <section className="fu-panel fu-panel-glow bf-tour-wiki-meta">
          <div className="fu-panel-head">
            <h2>Info del evento</h2>
            {wikiSynced && (
              <span className="bf-admin-field-hint" style={{ margin: 0 }}>
                Liquipedia · {new Date(wikiSynced).toLocaleDateString("es-ES")}
              </span>
            )}
          </div>
          <dl className="bf-tour-wiki-grid">
            {tournament.organizer && (
              <>
                <dt>Organiza</dt>
                <dd>{tournament.organizer}</dd>
              </>
            )}
            {tournament.series && (
              <>
                <dt>Circuito</dt>
                <dd>{tournament.series}</dd>
              </>
            )}
            {tournament.eventType && (
              <>
                <dt>Formato presencial</dt>
                <dd>{tournament.eventType}</dd>
              </>
            )}
            {tournament.venue && (
              <>
                <dt>Sede</dt>
                <dd>{tournament.venue}</dd>
              </>
            )}
            {wiki?.format && (
              <>
                <dt>Bracket</dt>
                <dd>{wiki.format}</dd>
              </>
            )}
            {wiki?.matchCount != null && wiki.matchCount > 0 && (
              <>
                <dt>Partidos en wiki</dt>
                <dd>{wiki.matchCount}</dd>
              </>
            )}
            {tournament.website && (
              <>
                <dt>Web oficial</dt>
                <dd>
                  <a href={tournament.website} target="_blank" rel="noopener noreferrer">
                    {tournament.website.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {tournament.winnerSlug && (
        <div className="bf-tour-champion fu-panel-glow">
          <Trophy size={20} color="var(--bp-gold)" />
          <span className="fu-kicker" style={{ margin: 0 }}>
            Campeón
          </span>
          <TeamLogo slug={tournament.winnerSlug} name={teamName(tournament.winnerSlug)} size={56} glow />
          <Link href={`/teams/${tournament.winnerSlug}`} className="bf-tour-champion-name">
            {teamName(tournament.winnerSlug)}
          </Link>
        </div>
      )}

      {liveMatches.length > 0 && (
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>
              <Radio size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              En directo
            </h2>
          </div>
          {liveMatches.map((m) => (
            <MatchLine key={m.id} match={m} rich />
          ))}
        </section>
      )}

      <div className="bf-tour-grid-2">
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>Próximos ({upcoming.length})</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="bf-home-empty">Sin partidos próximos.</p>
          ) : (
            upcoming.slice(0, 8).map((m) => <MatchLine key={m.id} match={m} rich />)
          )}
        </section>
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>Resultados</h2>
          </div>
          {finished.length === 0 ? (
            <p className="bf-home-empty">Sin resultados aún.</p>
          ) : (
            finished.map((m) => <MatchLine key={m.id} match={m} rich />)
          )}
        </section>
      </div>

      {stats.standings.length > 0 && (
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>Clasificación</h2>
          </div>
          <div className="bf-tour-standings">
            {stats.standings.slice(0, 12).map((row) => (
              <Link key={row.teamSlug} href={`/teams/${row.teamSlug}`} className="bf-tour-stand-row">
                <span className="bf-tour-stand-rank">{row.rank}</span>
                <TeamLogo slug={row.teamSlug} name={teamName(row.teamSlug)} size={32} />
                <strong>{teamName(row.teamSlug)}</strong>
                <span>
                  {row.w}W · {row.l}L · {row.diff}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="fu-panel fu-panel-glow">
        <div className="fu-panel-head">
          <h2>Participantes ({participants.length})</h2>
          <Link href="/teams">Todos los clubes</Link>
        </div>
        <div className="bf-tour-participants">
          {participants.map((ts) => (
            <Link key={ts} href={`/teams/${ts}`} className="bf-tour-part-chip">
              <TeamLogo slug={ts} name={teamName(ts)} size={40} />
              <span>{teamName(ts)}</span>
            </Link>
          ))}
        </div>
      </section>

      {fantasyEnabled && fantasyPool.length > 0 && (
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>Pool fantasy</h2>
            <Link href={`/fantasy?tournament=${slug}`}>Mercado</Link>
          </div>
          <p className="bf-tour-pool-hint">
            {fantasyTeams.length} equipos · {fantasyPool.length}+ pros
          </p>
          <div className="bf-tour-fantasy-cards">
            {fantasyPool.map((ps) => {
              const p = getPlayer(ps);
              if (!p) return null;
              return (
                <PlayerCard
                  key={ps}
                  playerSlug={ps}
                  size="sm"
                  price={getPlayerPrice(ps, slug)}
                  href={`/players/${ps}`}
                />
              );
            })}
          </div>
        </section>
      )}

      {stats.prizeBreakdown.length > 0 && (
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>Premios</h2>
          </div>
          <div className="bf-tour-prizes">
            {stats.prizeBreakdown.map((p) => (
              <div key={p.place} className="bf-tour-prize-row">
                <span>{p.place}</span>
                <strong>{p.prize}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageUltraShell>
  );
}
