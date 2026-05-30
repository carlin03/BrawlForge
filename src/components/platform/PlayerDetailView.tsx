"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DetailTabs } from "@/components/platform/DetailTabs";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { getPlayersByTeam } from "@/lib/data";
import { getPlayerPrice, transferMarket, DEFAULT_FANTASY_TOURNAMENT } from "@/lib/data/fantasy";
import { getFantasyRole } from "@/lib/data/fantasy-meta";
import { getPlayerComputedStats, getRosterPlayerStats } from "@/lib/data/entity-stats";
import { useResolvedPlayer, useResolvedTeam } from "@/hooks/useResolvedEntity";
import { useCatalogMarket } from "@/contexts/CatalogContext";
import { parsePlayerMeta } from "@/lib/data/profile-wiki";
import {
  ProfileArticleShell,
  ProfileBrawlerPool,
  ProfileCinematicBanner,
  ProfileHistoryTab,
  ProfileInfobox,
  ProfileLead,
  ProfilePlaystyleCard,
  ProfileSectionHeader,
  ProfileWikiArticle,
  type InfoboxRow,
} from "@/components/platform/EntityProfileLayout";
import {
  DenseInfoRow,
  FormStrip,
  PlayerStatsDashboard,
  RosterDataTable,
  WinRateVisual,
} from "@/components/platform/EntityPremiumUI";
import { FormDots } from "@/components/platform/ui";

type TabId = "overview" | "history" | "stats" | "fantasy" | "team";

