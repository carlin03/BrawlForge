"use client";

import Link from "next/link";
import { MatchLine, FormDots } from "@/components/platform/ui";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import {
  getTeam,
  getPlayersByTeam,
  matches,
  getPlayer,
  getUpcomingMatches,
  getPickRate,
  hasFantasyForTournament,
  DEFAULT_FANTASY_TOURNAMENT,
  teamName,
  getPlayerPrice,
} from "@/lib/data";
import { getTeamTournamentHistory, getTeamLiquipediaUrl, getTeamRegisteredTournaments } from "@/lib/data/team-detail";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

function clean(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

export function TeamDetailView({ slug }: { slug: string }) {
  const team = getTeam(slug);
  if (!team) {
    return (
      <div className="bf-home-empty" style={{ padding: 32 }}>
        <p>Equipo no encontrado.</p>
        <Link href="/teams">Ver clubes</Link>
      </div>
    );
  }

  const roster = getPlayersByTeam(slug);
  const rosterPlayers = (roster.length > 0 ? roster : team.roster.map((s) => getPlayer(s)).filter(Boolean)).filter(
    Boolean,
  ) as NonNullable<ReturnType<typeof getPlayer>>[];

  const teamMatches = matches
    .filter((m) => m.teamASlug === slug || m.teamBSlug === slug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentMatches = teamMatches.filter((m) => m.status === "finished").slice(0, 8);
  const upcoming = getUpcomingMatches()
    .filter((m) => m.teamASlug === slug || m.teamBSlug === slug)
    .slice(0, 5);
  const liveNow = teamMatches.filter((m) => m.status === "live");
  const tourHistory = getTeamTournamentHistory(slug, 10);
  const registered = getTeamRegisteredTournaments(slug, 8);
  const liquipedia = getTeamLiquipediaUrl(slug);

  const recentWins = recentMatches.filter((m) => {
    const isA = m.teamASlug === slug;
    return isA ? m.scoreA > m.scoreB : m.scoreB > m.scoreA;
  }).length;
  const winRate = recentMatches.length ? Math.round((recentWins / recentMatches.length) * 100) : 0;
  const wins = team.form.filter((f) => f === "W").length;
  const avgRating = rosterPlayers.length
    ? (rosterPlayers.reduce((s, p) => s + p.rating, 0) / rosterPlayers.length).toFixed(2)
    : "—";
  const avgPts = rosterPlayers.length
    ? Math.round(rosterPlayers.reduce((s, p) => s + p.fantasyPoints, 0) / rosterPlayers.length)
    : 0;

  return (
    <div className="bf-team-page">
      <section className="bf-team-hero">
        <div className="bf-team-hero-glow" aria-hidden />
        <TeamLogo slug={team.slug} name={team.name} size={96} />
        <div className="bf-team-hero-body">
          <div className="bf-team-hero-badges">
            <span className="bp-chip bp-chip-gold">#{team.rank} global</span>
            <RegionBadge region={team.region} />
            <CountryFlag country={team.country} size={20} />
            <FormDots form={team.form} />
          </div>
          <h1 className="bf-team-hero-name">{team.name}</h1>
          <p className="bf-team-hero-tag">
            {team.tag} · {team.country} · ${(team.earnings / 1000).toFixed(0)}K en premios Liquipedia
          </p>
          <div className="bf-team-hero-actions">
            {hasFantasyForTournament(DEFAULT_FANTASY_TOURNAMENT) && (
              <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} className="bp-btn bp-btn-gold">
                Fantasy
              </Link>
            )}
            <Link href="/predictions" className="bp-btn bp-btn-red">Votar partidos</Link>
            {liquipedia && (
              <a href={liquipedia} target="_blank" rel="noopener noreferrer" className="bp-btn bp-btn-ghost">
                Liquipedia
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="bf-team-stats-bar">
        <div className="bf-team-stat"><strong>{rosterPlayers.length}</strong><span>Roster</span></div>
        <div className="bf-team-stat"><strong>{avgRating}</strong><span>Rating medio</span></div>
        <div className="bf-team-stat"><strong>{avgPts}</strong><span>Pts fantasy</span></div>
        <div className="bf-team-stat"><strong>{wins}/{team.form.length}</strong><span>Forma W</span></div>
        <div className="bf-team-stat"><strong>{teamMatches.length}</strong><span>Partidos totales</span></div>
        <div className="bf-team-stat"><strong>{team.achievements.length}</strong><span>Trofeos</span></div>
        {SHOW_DEMO_SOCIAL && <div className="bf-team-stat"><strong>{winRate}%</strong><span>Win reciente</span></div>}
      </div>

      <section className="bf-team-section">
        <div className="bf-home-block-head">
          <h2 className="bf-home-block-title">Plantilla pro</h2>
          <span className="bf-team-section-hint">Cards fantasy · datos catálogo</span>
        </div>
        <div className="bf-team-roster-cards">
          {rosterPlayers
            .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
            .map((p) => (
              <PlayerCard
                key={p.slug}
                playerSlug={p.slug}
                size="md"
                price={getPlayerPrice(p.slug)}
                pickRate={SHOW_DEMO_SOCIAL ? getPickRate(p.slug) : undefined}
                href={`/players/${p.slug}`}
              />
            ))}
        </div>
      </section>

      <div className="bf-team-grid-2">
        <section className="bf-team-panel">
          <h2 className="bf-home-block-title">Próximos partidos</h2>
          {upcoming.length === 0 && liveNow.length === 0 ? (
            <p className="bf-home-empty">Sin partidos programados.</p>
          ) : (
            <>
              {liveNow.map((m) => (
                <MatchLine key={m.id} match={m} rich />
              ))}
              {upcoming.map((m) => (
                <MatchLine key={m.id} match={m} rich />
              ))}
            </>
          )}
        </section>

        <section className="bf-team-panel">
          <h2 className="bf-home-block-title">Últimos resultados</h2>
          {recentMatches.length === 0 ? (
            <p className="bf-home-empty">Sin resultados recientes.</p>
          ) : (
            recentMatches.map((m) => <MatchLine key={m.id} match={m} rich />)
          )}
        </section>
      </div>

      {team.achievements.length > 0 && (
        <section className="bf-team-section">
          <h2 className="bf-home-block-title">Palmarés</h2>
          <div className="bf-team-achievements">
            {team.achievements.map((a, i) => (
              <div key={i} className="bf-team-achievement">
                <span className="bf-team-ach-place">{a.place}</span>
                <div>
                  <strong>{a.tournament}</strong>
                  <span>{a.prize} · {a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bf-team-section">
        <div className="bf-home-block-head">
          <h2 className="bf-home-block-title">Torneos del club</h2>
          <Link href="/tournaments" className="bf-home-link">Ver torneos</Link>
        </div>
        <div className="bf-team-tour-list">
          {tourHistory.map((t) => (
            <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-team-tour-row">
              <TournamentLogo slug={t.slug} name={clean(t.shortName)} size={44} />
              <div className="bf-team-tour-info">
                {t.tier != null && <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>}
                <strong>{clean(t.shortName)}</strong>
                <span>
                  {t.played} partidos · {t.wins}W {t.losses}L · {t.prizePool}
                </span>
              </div>
              <span className={`bf-home-tour-status status-${t.status}`}>{t.status}</span>
            </Link>
          ))}
          {registered
            .filter((t) => !tourHistory.some((h) => h.slug === t.slug))
            .map((t) => (
              <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-team-tour-row is-muted">
                <TournamentLogo slug={t.slug} name={clean(t.shortName)} size={44} />
                <div className="bf-team-tour-info">
                  <strong>{clean(t.shortName)}</strong>
                  <span>Inscrito · {t.prizePool}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
