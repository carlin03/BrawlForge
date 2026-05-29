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
import { getPlayerComputedStats } from "@/lib/data/entity-stats";
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
  ProfileSocialHub,
  ProfileWikiArticle,
  type InfoboxRow,
} from "@/components/platform/EntityProfileLayout";

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

  if (!player) {
    return (
      <div className="bf-home-empty" style={{ padding: 32 }}>
        <p>Jugador no encontrado.</p>
        <Link href="/players">Ver jugadores</Link>
      </div>
    );
  }

  const pStats = getPlayerComputedStats(slug, player.teamSlug);
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
    `${player.ign} es ${player.role} en ${team?.name ?? "el circuito internacional"}. Rating ${player.rating.toFixed(2)}, pico ${peakRating.toFixed(2)} y ${player.fantasyPoints} OVR en fantasy BrawlForge.`;

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
    { label: "OVR fantasy", value: String(player.fantasyPoints) },
    { label: "Valor mercado", value: `${price.toFixed(1)}M` },
    { label: "Propiedad FF", value: `${player.fantasyOwnership}%` },
    { label: "Rol fantasy", value: role },
  ];

  if (player.previousTeams.length > 0) {
    infoboxRows.push({
      label: "Equipos anteriores",
      value: player.previousTeams.join(" · "),
    });
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
    <div className="bf-player-page bf-team-page bf-detail-page bf-page-ultra bf-entity-page">
      <ProfileCinematicBanner url={profile.banner_url} accent="var(--bp-blue-bright)" />

      <section className="bf-detail-hero-premium bf-ep-hero">
        <div className="bf-detail-hero-premium-bg" aria-hidden />
        <div className="bf-detail-hero-premium-grid bf-ep-player-hero-grid">
          <div className="bf-ep-player-card-wrap">
            <PlayerCard
              playerSlug={slug}
              clubSlug={team?.slug}
              size="hero"
              price={price}
              animate
              showExtended
            />
          </div>
          <div className="bf-ep-hero-copy">
            <div className="bf-team-hero-badges">
              <span className="bp-chip bp-chip-gold">{role}</span>
              {player.isCaptain && <span className="bp-chip bp-chip-red">Capitán</span>}
              <RegionBadge region={player.region} />
              {player.country && <CountryFlag country={player.country} size={20} />}
              <span className={`bp-chip ${player.status === "active" ? "bp-chip-blue" : "bp-chip-red"}`}>
                {player.status === "active" ? "Activo" : player.status}
              </span>
            </div>
            {displayTagline && <p className="bf-ep-hero-kicker">{displayTagline}</p>}
            <h1 className="bf-detail-hero-name">{player.ign}</h1>
            {player.realName && <p className="bf-detail-hero-tagline">{player.realName}</p>}
            {team ? (
              <Link href={`/teams/${team.slug}`} className="bf-player-club-link">
                <TeamLogo slug={team.slug} name={team.name} size={36} />
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
      </section>

      <div className="bf-stat-grid-premium bf-ep-stat-ribbon">
        <div className="bf-stat-card-premium"><b>{player.rating.toFixed(2)}</b><span>Rating</span></div>
        <div className="bf-stat-card-premium"><b>{peakRating.toFixed(2)}</b><span>Pico</span></div>
        <div className="bf-stat-card-premium"><b>{player.fantasyPoints}</b><span>OVR</span></div>
        <div className="bf-stat-card-premium"><b>{price.toFixed(1)}M</b><span>Valor</span></div>
        <div className="bf-stat-card-premium"><b>{player.fantasyOwnership}%</b><span>Propiedad</span></div>
        {form.length > 0 && (
          <div className="bf-stat-card-premium">
            <b>
              {formWins}/{form.length}
            </b>
            <span>Forma W</span>
          </div>
        )}
        <div className="bf-stat-card-premium"><b>{role}</b><span>Rol FF</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.teammatesCount}</b><span>Compañeros</span></div>
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
                <ProfileSocialHub social={social} liquipediaUrl={player.liquipediaUrl} />
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
            galleryUrls={profile.gallery_urls ?? []}
            career={profile.career_highlights}
            social={social}
            liquipediaUrl={player.liquipediaUrl}
            playstyle={profile.playstyle}
            brawlers={brawlers}
            emptyHint="Todavía no hay biografía extendida. Desde el admin → Jugadores → Biografía / Carrera puedes añadir secciones, trayectoria y galería."
          />
        </div>
      )}

      {tab === "stats" && (
        <section className="bf-detail-panel bf-ep-stats">
          <div className="bf-detail-info-grid">
            <div className="bf-panel bf-detail-card">
              <h2 className="bf-home-block-title">Rendimiento competitivo</h2>
              <dl className="bf-detail-dl bf-detail-dl-wide">
                <div>
                  <dt>Rating actual</dt>
                  <dd>{player.rating.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>Rating pico</dt>
                  <dd>{peakRating.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>OVR fantasy</dt>
                  <dd>{player.fantasyPoints}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{player.status}</dd>
                </div>
                <div>
                  <dt>Rol</dt>
                  <dd>{player.role}</dd>
                </div>
                <div>
                  <dt>Tier mercado</dt>
                  <dd>{pStats.marketTier}</dd>
                </div>
              </dl>
            </div>
            {form.length > 0 && (
              <div className="bf-panel bf-detail-card">
                <h2 className="bf-home-block-title">Forma reciente</h2>
                <div className="bf-player-form">
                  {form.map((r, i) => (
                    <span
                      key={i}
                      className={`bf-player-form-dot ${r === "W" ? "is-win" : "is-loss"}`}
                      title={r}
                    />
                  ))}
                </div>
                <p className="bf-detail-prose" style={{ marginTop: 12 }}>
                  {formWins} victorias en los últimos {form.length} eventos.
                </p>
              </div>
            )}
            {brawlers.length > 0 && (
              <div className="bf-panel bf-detail-card">
                <ProfileBrawlerPool brawlers={brawlers} />
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "fantasy" && (
        <section className="bf-detail-panel">
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
        <section className="bf-team-section bf-detail-panel">
          {team ? (
            <>
              <ProfileSectionHeader
                title={`Compañeros en ${team.tag}`}
                action={<Link href={`/teams/${team.slug}`} className="bf-home-link">Ver club</Link>}
              />
              <div className="bf-team-roster-cards">
                {teammates.map((p) => (
                  <PlayerCard
                    key={p.slug}
                    playerSlug={p.slug}
                    clubSlug={team.slug}
                    size="md"
                    price={getPlayerPrice(p.slug)}
                    href={`/players/${p.slug}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="bf-home-empty">Sin equipo asignado actualmente.</p>
          )}
        </section>
      )}
    </div>
  );
}