export function PlayerDetailView({ slug }: { slug: string }) {
  const player = useResolvedPlayer(slug);
  const team = useResolvedTeam(player?.teamSlug ?? "");
  const [tab, setTab] = useState<TabId>("overview");
  const marketRow = useCatalogMarket(DEFAULT_FANTASY_TOURNAMENT, slug);

  const role = getFantasyRole(slug);
  const price = getPlayerPrice(slug, DEFAULT_FANTASY_TOURNAMENT);
  const market = transferMarket.find((m) => m.playerSlug === slug);
  const form = marketRow?.form?.length ? marketRow.form : (market?.form ?? []);
  const formWins = form.filter((f) => f === "W").length;

  const teammates = useMemo(() => {
    if (!team) return [];
    return getPlayersByTeam(team.slug)
      .filter((p) => p.slug !== slug && p.status === "active")
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints);
  }, [team, slug]);

  const pStats = useMemo(
    () =>
      player
        ? getPlayerComputedStats(slug, player.teamSlug, form as ("W" | "L")[])
        : null,
    [player, slug, form],
  );

  if (!player || !pStats) {
    return (
      <div className="bf-home-empty" style={{ padding: 32 }}>
        <p>Jugador no encontrado.</p>
        <Link href="/players">Ver jugadores</Link>
      </div>
    );
  }

  const social = player.social as Record<string, string>;
  const profile = parsePlayerMeta(player.meta);
  const peakRating = profile.peak_rating ?? player.rating;
  const brawlers =
    profile.main_brawlers?.length
      ? profile.main_brawlers
      : player.primaryBrawler
        ? [player.primaryBrawler]
        : [];
  const displayTagline = profile.tagline || (profile.nickname ? `«${profile.nickname}»` : null);
  const intro =
    player.bio ||
    `${player.ign} es ${player.role} en ${team?.name ?? "el circuito internacional"}. Rating ${player.rating.toFixed(2)}, ${pStats.winRate}% win rate con el club y ${player.fantasyPoints} OVR en fantasy.`;

  const teammateStats = team
    ? getRosterPlayerStats(
        team.slug,
        teammates.map((t) => t.slug),
      )
    : [];

  const infoboxRows: InfoboxRow[] = [
    { label: "IGN", value: player.ign, highlight: true },
    { label: "Nombre real", value: player.realName || "—" },
    {
      label: "Club",
      value: team ? (
        <Link href={`/teams/${team.slug}`} className="bf-ep-infobox-link">
          {team.tag} · {team.name}
        </Link>
      ) : (
        "Agente libre"
      ),
      highlight: true,
    },
    { label: "Rol", value: player.role },
    { label: "Región", value: <RegionBadge region={player.region} /> },
    { label: "País", value: player.country || team?.country || "—" },
    { label: "Estado", value: player.status === "active" ? "Activo" : player.status },
    player.isCaptain ? { label: "Capitán", value: "Sí", highlight: true } : { label: "Capitán", value: "No" },
    player.joinDate ? { label: "En el club desde", value: player.joinDate } : { label: "En el club desde", value: "—" },
    { label: "Rating", value: player.rating.toFixed(2), highlight: true },
    { label: "Rating pico", value: peakRating.toFixed(2) },
    { label: "Win rate", value: `${pStats.winRate}%`, highlight: true },
    { label: "Partidos", value: String(pStats.matchesPlayed) },
    { label: "Victorias", value: String(pStats.wins) },
    { label: "Derrotas", value: String(pStats.losses) },
    { label: "MVP rate", value: `${pStats.mvpRate}%` },
    { label: "OVR fantasy", value: String(player.fantasyPoints) },
    { label: "Valor mercado", value: `${price.toFixed(1)}M` },
    { label: "Propiedad FF", value: `${player.fantasyOwnership}%` },
    { label: "Rol fantasy", value: role },
    { label: "Torneos", value: String(pStats.tournamentsPlayed) },
    {
      label: "Ranking roster",
      value: pStats.rosterRank ? `#${pStats.rosterRank} / ${pStats.rosterSize}` : "—",
    },
  ];

  if (player.previousTeams.length > 0) {
    infoboxRows.push({
      label: "Equipos anteriores",
      value: player.previousTeams.join(" · "),
    });
  }
  if (pStats.bestAchievement) {
    infoboxRows.push({ label: "Mejor resultado", value: pStats.bestAchievement, highlight: true });
  }

  const tabs = [
    { id: "overview" as const, label: "Resumen" },
    {
      id: "history" as const,
      label: "Historia",
      count:
        (profile.wiki_sections?.length ?? 0) +
        (profile.career_highlights?.length ?? 0) +
        (profile.gallery_urls?.length ?? 0),
    },
    { id: "stats" as const, label: "Estadísticas" },
    { id: "fantasy" as const, label: "Fantasy" },
    { id: "team" as const, label: "Equipo", count: teammates.length },
  ];

  return (
    <div className="bf-player-page bf-team-page bf-detail-page bf-page-ultra bf-entity-page bf-entity-dense">
      <ProfileCinematicBanner url={profile.banner_url} accent="var(--bp-blue-bright)" />

      <section className="bf-detail-hero-premium bf-ep-hero bf-hero-dense">
        <div className="bf-detail-hero-premium-bg" aria-hidden />
        <div className="bf-detail-hero-premium-grid bf-hero-dense-grid bf-ep-player-hero-grid">
          <div className="bf-hero-dense-identity bf-ep-player-hero-identity">
            <div className="bf-ep-player-card-wrap bf-ep-player-card-compact">
              <PlayerCard
                playerSlug={slug}
                clubSlug={team?.slug}
                size="md"
                price={price}
                showExtended
              />
            </div>
            <div className="bf-ep-hero-copy">
              <div className="bf-team-hero-badges">
                <span className="bp-chip bp-chip-gold">{role}</span>
                {player.isCaptain && <span className="bp-chip bp-chip-red">Capitán</span>}
                <RegionBadge region={player.region} />
                {(player.nationality || player.country) && (
                  <CountryFlag country={player.nationality || player.country!} size={20} />
                )}
                <span className={`bp-chip ${player.status === "active" ? "bp-chip-blue" : "bp-chip-red"}`}>
                  {player.status === "active" ? "Activo" : player.status}
                </span>
                {form.length > 0 && <FormDots form={form as ("W" | "L")[]} />}
              </div>
              {displayTagline && <p className="bf-ep-hero-kicker">{displayTagline}</p>}
              <h1 className="bf-detail-hero-name">{player.ign}</h1>
              {player.realName && <p className="bf-detail-hero-tagline">{player.realName}</p>}
              {team ? (
                <Link href={`/teams/${team.slug}`} className="bf-player-club-link">
                  <TeamLogo slug={team.slug} name={team.name} size={32} />
                  <span>
                    {team.tag} · {team.name}
                  </span>
                </Link>
              ) : (
                <p className="bf-detail-hero-tagline">Agente libre</p>
              )}
              <ProfileBrawlerPool brawlers={brawlers} />
              <div className="bf-team-hero-actions">
                <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} className="bp-btn bp-btn-gold">
                  Montar plantilla
                </Link>
                <Link href="/players" className="bp-btn bp-btn-ghost">
                  Catálogo
                </Link>
              </div>
            </div>
          </div>

          <div className="bf-hero-dense-metrics">
            <WinRateVisual wins={pStats.wins} losses={pStats.losses} pct={pStats.winRate} />
            <DenseInfoRow
              items={[
                { label: "Rating", value: player.rating.toFixed(2) },
                { label: "Pico", value: peakRating.toFixed(2) },
                { label: "OVR", value: player.fantasyPoints },
                { label: "MVP rate", value: `${pStats.mvpRate}%` },
                { label: "Partidos", value: pStats.matchesPlayed },
                { label: "Valor", value: `${price.toFixed(1)}M` },
              ]}
            />
            {pStats.rosterRank && (
              <p className="bf-ep-hero-star">
                #{pStats.rosterRank} en {team?.tag ?? "roster"} · tier {pStats.marketTier}
              </p>
            )}
          </div>

          <div className="bf-hero-dense-match">
            <h3 className="bf-dense-block-title">Rendimiento</h3>
            <FormStrip
              form={(form.length ? form : pStats.form) as ("W" | "L")[]}
              label="Forma reciente"
            />
            {form.length > 0 && (
              <p className="bf-hero-form-note">
                {formWins} victorias en los últimos {form.length} eventos
              </p>
            )}
            {profile.career_highlights?.[0] && (
              <div className="bf-hero-ach-preview">
                <span className="bf-metric-label">Logro destacado</span>
                <strong>{profile.career_highlights[0].title}</strong>
                <span>{profile.career_highlights[0].detail}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="bf-stat-grid-premium bf-ep-stat-ribbon bf-stat-ribbon-dense">
        <div className="bf-stat-card-premium"><b>{player.rating.toFixed(2)}</b><span>Rating</span></div>
        <div className="bf-stat-card-premium"><b>{peakRating.toFixed(2)}</b><span>Pico</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.winRate}%</b><span>Win rate</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.matchesPlayed}</b><span>Partidos</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.wins}W</b><span>Victorias</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.losses}L</b><span>Derrotas</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.mvpRate}%</b><span>MVP rate</span></div>
        <div className="bf-stat-card-premium"><b>{player.fantasyPoints}</b><span>OVR</span></div>
        <div className="bf-stat-card-premium"><b>{price.toFixed(1)}M</b><span>Valor</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.tournamentsPlayed}</b><span>Torneos</span></div>
      </div>

      <DetailTabs
        tabs={tabs}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        logo={
          team ? (
            <TeamLogo slug={team.slug} name={team.name} size={56} glow />
          ) : (
            <RegionBadge region={player.region} />
          )
        }
      />

      {tab === "overview" && (
        <div className="bf-detail-panel bf-ep-overview bf-dense-stack">
          <PlayerStatsDashboard
            stats={pStats}
            rating={player.rating}
            peakRating={peakRating}
            fantasyPoints={player.fantasyPoints}
            price={price}
            role={role}
          />
          <div className="bf-detail-panel bf-ep-overview">
            <ProfileArticleShell
              main={
                <>
                  <ProfileLead>{intro}</ProfileLead>
                  <ProfilePlaystyleCard text={profile.playstyle ?? ""} />
                  {profile.wiki_sections && profile.wiki_sections.length > 0 && (
                    <section className="bf-ep-preview-block">
                      <ProfileSectionHeader
                        title="Extracto de biografía"
                        action={
                          <button type="button" className="bf-home-link" onClick={() => setTab("history")}>
                            Leer todo
                          </button>
                        }
                      />
                      <ProfileWikiArticle sections={profile.wiki_sections.slice(0, 1)} />
                    </section>
                  )}
                </>
              }
              aside={
                <>
                  <ProfileInfobox title={player.ign} subtitle={player.realName ?? undefined} rows={infoboxRows} />
                </>
              }
            />
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="bf-detail-panel">
          <ProfileHistoryTab
            sections={profile.wiki_sections ?? []}
            facts={profile.fun_facts ?? []}
            galleryUrls={profile.gallery_urls ?? []}
            career={profile.career_highlights}
            social={social}
            playstyle={profile.playstyle}
            brawlers={brawlers}
            emptyHint="Todavía no hay biografía extendida. Desde el admin → Jugadores → Biografía / Carrera puedes añadir secciones, trayectoria y galería."
          />
        </div>
      )}

      {tab === "stats" && (
        <section className="bf-detail-panel bf-dense-stack">
          <PlayerStatsDashboard
            stats={pStats}
            rating={player.rating}
            peakRating={peakRating}
            fantasyPoints={player.fantasyPoints}
            price={price}
            role={role}
          />
        </section>
      )}

      {tab === "fantasy" && (
        <section className="bf-detail-panel bf-dense-stack">
          <div className="bf-ep-fantasy-card bf-panel bf-detail-card">
            <h2 className="bf-home-block-title">Mercado fantasy</h2>
            <dl className="bf-detail-dl bf-detail-dl-wide">
              <div>
                <dt>Precio</dt>
                <dd>{price.toFixed(1)}M</dd>
              </div>
              <div>
                <dt>Cambio</dt>
                <dd>
                  {marketRow?.price_change != null
                    ? `${marketRow.price_change > 0 ? "+" : ""}${marketRow.price_change}M`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Propiedad</dt>
                <dd>{player.fantasyOwnership}%</dd>
              </div>
              {marketRow && marketRow.pick_rate > 0 && (
                <div>
                  <dt>Pick rate</dt>
                  <dd>{marketRow.pick_rate}%</dd>
                </div>
              )}
              <div>
                <dt>Rol fantasy</dt>
                <dd>{role}</dd>
              </div>
              <div>
                <dt>Tier</dt>
                <dd>{pStats.marketTier}</dd>
              </div>
            </dl>
            <Link
              href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`}
              className="bp-btn bp-btn-gold"
              style={{ marginTop: 16 }}
            >
              Añadir a mi plantilla
            </Link>
          </div>
        </section>
      )}

      {tab === "team" && (
        <section className="bf-team-section bf-detail-panel bf-dense-stack">
          {team ? (
            <>
              <ProfileSectionHeader
                title={`Compañeros en ${team.tag}`}
                action={<Link href={`/teams/${team.slug}`} className="bf-home-link">Ver club</Link>}
              />
              <RosterDataTable rows={teammateStats} teamSlug={team.slug} showPrice />
            </>
          ) : (
            <p className="bf-home-empty">Sin equipo asignado actualmente.</p>
          )}
        </section>
      )}
    </div>
  );
}
