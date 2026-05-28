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

type TabId = "profile" | "stats" | "fantasy" | "team";

export function PlayerDetailView({ slug }: { slug: string }) {
  const player = useResolvedPlayer(slug);
  const team = useResolvedTeam(player?.teamSlug ?? "");
  const [tab, setTab] = useState<TabId>("profile");
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
  const meta = player.meta as Record<string, unknown>;
  const peakRating = typeof meta.peak_rating === "number" ? meta.peak_rating : player.rating;
  const mains = Array.isArray(meta.main_brawlers) ? (meta.main_brawlers as string[]).join(", ") : null;

  const tabs = [
    { id: "profile" as const, label: "Perfil" },
    { id: "stats" as const, label: "Estadísticas" },
    { id: "fantasy" as const, label: "Fantasy" },
    { id: "team" as const, label: "Equipo", count: teammates.length },
  ];

  return (
    <div className="bf-player-page bf-team-page bf-detail-page bf-page-ultra">
      <section className="bf-detail-hero-premium">
        <div className="bf-detail-hero-premium-bg" aria-hidden />
        <div className="bf-detail-hero-premium-grid" style={{ gridTemplateColumns: "auto 1fr" }}>
          <PlayerCard
            playerSlug={slug}
            clubSlug={team?.slug}
            size="hero"
            price={price}
            animate
            showExtended
          />
          <div>
            <div className="bf-team-hero-badges">
              <span className="bp-chip bp-chip-gold">{role}</span>
              <RegionBadge region={player.region} />
              {player.country && <CountryFlag country={player.country} size={20} />}
              {team && <CountryFlag country={team.country} size={20} />}
              <span className={`bp-chip ${player.status === "active" ? "bp-chip-blue" : "bp-chip-red"}`}>
                {player.status === "active" ? "Activo" : player.status}
              </span>
            </div>
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

      <div className="bf-stat-grid-premium">
        <div className="bf-stat-card-premium"><b>{player.rating.toFixed(2)}</b><span>Rating</span></div>
        <div className="bf-stat-card-premium"><b>{player.fantasyPoints}</b><span>OVR fantasy</span></div>
        <div className="bf-stat-card-premium"><b>{price.toFixed(1)}M</b><span>Valor mercado</span></div>
        <div className="bf-stat-card-premium"><b>{player.fantasyOwnership}%</b><span>Propiedad FF</span></div>
        <div className="bf-stat-card-premium"><b>{role}</b><span>Rol fantasy</span></div>
        <div className="bf-stat-card-premium"><b>{pStats.teammatesCount}</b><span>Compañeros</span></div>
        {form.length > 0 && (
          <div className="bf-stat-card-premium">
            <b>{formWins}/{form.length}</b><span>Forma W</span>
          </div>
        )}
        {player.joinDate && (
          <div className="bf-stat-card-premium"><b>{player.joinDate}</b><span>En el club</span></div>
        )}
      </div>

      <DetailTabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === "profile" && (
        <div className="bf-detail-panel bf-stagger">
          <section className="bf-panel bf-detail-card">
            <h2 className="bf-home-block-title">Biografía</h2>
            <p className="bf-detail-prose">
              {player.bio ||
                `${player.ign} juega como ${player.role} en ${team?.name ?? "el circuito internacional"}. Rating ${player.rating.toFixed(2)} y ${player.fantasyPoints} puntos OVR en fantasy.`}
            </p>
            <dl className="bf-detail-dl">
              <div><dt>Nombre real</dt><dd>{player.realName || "—"}</dd></div>
              <div><dt>Rol</dt><dd>{player.role}</dd></div>
              <div><dt>Región</dt><dd><RegionBadge region={player.region} /></dd></div>
              <div><dt>País</dt><dd>{player.country || team?.country || "—"}</dd></div>
              {mains && <div><dt>Brawlers</dt><dd>{mains}</dd></div>}
            </dl>
          </section>
          {(social.twitter || social.twitch) && (
            <section className="bf-panel bf-detail-card">
              <h2 className="bf-home-block-title">Redes</h2>
              <ul className="bf-detail-links">
                {social.twitter && <li><a href={social.twitter} target="_blank" rel="noopener noreferrer">Twitter / X</a></li>}
                {social.twitch && <li><a href={social.twitch} target="_blank" rel="noopener noreferrer">Twitch</a></li>}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === "stats" && (
        <section className="bf-detail-panel">
          <div className="bf-detail-info-grid">
            <div className="bf-panel bf-detail-card">
              <h2 className="bf-home-block-title">Rendimiento</h2>
              <dl className="bf-detail-dl bf-detail-dl-wide">
                <div><dt>Rating actual</dt><dd>{player.rating.toFixed(2)}</dd></div>
                {peakRating != null && <div><dt>Rating pico</dt><dd>{peakRating.toFixed(2)}</dd></div>}
                <div><dt>OVR fantasy</dt><dd>{player.fantasyPoints}</dd></div>
                <div><dt>Estado</dt><dd>{player.status}</dd></div>
                <div><dt>Rol competitivo</dt><dd>{player.role}</dd></div>
              </dl>
            </div>
            {form.length > 0 && (
              <div className="bf-panel bf-detail-card">
                <h2 className="bf-home-block-title">Forma reciente</h2>
                <div className="bf-player-form">
                  {form.map((r, i) => (
                    <span key={i} className={`bf-player-form-dot ${r === "W" ? "is-win" : "is-loss"}`} title={r} />
                  ))}
                </div>
                <p className="bf-detail-prose" style={{ marginTop: 12 }}>
                  {formWins} victorias en los últimos {form.length} eventos registrados.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "fantasy" && (
        <section className="bf-detail-panel">
          <div className="bf-detail-info-grid">
            <div className="bf-panel bf-detail-card">
              <h2 className="bf-home-block-title">Mercado fantasy</h2>
              <dl className="bf-detail-dl bf-detail-dl-wide">
                <div><dt>Precio</dt><dd>{price.toFixed(1)}M</dd></div>
                <div><dt>Cambio</dt><dd>{marketRow?.price_change != null ? `${marketRow.price_change > 0 ? "+" : ""}${marketRow.price_change}M` : "—"}</dd></div>
                <div><dt>Propiedad</dt><dd>{player.fantasyOwnership}%</dd></div>
                {marketRow && marketRow.pick_rate > 0 && (
                  <div><dt>Pick rate FF</dt><dd>{marketRow.pick_rate}%</dd></div>
                )}
                <div><dt>Rol fantasy</dt><dd>{role}</dd></div>
              </dl>
              <Link href={`/fantasy?tournament=${DEFAULT_FANTASY_TOURNAMENT}`} className="bp-btn bp-btn-gold" style={{ marginTop: 16 }}>
                Añadir a mi plantilla
              </Link>
            </div>
          </div>
        </section>
      )}

      {tab === "team" && (
        <section className="bf-team-section bf-detail-panel">
          {team ? (
            <>
              <div className="bf-home-block-head">
                <h2 className="bf-home-block-title">Compañeros en {team.tag}</h2>
                <Link href={`/teams/${team.slug}`} className="bf-home-link">
                  Ver equipo completo
                </Link>
              </div>
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
