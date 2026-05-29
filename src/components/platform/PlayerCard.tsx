"use client";

import Link from "next/link";
import { PlayerPhoto } from "@/components/ui/PlayerPhoto";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TeamCardWatermark } from "@/components/ui/TeamCardWatermark";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { getTeam, teamName, getFantasyRole } from "@/lib/data";
import { getTeamCardTheme, teamCardThemeVars } from "@/lib/data/team-card-theme";
import { useResolvedPlayer, useResolvedTeam } from "@/hooks/useResolvedEntity";
import { PriceDelta } from "@/components/platform/ui";

export type CardTier = "legend" | "epic" | "rare" | "common";

export function getCardTier(rating: number, fantasyPoints: number): CardTier {
  if (rating >= 1.2 || fantasyPoints >= 85) return "legend";
  if (rating >= 1.12 || fantasyPoints >= 75) return "epic";
  if (rating >= 1.05 || fantasyPoints >= 65) return "rare";
  return "common";
}

const PHOTO_BY_SIZE = { hero: 96, xl: 80, lg: 64, md: 56, sm: 44 } as const;
/** Logo del club de fondo (watermark) — mucho más grande que la foto del jugador */
const WATERMARK_BY_SIZE = { hero: 340, xl: 300, lg: 260, md: 240, sm: 200 } as const;

