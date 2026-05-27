"use client";

import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { getPlayer, teamName, getFantasyRole } from "@/lib/data";
import { PriceDelta } from "@/components/platform/ui";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

export type CardTier = "legend" | "epic" | "rare" | "common";

export function getCardTier(rating: number, fantasyPoints: number): CardTier {
  if (rating >= 1.2 || fantasyPoints >= 85) return "legend";
  if (rating >= 1.12 || fantasyPoints >= 75) return "epic";
  if (rating >= 1.05 || fantasyPoints >= 65) return "rare";
  return "common";
}

const LOGO_BY_SIZE = { hero: 96, xl: 80, lg: 64, md: 56, sm: 44 } as const;

export function PlayerCard({
  playerSlug,
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
}: {
  playerSlug: string;
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
}) {
  const p = getPlayer(playerSlug);
  if (!p?.teamSlug) return null;

  const tier = getCardTier(p.rating, p.fantasyPoints);
  const role = getFantasyRole(playerSlug).toUpperCase();
  const ovr = p.fantasyPoints;
  const ownership = pickRate ?? p.fantasyOwnership;
  const pick = SHOW_DEMO_SOCIAL ? ownership : undefined;
  const trend = priceChange ?? 0;
  const logoSize = LOGO_BY_SIZE[size];

  const inner = (
    <>
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
        <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={logoSize} />
      </div>

      <div className="bf-card-identity">
        <div className="bf-card-name">{p.ign}</div>
        <div className="bf-card-team">{teamName(p.teamSlug)}</div>
        <RegionBadge region={p.region} />
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
          <strong>{pick !== undefined ? `${pick}%` : p.fantasyPoints}</strong>
          <span>{pick !== undefined ? "Pick" : "Pts"}</span>
        </div>
      </div>

      {trend !== 0 && (
        <div className="bf-card-trend">
          <PriceDelta change={trend} />
        </div>
      )}

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
    `bf-card-${tier}`,
    `bf-card-${size}`,
    isCaptain ? "is-captain" : "",
    animate ? "has-motion" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (onAction) return <div className={cls}>{inner}</div>;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export function PlayerCardMini({ playerSlug, isCaptain }: { playerSlug: string; isCaptain?: boolean }) {
  const p = getPlayer(playerSlug);
  if (!p?.teamSlug) return null;
  const tier = getCardTier(p.rating, p.fantasyPoints);
  return (
    <Link
      href={`/players/${playerSlug}`}
      className={`bf-card-mini bf-card-premium-mini bf-card-${tier}${isCaptain ? " is-captain" : ""}`}
    >
      <span className="bf-card-mini-ovr">{p.fantasyPoints}</span>
      <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={40} />
      <span className="bf-card-mini-name">{p.ign}</span>
      {isCaptain && <span className="bf-card-captain sm">C</span>}
    </Link>
  );
}
