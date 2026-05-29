"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MatchLine, FormDots } from "@/components/platform/ui";
import { DetailTabs } from "@/components/platform/DetailTabs";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  getPlayersByTeam,
  matches,
  getPlayer,
  getUpcomingMatches,
  hasFantasyForTournament,
  DEFAULT_FANTASY_TOURNAMENT,
} from "@/lib/data";
import { getTeamTournamentHistory, getTeamRegisteredTournaments } from "@/lib/data/team-detail";
import {
  getTeamComputedStats,
  getRosterPlayerStats,
  getTeamNextOrLiveMatch,
} from "@/lib/data/entity-stats";
import { useResolvedTeam } from "@/hooks/useResolvedEntity";
import { useCatalog } from "@/contexts/CatalogContext";
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
  ProfileWikiArticle,
  type InfoboxRow,
} from "@/components/platform/EntityProfileLayout";
import {
  CompactMatchCard,
  DenseInfoRow,
  FormStrip,
  MatchResultsStrip,
  MetricsGrid,
  MetricCell,
  TeamStatsDashboard,
  WinRateVisual,
} from "@/components/platform/EntityPremiumUI";
import {
  FeaturedPlayersSection,
  RosterPanel,
  TeamAdvancedStatsSection,
  TeamOrganizationBlock,
  TeamPartnersSection,
  TournamentHistoryFiltered,
} from "@/components/platform/TeamPageSections";
import {
  getFeaturedPlayers,
  getTeamAdvancedStats,
  getTeamOrgInfo,
  parseTeamSponsors,
} from "@/lib/data/team-page-stats";

function clean(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").trim();
}