export function PlayerCard({
  playerSlug,
  clubSlug,
  size = "md",
  price,
  priceChange,
  pickRate,
  isCaptain,
  featured,
  href,
  onAction,
  actionLabel,
  actionDisabled,
  animate = true,
  showExtended = false,
}: {
  playerSlug: string;
  /** Club del bloque del mercado (torneo); si no coincide con teamSlug del jugador, muestra el logo correcto del evento */
  clubSlug?: string;
  size?: "hero" | "xl" | "lg" | "md" | "sm";
  price?: number;
  priceChange?: number;
  pickRate?: number;
  isCaptain?: boolean;
  featured?: string;
  href?: string;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  animate?: boolean;
  showExtended?: boolean;
}) {
  const p = useResolvedPlayer(playerSlug);
  const displayClub = clubSlug ?? p?.teamSlug;
  const resolvedClub = useResolvedTeam(displayClub ?? "");
  if (!p || !displayClub) return null;

  const club = getTeam(displayClub);
  const theme = getTeamCardTheme(
    displayClub,
    club?.region ?? p.region,
    resolvedClub?.meta as Record<string, unknown> | undefined,
  );
  const tier = getCardTier(p.rating, p.fantasyPoints);
  const role = getFantasyRole(playerSlug).toUpperCase();
  const ovr = p.fantasyPoints;
  const ownership = pickRate ?? p.fantasyOwnership;
  const trend = priceChange ?? 0;
  const photoSize = PHOTO_BY_SIZE[size];
  const statusLabel =
    p.status === "active" ? "Activo" : p.status === "inactive" ? "Inactivo" : "Retirado";

  const inner = (
    <>
      <div className="bf-card-team-bg" aria-hidden>
        <div className="bf-card-team-glow" />
        <div className={`bf-card-team-watermark bf-card-team-watermark--${size}`}>
          <TeamCardWatermark slug={displayClub} name={club?.name ?? teamName(displayClub)} />
        </div>
      </div>
      <div className="bf-card-shine" aria-hidden />
      <div className="bf-card-fut-head">
        <span className="bf-card-ovr">{ovr}</span>
        <div className="bf-card-fut-badges">
          {featured && <span className="bf-card-featured">{featured}</span>}
          {isCaptain && <span className="bf-card-cap-mult">CAP · 2×</span>}
          <span className="bf-card-role-pill">{role}</span>
        </div>
      </div>

      <div className="bf-card-logo-stage">
        <PlayerPhoto
          playerSlug={playerSlug}
          teamSlug={displayClub}
          name={p.ign}
          size={photoSize}
          key={`${playerSlug}-${p.photoUrl ?? ""}`}
        />
      </div>

      <div className="bf-card-identity">
        <div className="bf-card-name">{p.ign}</div>
        <div className="bf-card-team">{club?.name ?? teamName(displayClub)}</div>
        {club?.country && (
          <div className="bf-card-country-row">
            <CountryFlag country={club.country} size={18} className="bf-card-country-flag" />
          </div>
        )}
        <div className={`bf-card-extra-slot ${showExtended ? "" : "is-empty"}`}>
          {showExtended && (
            <div className="bf-card-extra">
              <span className="bf-card-extra-pill">{role}</span>
              <span className="bf-card-extra-pill">{statusLabel}</span>
              {club?.country && (
                <span className="bf-card-extra-meta bf-card-extra-flag">
                  <CountryFlag country={club.country} size={14} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`bf-card-detail-slot ${showExtended ? "" : "is-empty"}`}>
        {showExtended && (
          <div className="bf-card-detail-row">
            <span title="Rating competitivo">RTG <strong>{p.rating.toFixed(2)}</strong></span>
            <span title="Rol oficial">ROL <strong>{p.role}</strong></span>
            {p.realName ? (
              <span className="bf-card-detail-name" title={p.realName}>
                {p.realName}
              </span>
            ) : (
              <span className="bf-card-detail-name is-placeholder" aria-hidden>
                —
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bf-card-fut-foot">
        <div className="bf-card-fut-stat">
          <strong>{price !== undefined ? `${price}M` : `${p.rating.toFixed(2)}`}</strong>
          <span>{price !== undefined ? "Precio" : "Rating"}</span>
        </div>
        <div className="bf-card-fut-stat">
          <strong>{ownership}%</strong>
          <span>Own</span>
        </div>
        <div className="bf-card-fut-stat">
          <strong>{p.fantasyPoints}</strong>
          <span>Pts</span>
        </div>
      </div>

      <div className="bf-card-trend-slot">
        {trend !== 0 ? (
          <div className="bf-card-trend">
            <PriceDelta change={trend} />
          </div>
        ) : null}
      </div>

      {onAction && (
        <button
          type="button"
          className="bf-card-action"
          disabled={actionDisabled}
          onClick={(e) => {
            e.preventDefault();
            onAction();
          }}
        >
          {actionLabel ?? "+"}
        </button>
      )}
    </>
  );

  const cls = [
    "bf-card",
    "bf-card-fut",
    "bf-card-premium",
    "has-team-theme",
    `bf-card-${tier}`,
    `bf-card-${size}`,
    isCaptain ? "is-captain" : "",
    animate ? "has-motion" : "",
    "bf-shine-hover",
  ]
    .filter(Boolean)
    .join(" ");

  const themeStyle = teamCardThemeVars(theme, size);

  if (onAction) {
    return (
      <div className={cls} style={themeStyle} data-team={displayClub}>
        {inner}
      </div>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls} style={themeStyle} data-team={displayClub}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={cls} style={themeStyle} data-team={displayClub}>
      {inner}
    </div>
  );
}

export function PlayerCardMini({
  playerSlug,
  isCaptain,
  clubSlug,
}: {
  playerSlug: string;
  isCaptain?: boolean;
  clubSlug?: string;
}) {
  const p = useResolvedPlayer(playerSlug);
  const displayClub = clubSlug ?? p?.teamSlug;
  if (!p || !displayClub) return null;
  const tier = getCardTier(p.rating, p.fantasyPoints);
  const club = getTeam(displayClub);
  const theme = getTeamCardTheme(displayClub, club?.region ?? p.region);
  return (
    <Link
      href={`/players/${playerSlug}`}
      className={`bf-card-mini bf-card-premium-mini has-team-theme bf-card-${tier}${isCaptain ? " is-captain" : ""}`}
      style={teamCardThemeVars(theme, "mini")}
      data-team={displayClub}
    >
      <div className="bf-card-team-bg" aria-hidden>
        <div className="bf-card-team-glow" />
        <div className="bf-card-team-watermark is-mini">
          <TeamCardWatermark slug={displayClub} name={club?.name ?? teamName(displayClub)} />
        </div>
      </div>
      <span className="bf-card-mini-ovr">{p.fantasyPoints}</span>
      <TeamLogo slug={displayClub} name={club?.name ?? teamName(displayClub)} size={40} />
      <span className="bf-card-mini-name">{p.ign}</span>
      {isCaptain && <span className="bf-card-captain sm">C</span>}
    </Link>
  );
}
