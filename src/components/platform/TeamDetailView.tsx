"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MatchLine, FormDots } from "@/components/platform/ui";
import { DetailTabs } from "@/components/platform/DetailTabs";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { tierBadgeClass, tierLabel } from "@/lib/data";
import {
  getPlayersByTeam,
  matches,
  getPlayer,
  getUpcomingMatches,
  hasFantasyForTournament,
  DEFAULT_FANTASY_TOURNAMENT,
  getPlayerPrice,
} from "@/lib/data";
import { getTeamTournamentHistory, getTeamRegisteredTournaments } from "@/lib/data/team-detail";
import { getTeamComputedStats } from "@/lib/data/entity-stats";
import { useResolvedTeam } from "@/hooks/useResolvedEntity";

function clean(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

type TabId = "overview" | "roster" | "matches" | "tournaments" | "trophies";

export function TeamDetailView({ slug }: { slug: string }) {
  const team = useResolvedTeam(slug);
  const [tab, setTab] = useState<TabId>("overview");

  const rosterPlayers = useMemo(() => {
    if (!team) return [];
    const roster = getPlayersByTeam(slug);
    const list =
      roster.length > 0 ? roster : team.roster.map((s) => getPlayer(s)).filter(Boolean);
    return (list as NonNullable<ReturnType<typeof getPlayer>>[]).sort(
      (a, b) => b.fantasyPoints - a.fantasyPoints,
    );
  }, [team, slug]);

  if (!team) {
    return (
      <div className="bf-home-empty" style={{ padding: 32 }}>
        <p>Equipo no encontrado.</p>
        <Link href="/teams">Ver clubes</Link>
      </div>
    );
  }

  const teamMatches = matches
    .filter((m) => m.teamASlug === slug || m.teamBSlug === slug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentMatches = teamMatches.filter((m) => m.status === "finished").slice(0, 12);
  const upcoming = getUpcomingMatches()
    .filter((m) => m.teamASlug === slug || m.teamBSlug === slug)
    .slice(0, 8);
  const liveNow = teamMatches.filter((m) => m.status === "live");
  const tourHistory = getTeamTournamentHistory(slug, 12);
  const registered = getTeamRegisteredTournaments(slug, 10);

  const computed = getTeamComputedStats(
    slug,
    rosterPlayers.map((p) => p.slug),
  );
  const avgRating = computed.avgRating.toFixed(2);
  const avgPts = computed.avgFantasyPts;
  const winRate = computed.winRate;
  const social = team.social as Record<string, string>;
  const meta = team.meta as Record<string, unknown>;
  const founded = typeof meta.founded === "string" ? meta.founded : null;
  const coach = typeof meta.coach === "string" ? meta.coach : null;

  const tabs = [
    { id: "overview" as const, label: "Resumen" },
    { id: "roster" as const, label: "Plantilla", count: rosterPlayers.length },
    { id: "matches" as const, label: "Partidos", count: upcoming.length + liveNow.length },
    { id: "tournaments" as const, label: "Torneos", count: tourHistory.length },
    { id: "trophies" as const, label: "Palmarés", count: team.achievements.length },
  ];

  const showcasePlayers = rosterPlayers.slice(0, 3);

  return (
    <div className="bf-team-page bf-detail-page bf-page-ultra">
      <section className="bf-detail-hero-premium">
        <div className="bf-detail-hero-premium-bg" aria-hidden />
        <div className="bf-detail-hero-premium-grid">
          <div className="bf-detail-logo-ring">
            <TeamLogo slug={team.slug} name={team.name} size={112} />
          </div>
          <div>
            <div className="bf-team-hero-badges">
              <span className="bp-chip bp-chip-gold">#{team.rank || "—"} global</span>
              <RegionBadge region={team.region} />
              <CountryFlag country={team.country} size={20} />
              <FormDots form={computed.recentForm.length ? computed.recentForm : team.form} />
            </div>
            <h1 className="bf-detail-hero-name">{team.name}</h1>
            <p className="bf-detail-hero-tagline">
              {team.tag} · {team.country} · ${(team.earnings / 1000).toFixed(0)}K premios ·{" "}
              {computed.tournamentsPlayed} torneos disputados
            </p>
            {computed.topPlayer && (
              <p className="bf-detail-hero-tagline" style={{ marginTop: 8 }}>
                Estrella: <strong>{computed.topPlayer.ign}</strong> · OVR {computed.topPlayer.fantasyPoints}
              </p>
            )}
            <div className="bf-team-hero-actions">
              {hasFantasyForTournament(DEFAULT_FANTASY_TOURNAMENT) && (
                <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} className="bp-btn bp-btn-gold">
                  Fantasy
                </Link>
              )}
              <Link href="/predictions" className="bp-btn bp-btn-red">
                Predicciones
              </Link>
            </div>
          </div>
          {showcasePlayers.length > 0 && (
            <div className="bf-detail-roster-float" aria-hidden={showcasePlayers.length === 0}>
              {showcasePlayers.map((p) => (
                <PlayerCard
                  key={p.slug}
                  playerSlug={p.slug}
                  clubSlug={slug}
                  size="md"
                  price={getPlayerPrice(p.slug)}
                  href={`/players/${p.slug}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="bf-stat-grid-premium">
        <div className="bf-stat-card-premium"><b>{rosterPlayers.length}</b><span>Plantilla</span></div>
        <div className="bf-stat-card-premium"><b>{avgRating}</b><span>Rating medio</span></div>
        <div className="bf-stat-card-premium"><b>{avgPts}</b><span>OVR fantasy</span></div>
        <div className="bf-stat-card-premium"><b>{winRate}%</b><span>Win rate</span></div>
        <div className="bf-stat-card-premium"><b>{computed.wins}W</b><span>Últimos {computed.finishedMatches}</span></div>
        <div className="bf-stat-card-premium"><b>{computed.totalMatches}</b><span>Partidos totales</span></div>
        <div className="bf-stat-card-premium"><b>{team.achievements.length}</b><span>Trofeos</span></div>
        <div className="bf-stat-card-premium"><b>{computed.tournamentsPlayed}</b><span>Torneos</span></div>
      </div>

      <DetailTabs
        tabs={tabs}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        logo={<TeamLogo slug={slug} name={team.name} size={64} glow />}
      />

      {tab === "overview" && (
        <div className="bf-detail-panel bf-stagger">
          <section className="bf-detail-info-grid">
            <div className="bf-info-block-premium">
              <h3>Sobre el club</h3>
              <p className="bf-detail-prose">
                {team.description ||
                  `${team.name} compite en el circuito Brawl Stars Championship (${team.region}). Plantilla de ${rosterPlayers.length} jugadores activos con rating medio ${avgRating}.`}
              </p>
              <dl className="bf-detail-dl">
                <div><dt>Región</dt><dd><RegionBadge region={team.region} /></dd></div>
                <div><dt>País</dt><dd>{team.country || "—"}</dd></div>
                <div><dt>Premios</dt><dd>${(team.earnings / 1000).toFixed(0)}K</dd></div>
                {founded && <div><dt>Fundado</dt><dd>{founded}</dd></div>}
                {coach && <div><dt>Coach</dt><dd>{coach}</dd></div>}
              </dl>
            </div>
            {(social.twitter || social.discord || social.youtube) && (
              <div className="bf-info-block-premium">
                <h3>Redes y comunidad</h3>
                <ul className="bf-detail-links">
                  {social.twitter && <li><a href={social.twitter} target="_blank" rel="noopener noreferrer">Twitter / X</a></li>}
                  {social.discord && <li><a href={social.discord} target="_blank" rel="noopener noreferrer">Discord</a></li>}
                  {social.youtube && <li><a href={social.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></li>}
                </ul>
              </div>
            )}
          </section>
          <section className="bf-team-section">
            <div className="bf-home-block-head">
              <h2 className="bf-home-block-title">Plantilla destacada</h2>
              <button type="button" className="bf-home-link" onClick={() => setTab("roster")}>
                Ver todos
              </button>
            </div>
            <div className="bf-team-roster-cards">
              {rosterPlayers.slice(0, 4).map((p) => (
                <PlayerCard
                  key={p.slug}
                  playerSlug={p.slug}
                  clubSlug={slug}
                  size="md"
                  price={getPlayerPrice(p.slug)}
                  href={`/players/${p.slug}`}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "roster" && (
        <section className="bf-team-section bf-detail-panel">
          <div className="bf-home-block-head">
            <h2 className="bf-home-block-title">Plantilla completa</h2>
            <span className="bf-team-section-hint">{rosterPlayers.length} jugadores</span>
          </div>
          <div className="bf-team-roster-cards">
            {rosterPlayers.map((p) => (
              <PlayerCard
                key={p.slug}
                playerSlug={p.slug}
                clubSlug={slug}
                size="md"
                showExtended
                price={getPlayerPrice(p.slug)}
                href={`/players/${p.slug}`}
              />
            ))}
          </div>
        </section>
      )}

      {tab === "matches" && (
        <div className="bf-team-grid-2 bf-detail-panel">
          <section className="bf-team-panel">
            <h2 className="bf-home-block-title">Próximos y en vivo</h2>
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
      )}

      {tab === "tournaments" && (
        <section className="bf-team-section bf-detail-panel">
          <div className="bf-home-block-head">
            <h2 className="bf-home-block-title">Historial competitivo</h2>
            <Link href="/tournaments" className="bf-home-link">Ver torneos</Link>
          </div>
          <div className="bf-team-tour-list">
            {tourHistory.map((t) => (
              <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-team-tour-row bf-hover-lift">
                <TournamentLogo slug={t.slug} name={clean(t.shortName)} size={44} />
                <div className="bf-team-tour-info">
                  {t.tier != null && (
                    <span className={`bf-tier-badge ${tierBadgeClass(t.tier)}`}>{tierLabel(t.tier)}</span>
                  )}
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
                <Link key={t.slug} href={`/tournaments/${t.slug}`} className="bf-team-tour-row is-muted bf-hover-lift">
                  <TournamentLogo slug={t.slug} name={clean(t.shortName)} size={44} />
                  <div className="bf-team-tour-info">
                    <strong>{clean(t.shortName)}</strong>
                    <span>Inscrito · {t.prizePool}</span>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {tab === "trophies" && (
        <section className="bf-team-section bf-detail-panel">
          <h2 className="bf-home-block-title">Palmarés</h2>
          {team.achievements.length === 0 ? (
            <p className="bf-home-empty">Sin títulos registrados aún.</p>
          ) : (
            <div className="bf-team-achievements">
              {team.achievements.map((a, i) => (
                <div key={i} className="bf-team-achievement bf-hover-lift">
                  <span className="bf-team-ach-place">{a.place}</span>
                  <div>
                    <strong>{a.tournament}</strong>
                    <span>{a.prize} · {a.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