type TabId = "overview" | "history" | "roster" | "matches" | "stats" | "tournaments" | "trophies";

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

  const { marketByKey, playersBySlug } = useCatalog();
  const rosterSlugs = useMemo(() => rosterPlayers.map((p) => p.slug), [rosterPlayers]);
  const formByPlayer = useMemo(() => {
    const m = new Map<string, ("W" | "L")[]>();
    for (const s of rosterSlugs) {
      const row = marketByKey.get(`${DEFAULT_FANTASY_TOURNAMENT}:${s}`);
      if (row?.form?.length) m.set(s, row.form as ("W" | "L")[]);
    }
    return m;
  }, [rosterSlugs, marketByKey]);
  const rosterPlayerMeta = useMemo(() => {
    const m = new Map<string, { country?: string | null; isCaptain?: boolean }>();
    for (const p of rosterPlayers) {
      const row = playersBySlug.get(p.slug);
      m.set(p.slug, {
        country: row?.country ?? null,
        isCaptain: Boolean(row && "is_captain" in row && (row as { is_captain?: boolean }).is_captain),
      });
    }
    return m;
  }, [rosterPlayers, playersBySlug]);

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
  const recentMatches = teamMatches.filter((m) => m.status === "finished").slice(0, 8);
  const upcoming = getUpcomingMatches()
    .filter((m) => m.teamASlug === slug || m.teamBSlug === slug)
    .slice(0, 6);
  const liveNow = teamMatches.filter((m) => m.status === "live");
  const nextMatch = getTeamNextOrLiveMatch(slug);
  const tourHistory = getTeamTournamentHistory(slug, 12);
  const registered = getTeamRegisteredTournaments(slug, 10);

  const computed = getTeamComputedStats(slug, rosterSlugs);
  const rosterStats = getRosterPlayerStats(slug, rosterSlugs, formByPlayer, rosterPlayerMeta);
  const avgRating = computed.avgRating.toFixed(2);
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
  const sponsors = parseTeamSponsors(profile.sponsors ?? (team.meta as Record<string, unknown>)?.sponsors);
  const featuredPlayers = getFeaturedPlayers(rosterStats);
  const orgInfo = getTeamOrgInfo(team, founded, coach, profile);
  const advancedStats = getTeamAdvancedStats(slug, team.region);
  const tagline = profile.tagline || team.circuitSummary || `${team.tag} · ${team.country}`;
  const intro =
    team.description ||
    `${team.name} compite en el circuito Brawl Stars Championship (${team.region}). Plantilla de ${rosterPlayers.length} jugadores, ${winRate}% win rate y ranking ${team.rank ? `#${team.rank}` : "sin clasificar"} global.`;

  const infoboxRows: InfoboxRow[] = [
    { label: "Región", value: <RegionBadge region={team.region} />, highlight: true },
    { label: "País", value: team.country || "—" },
    { label: "Ranking global", value: team.rank ? `#${team.rank}` : "—", highlight: true },
    {
      label: "Ranking regional",
      value: computed.regionalRank ? `#${computed.regionalRank}` : "—",
    },
    { label: "Premios", value: `$${(team.earnings / 1000).toFixed(0)}K` },
    { label: "Win rate", value: `${winRate}%`, highlight: true },
    { label: "Victorias", value: String(computed.wins) },
    { label: "Derrotas", value: String(computed.losses) },
    { label: "Títulos", value: String(team.achievements.length) },
    { label: "Plantilla", value: `${rosterPlayers.length} jugadores` },
    { label: "Rating medio", value: avgRating },
    { label: "OVR fantasy", value: String(computed.avgFantasyPts) },
    founded ? { label: "Fundación", value: founded } : { label: "Fundación", value: "—" },
    coach ? { label: "Entrenador", value: coach } : { label: "Entrenador", value: "—" },
    { label: "Torneos", value: String(computed.tournamentsPlayed) },
    { label: "Partidos", value: String(computed.totalMatches) },
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
    { id: "stats" as const, label: "Estadísticas" },
    { id: "matches" as const, label: "Partidos", count: upcoming.length + liveNow.length + recentMatches.length },
    { id: "tournaments" as const, label: "Torneos", count: tourHistory.length },
    { id: "trophies" as const, label: "Palmarés", count: team.achievements.length },
  ];

  return (
    <div className="bf-team-page bf-detail-page bf-page-ultra bf-entity-page bf-entity-dense">
      <ProfileCinematicBanner url={profile.banner_url} accent="var(--bp-gold)" />

      <section className="bf-detail-hero-premium bf-ep-hero bf-hero-dense">
        <div className="bf-detail-hero-premium-bg" aria-hidden />
        <div className="bf-detail-hero-premium-grid bf-hero-dense-grid">
          <div className="bf-hero-dense-identity">
            <div className="bf-detail-logo-ring bf-ep-logo-ring">
              <TeamLogo slug={team.slug} name={team.name} size={96} />
            </div>
            <div className="bf-ep-hero-copy">
              <div className="bf-team-hero-badges">
                <span className="bp-chip bp-chip-gold">
                  #{team.rank || "—"} global
                </span>
                {computed.regionalRank != null && computed.regionalRank > 0 && (
                  <span className="bp-chip bp-chip-blue">
                    #{computed.regionalRank} {team.region}
                  </span>
                )}
                <RegionBadge region={team.region} />
                <CountryFlag country={team.country} size={20} />
                <FormDots form={computed.recentForm.length ? computed.recentForm : team.form} />
              </div>
              <p className="bf-ep-hero-kicker">{team.tag}</p>
              <h1 className="bf-detail-hero-name">{team.name}</h1>
              <p className="bf-detail-hero-tagline">{tagline}</p>
              {profile.motto && (
                <p className="bf-detail-hero-motto">&ldquo;{profile.motto}&rdquo;</p>
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
          </div>

          <div className="bf-hero-dense-metrics">
            <WinRateVisual wins={computed.wins} losses={computed.losses} pct={winRate} />
            <DenseInfoRow
              items={[
                { label: "Títulos", value: team.achievements.length },
                { label: "Premios", value: `$${(team.earnings / 1000).toFixed(0)}K` },
                { label: "Plantilla", value: rosterPlayers.length },
                { label: "OVR medio", value: computed.avgFantasyPts },
                { label: "Rating", value: avgRating },
                { label: "Torneos", value: computed.tournamentsPlayed },
              ]}
            />
            {computed.topPlayer && (
              <p className="bf-ep-hero-star">
                MVP roster:{" "}
                <Link href={`/players/${computed.topPlayer.slug}`}>
                  <strong>{computed.topPlayer.ign}</strong>
                </Link>{" "}
                · OVR {computed.topPlayer.fantasyPoints}
              </p>
            )}
          </div>

          <div className="bf-hero-dense-match">
            <h3 className="bf-dense-block-title">
              {nextMatch?.status === "live" ? "En vivo" : "Próximo partido"}
            </h3>
            {nextMatch ? (
              <CompactMatchCard match={nextMatch} perspectiveTeam={slug} />
            ) : (
              <p className="bf-home-empty bf-hero-empty-match">Sin partidos programados</p>
            )}
            <FormStrip
              form={computed.recentForm.length ? computed.recentForm : team.form}
              label="Últimos resultados"
            />
          </div>
        </div>
      </section>

      <div className="bf-stat-grid-premium bf-ep-stat-ribbon bf-stat-ribbon-dense">
        <div className="bf-stat-card-premium"><b>#{team.rank || "—"}</b><span>Global</span></div>
        <div className="bf-stat-card-premium"><b>#{computed.regionalRank || "—"}</b><span>Regional</span></div>
        <div className="bf-stat-card-premium"><b>{winRate}%</b><span>Win rate</span></div>
        <div className="bf-stat-card-premium"><b>{computed.wins}W</b><span>Victorias</span></div>
        <div className="bf-stat-card-premium"><b>{computed.losses}L</b><span>Derrotas</span></div>
        <div className="bf-stat-card-premium"><b>{team.achievements.length}</b><span>Títulos</span></div>
        <div className="bf-stat-card-premium"><b>${(team.earnings / 1000).toFixed(0)}K</b><span>Premios</span></div>
        <div className="bf-stat-card-premium"><b>{rosterPlayers.length}</b><span>Jugadores</span></div>
        <div className="bf-stat-card-premium"><b>{avgRating}</b><span>Rating</span></div>
        <div className="bf-stat-card-premium"><b>{computed.avgFantasyPts}</b><span>OVR</span></div>
      </div>

      <DetailTabs
        tabs={tabs}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        logo={<TeamLogo slug={slug} name={team.name} size={64} glow />}
      />

      {tab === "overview" && (
        <div className="bf-detail-panel bf-ep-overview bf-dense-stack">
          <TeamStatsDashboard
            globalRank={team.rank || null}
            regionalRank={computed.regionalRank}
            totalInRegion={computed.totalTeamsInRegion}
            winRate={winRate}
            wins={computed.wins}
            losses={computed.losses}
            trophies={team.achievements.length}
            earningsK={Math.round(team.earnings / 1000)}
            tournaments={computed.tournamentsPlayed}
            matchesTotal={computed.totalMatches}
            avgRating={avgRating}
            avgOvr={computed.avgFantasyPts}
          />

          <MatchResultsStrip matches={recentMatches} perspectiveTeam={slug} />

          <FeaturedPlayersSection highlights={featuredPlayers} teamSlug={slug} />

          <section className="bf-dense-block">
            <ProfileSectionHeader
              title="Plantilla actual"
              action={
                <button type="button" className="bf-home-link" onClick={() => setTab("roster")}>
                  Ver plantilla completa
                </button>
              }
            />
            <RosterPanel rows={rosterStats} teamSlug={slug} teamName={team.name} showPrice defaultMode="cards" />
          </section>

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
                      <ProfileAchievementsShowcase achievements={team.achievements.slice(0, 4)} compact />
                    </section>
                  )}
                </>
              }
              aside={
                <>
                  <ProfileInfobox title={team.name} subtitle={team.tag} rows={infoboxRows} />
                  <TeamOrganizationBlock org={orgInfo} />
                </>
              }
            />
          </div>

          <TeamPartnersSection sponsors={sponsors} social={social} teamName={team.name} />
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
            emptyHint="Aún no hay artículo largo para este club. El contenido se edita desde el panel de administración → Equipos → Historia."
          />
        </div>
      )}

      {tab === "roster" && (
        <section className="bf-team-section bf-detail-panel bf-dense-stack">
          <ProfileSectionHeader title="Plantilla completa" />
          <MetricsGrid cols={4}>
            <MetricCell label="Jugadores" value={rosterPlayers.length} highlight />
            <MetricCell label="Rating medio" value={avgRating} />
            <MetricCell label="OVR medio" value={computed.avgFantasyPts} />
            <MetricCell label="Win rate club" value={`${winRate}%`} barPct={winRate} />
          </MetricsGrid>
          <RosterPanel rows={rosterStats} teamSlug={slug} teamName={team.name} showPrice defaultMode="cards" />
        </section>
      )}

      {tab === "stats" && (
        <section className="bf-detail-panel bf-dense-stack">
          <TeamStatsDashboard
            globalRank={team.rank || null}
            regionalRank={computed.regionalRank}
            totalInRegion={computed.totalTeamsInRegion}
            winRate={winRate}
            wins={computed.wins}
            losses={computed.losses}
            trophies={team.achievements.length}
            earningsK={Math.round(team.earnings / 1000)}
            tournaments={computed.tournamentsPlayed}
            matchesTotal={computed.totalMatches}
            avgRating={avgRating}
            avgOvr={computed.avgFantasyPts}
          />
          <TeamAdvancedStatsSection stats={advancedStats} />
          <section className="bf-dense-block">
            <h3 className="bf-dense-block-title">Participaciones</h3>
            <MetricsGrid cols={3}>
              <MetricCell label="Partidos totales" value={computed.totalMatches} />
              <MetricCell label="Finalizados" value={computed.finishedMatches} />
              <MetricCell
                label="Último partido"
                value={computed.lastMatchDate ? new Date(computed.lastMatchDate).toLocaleDateString("es") : "—"}
              />
            </MetricsGrid>
          </section>
        </section>
      )}

      {tab === "matches" && (
        <div className="bf-detail-panel bf-dense-stack">
          <section className="bf-dense-block">
            <h3 className="bf-dense-block-title">Próximos y en vivo</h3>
            {upcoming.length === 0 && liveNow.length === 0 ? (
              <p className="bf-home-empty">Sin partidos programados.</p>
            ) : (
              <div className="bf-match-results-strip">
                {liveNow.map((m) => (
                  <CompactMatchCard key={m.id} match={m} perspectiveTeam={slug} />
                ))}
                {upcoming.map((m) => (
                  <CompactMatchCard key={m.id} match={m} perspectiveTeam={slug} />
                ))}
              </div>
            )}
          </section>
          <MatchResultsStrip matches={recentMatches} perspectiveTeam={slug} title="Historial reciente" />
          <section className="bf-dense-block">
            <h3 className="bf-dense-block-title">Línea temporal</h3>
            {recentMatches.length === 0 ? (
              <p className="bf-home-empty">Sin resultados.</p>
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
          <TournamentHistoryFiltered
            rows={tourHistory}
            registered={registered.map((t) => ({
              slug: t.slug,
              name: t.name,
              shortName: t.shortName,
              prizePool: t.prizePool,
              status: t.status,
              tier: t.tier,
            }))}
            cleanName={clean}
          />
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
