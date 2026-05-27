"use client";

import Link from "next/link";
import { PlayerCard } from "@/components/platform/PlayerCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  getPlayer,
  getPlayersByTeam,
  getPlayerTeam,
} from "@/lib/data";
import { getPlayerPrice, transferMarket } from "@/lib/data/fantasy";
import { getFantasyRole, getPickRate } from "@/lib/data/fantasy-meta";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

export function PlayerDetailView({ slug }: { slug: string }) {
  const player = getPlayer(slug);
  if (!player) {
    return (
      <div className="bf-home-empty" style={{ padding: 32 }}>
        <p>Jugador no encontrado.</p>
        <Link href="/players">Ver jugadores</Link>
      </div>
    );
  }

  const team = getPlayerTeam(slug);
  const role = getFantasyRole(slug);
  const price = getPlayerPrice(slug);
  const market = transferMarket.find((m) => m.playerSlug === slug);
  const form = market?.form ?? [];
  const formWins = form.filter((f) => f === "W").length;

  const teammates = team
    ? getPlayersByTeam(team.slug)
        .filter((p) => p.slug !== slug && p.status === "active")
        .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    : [];

  return (
    <div className="bf-player-page bf-team-page">
      <section className="bf-player-hero">
        <div className="bf-player-hero-glow" aria-hidden />
        <div className="bf-player-hero-card">
          <PlayerCard
            playerSlug={slug}
            size="hero"
            price={price}
            pickRate={SHOW_DEMO_SOCIAL ? getPickRate(slug) : undefined}
            animate
          />
        </div>
        <div className="bf-team-hero-body">
          <div className="bf-team-hero-badges">
            <span className="bp-chip bp-chip-gold">{role}</span>
            <RegionBadge region={player.region} />
            {team && <CountryFlag country={team.country} size={20} />}
            <span className={`bp-chip ${player.status === "active" ? "bp-chip-blue" : "bp-chip-red"}`}>
              {player.status === "active" ? "Activo" : player.status}
            </span>
          </div>
          <h1 className="bf-team-hero-name">{player.ign}</h1>
          {player.realName && <p className="bf-team-hero-tag">{player.realName}</p>}
          {team ? (
            <Link href={`/teams/${team.slug}`} className="bf-player-club-link">
              <TeamLogo slug={team.slug} name={team.name} size={32} />
              <span>
                {team.tag} · {team.name}
              </span>
            </Link>
          ) : (
            <p className="bf-team-hero-tag">Agente libre</p>
          )}
          <div className="bf-team-hero-actions">
            <Link href="/fantasy" className="bp-btn bp-btn-gold">
              Montar plantilla
            </Link>
            <Link href="/players" className="bp-btn bp-btn-ghost">
              Catálogo
            </Link>
            {player.liquipediaUrl && (
              <a href={player.liquipediaUrl} target="_blank" rel="noopener noreferrer" className="bp-btn bp-btn-ghost">
                Liquipedia
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="bf-team-stats-bar">
        <div className="bf-team-stat">
          <strong>{player.rating.toFixed(2)}</strong>
          <span>Rating</span>
        </div>
        <div className="bf-team-stat">
          <strong>{player.fantasyPoints}</strong>
          <span>OVR fantasy</span>
        </div>
        <div className="bf-team-stat">
          <strong>{price.toFixed(1)}M</strong>
          <span>Valor mercado</span>
        </div>
        <div className="bf-team-stat">
          <strong>{player.fantasyOwnership}%</strong>
          <span>Propiedad</span>
        </div>
        {SHOW_DEMO_SOCIAL && (
          <div className="bf-team-stat">
            <strong>{getPickRate(slug)}%</strong>
            <span>Pick rate</span>
          </div>
        )}
        {form.length > 0 && (
          <div className="bf-team-stat">
            <strong>
              {formWins}/{form.length}
            </strong>
            <span>Forma W</span>
          </div>
        )}
        {player.joinDate && (
          <div className="bf-team-stat">
            <strong>{player.joinDate}</strong>
            <span>En el club</span>
          </div>
        )}
      </div>

      {form.length > 0 && (
        <section className="bf-team-section">
          <h2 className="bf-home-block-title">Forma reciente</h2>
          <div className="bf-player-form">
            {form.map((r, i) => (
              <span key={i} className={`bf-player-form-dot ${r === "W" ? "is-win" : "is-loss"}`} title={r} />
            ))}
          </div>
        </section>
      )}

      {teammates.length > 0 && team && (
        <section className="bf-team-section">
          <div className="bf-home-block-head">
            <h2 className="bf-home-block-title">Compañeros en {team.tag}</h2>
            <Link href={`/teams/${team.slug}`} className="bf-home-link">
              Ver equipo
            </Link>
          </div>
          <div className="bf-team-roster-cards">
            {teammates.map((p) => (
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
      )}
    </div>
  );
}
