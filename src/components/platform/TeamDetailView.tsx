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
import { parseTeamMeta } from "@/lib/data/profile-wiki";
import {
  ProfileAchievementsShowcase,
  ProfileArticleShell,
  ProfileCinematicBanner,
  ProfileFactsGrid,
  ProfileHistoryTab,
  ProfileInfobox,
  ProfileLead,
  ProfileSectionHeader,
  ProfileSocialHub,
  ProfileWikiArticle,
  type InfoboxRow,
} from "@/components/platform/EntityProfileLayout";

function clean(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

type TabId = "overview" | "history" | "roster" | "matches" | "tournaments" | "trophies";

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

  const computed = getTeamComputedStats(slug, rosterPlayers.map((p) => p.slug));
  const avgRating = computed.avgRating.toFixed(2);
  const avgPts = computed.avgFantasyPts;
  const winRate = computed.winRate;
  const social = team.social as Record<string, string>;
  const profile = parseTeamMeta(team.meta);
  const founded =
    team.foundedYear != null
      ? String(team.foundedYear)
      : typeof team.meta?.founded === "string"
        ? team.meta.founded
        : null;
  const coach = team.coach ?? (typeof team.meta?.coach === "string" ? team.meta.coach : null);
  const tagline = profile.tagline || team.circuitSummary || `${team.tag} · ${team.country}`;
  const liquipedia = team.liquipediaUrl || null;
  const intro =
    team.description ||
    `${team.name} compite en el circuito Brawl Stars Championship (${team.region}). Plantilla de ${rosterPlayers.length} jugadores con rating medio ${avgRating} y ${winRate}% de victorias en partidos registrados.`;

  const infoboxRows: InfoboxRow[] = [
    { label: "Región", value: <RegionBadge region={team.region} />, highlight: true },
    { label: "País", value: team.country || "—" },
    { label: "Ranking", value: team.rank ? `#${team.rank} global` : "—", highlight: true },
    { label: "Premios", value: `$${(team.earnings / 1000).toFixed(0)}K` },
    { label: "Plantilla", value: `${rosterPlayers.length} jugadores` },
    { label: "Win rate", value: `${winRate}%` },
    { label: "Rating medio", value: avgRating },
    { label: "OVR fantasy", value: String(avgPts) },
    founded ? { label: "Fundación", value: founded } : { label: "Fundación", value: "—" },
    coach ? { label: "Entrenador", value: coach } : { label: "Entrenador", value: "—" },
    { label: "Torneos", value: String(computed.tournamentsPlayed) },
  ];

  const tabs = [
    { id: "overview" as const, label: "Resumen" },
    {
      id: "history" as const,
      label: "Historia",
      count:
        (profile.wiki_sections?.length ?? 0) +
        (profile.fun_facts?.length ?? 0) +
        (profile.gallery_urls?.length ?? 0),
    },
    { id: "roster" as const, label: "Plantilla", count: rosterPlayers.length },
    { id: "matches" as const, label: "Partidos", count: upcoming.length + liveNow.length },
    { id: "tournaments" as const, label: "Torneos", count: tourHistory.length },
    { id: "trophies" as const, label: "Palmarés", count: team.achievements.length },
  ];

  const showcasePlayers = rosterPlayers.slice(0, 3);

  return (
    <div className="bf-team-page bf-detail-page bf-page-ultra bf-entity-page">
      <ProfileCinematicBanner url={profile.banner_url} accent="var(--bp-gold)" />

      <section className="bf-detail-hero-premium bf-ep-hero">
        <div className="bf-detail-hero-premium-bg" aria-hidden />
        <div className="bf-detail-hero-premium-grid">
          <div className="bf-detail-logo-ring bf-ep-logo-ring">
            <TeamLogo slug={team.slug} name={team.name} size={120} />
          </div>
          <div className="bf-ep-hero-copy">
            <div className="bf-team-hero-badges">
              <span className="bp-chip bp-chip-gold">#{team.rank || "—"} global</span>
              <RegionBadge region={team.region} />
              <CountryFlag country={team.country} size={20} />
              <FormDots form={computed.recentForm.length ? computed.recentForm : team.form} />
            </div>
            <p className="bf-ep-hero-kicker">{team.tag}</p>
            <h1 className="bf-detail-hero-name">{team.name}</h1>
            <p className="bf-detail-hero-tagline">{tagline}</p>
            {profile.motto && <p className="bf-detail-hero-motto">&ldquo;{profile.motto}&rdquo;</p>}
            {computed.topPlayer && (
              <p className="bf-ep-hero-star">
                Estrella del roster:{" "}
                <Link href={`/players/${computed.topPlayer.slug}`}>
                  <strong>{computed.topPlayer.ign}</strong>
                </Link>{" "}
                · OVR {computed.topPlayer.fantasyPoints}
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
              {liquipedia && (
                <a href={liquipedia} target="_blank" rel="noopener noreferrer" className="bp-btn bp-btn-ghost">
                  Liquipedia
                </a>
              )}
            </div>
          </div>
          {showcasePlayers.length > 0 && (
            <div className="bf-detail-roster-float">
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

      <div className="bf-stat-grid-premium bf-ep-stat-ribbon">
        <div className="bf-stat-card-premium"><b>{rosterPlayers.length}</b><span>Plantilla</span></div>
        <div className="bf-stat-card-premium"><b>{avgRating}</b><span>Rating medio</span></div>
        <div className="bf-stat-card-premium"><b>{avgPts}</b><span>OVR fantasy</span></div>
        <div className="bf-stat-card-premium"><b>{winRate}%</b><span>Win rate</span></div>
        <div className="bf-stat-card-premium"><b>{computed.wins}W</b><span>Últimos {computed.finishedMatches}</span></div>
        <div className="bf-stat-card-premium"><b>{team.achievements.length}</b><span>Títulos</span></div>
        <div className="bf-stat-card-premium"><b>{computed.tournamentsPlayed}</b><span>Torneos</span></div>
        <div className="bf-stat-card-premium"><b>${(team.earnings / 1000).toFixed(0)}K</b><span>Premios</span></div>
      </div>

      <DetailTabs
        tabs={tabs}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        logo={<TeamLogo slug={slug} name={team.name} size={64} glow />}
      />

      {tab === "overview" && (
        <div className="bf-detail-panel bf-ep-overview">
          <ProfileArticleShell
            main={
              <>
                <ProfileLead>{intro}</ProfileLead>
                {team.circuitSummary && (
                  <section className="bf-ep-circuit-card">
                    <h3>Circuito BSC 2026</h3>
                    <p>{team.circuitSummary}</p>
                  </section>
                )}
                {profile.wiki_sections && profile.wiki_sections.length > 0 && (
                  <section className="bf-ep-preview-block">
                    <ProfileSectionHeader
                      title="Extracto"
                      action={
                        <button type="button" className="bf-home-link" onClick={() => setTab("history")}>
                          Leer ficha completa
                        </button>
                      }
                    />
                    <ProfileWikiArticle sections={profile.wiki_sections.slice(0, 1)} />
                  </section>
                )}
                <ProfileFactsGrid facts={profile.fun_facts ?? []} title="En cifras" />
                {team.achievements.length > 0 && (
                  <section className="bf-ep-preview-block">
                    <ProfileSectionHeader
                      title="Últimos logros"
                      action={
                        <button type="button" className="bf-home-link" onClick={() => setTab("trophies")}>
                          Ver palmarés
                        </button>
                      }
                    />
                    <ProfileAchievementsShowcase achievements={team.achievements.slice(0, 3)} compact />
                  </section>
                )}
                <section className="bf-team-section">
                  <ProfileSectionHeader
                    title="Plantilla destacada"
                    action={
                      <button type="button" className="bf-home-link" onClick={() => setTab("roster")}>
                        Ver todos
                      </button>
                    }
                  />
                  <div className="bf-team-roster-cards">
                    {rosterPlayers.slice(0, 4).map((p) => (
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
              </>
            }
            aside={
              <>
                <ProfileInfobox title={team.name} subtitle={team.tag} rows={infoboxRows} />
                <ProfileSocialHub social={social} liquipediaUrl={liquipedia} />
              </>
            }
          />
        </div>
      )}

      {tab === "history" && (
        <div className="bf-detail-panel">
          <ProfileHistoryTab
            sections={profile.wiki_sections ?? []}
            facts={profile.fun_facts ?? []}
            rivals={profile.rivals}
            galleryUrls={profile.gallery_urls ?? []}
            achievements={team.achievements}
            social={social}
            liquipediaUrl={liquipedia}
            emptyHint="Aún no hay artículo largo para este club. El contenido se edita desde el panel de administración → Equipos → Historia."
          />
        </div>
      )}

      {tab === "roster" && (
        <section className="bf-team-section bf-detail-panel">
          <ProfileSectionHeader title="Plantilla completa" />
          <p className="bf-team-section-hint">{rosterPlayers.length} jugadores activos en el roster</p>
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
          <ProfileSectionHeader
            title="Historial competitivo"
            action={<Link href="/tournaments" className="bf-home-link">Ver torneos</Link>}
          />
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
        <section className="bf-team-section bf-detail-panel bf-ep-trophies">
          <ProfileSectionHeader title="Palmarés y trofeos" />
          {team.achievements.length === 0 ? (
            <p className="bf-home-empty">Sin títulos registrados. Añádelos desde el admin en la pestaña Palmarés.</p>
          ) : (
            <ProfileAchievementsShowcase achievements={team.achievements} />
          )}
        </section>
      )}
    </div>
  );
}
