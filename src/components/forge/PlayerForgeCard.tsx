import Link from "next/link";
import { Plus } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { getPlayer, getTeam } from "@/lib/data";
import { getPlayerPrice, getTrendingLabel, getTrendingClass, type MarketPlayer } from "@/lib/data/fantasy";

function rarityClass(rating: number, isCaptain?: boolean): string {
  if (isCaptain) return "forge-card-captain";
  if (rating >= 90) return "forge-card-gold";
  if (rating >= 85) return "forge-card-elite";
  return "forge-card-pro";
}

export interface PlayerForgeCardProps {
  playerSlug: string;
  isCaptain?: boolean;
  gameweekPoints?: number;
  href?: string;
  variant?: "squad" | "market";
  price?: number;
  priceChange?: number;
  trending?: MarketPlayer["trending"];
  form?: readonly ("W" | "L")[];
}

export function PlayerForgeCard({
  playerSlug,
  isCaptain,
  gameweekPoints,
  href = `/players/${playerSlug}`,
  variant = "squad",
  price,
  priceChange,
  trending,
  form,
}: PlayerForgeCardProps) {
  const player = getPlayer(playerSlug);
  if (!player) return null;
  const team = getTeam(player.teamSlug);
  const displayPrice = price ?? getPlayerPrice(playerSlug);
  const trendLabel = getTrendingLabel(trending);
  const ovr = variant === "market" ? Math.round(player.rating * 10) : (gameweekPoints ?? player.fantasyPoints);

  return (
    <Link
      href={href}
      className={`forge-card ${rarityClass(player.rating, isCaptain)}`}
    >
      <div className="forge-card-shine" />
      <div className="forge-card-frame">
        {isCaptain && <div className="forge-captain-ribbon">CAPITÁN · 2×</div>}
        <div className="forge-card-header">
          <div>
            <div className="forge-card-ovr">{ovr}</div>
            <div className="forge-card-ovr-label">{variant === "market" ? "OVR" : "PTS"}</div>
          </div>
          {trendLabel && variant === "market" ? (
            <span className={`bf-trend-badge ${getTrendingClass(trending)}`}>{trendLabel}</span>
          ) : (
            team && <CountryFlag country={team.country} size={24} />
          )}
        </div>
        <div className="forge-card-art">
          <div className="forge-card-art-glow" />
          {team && <TeamLogo slug={team.slug} name={team.name} size={96} />}
        </div>
        <div className="forge-card-name">{player.ign}</div>
        <div className="forge-card-club">{team?.name}</div>
        {form && (
          <div className="forge-card-form">
            {form.map((f, i) => (
              <span key={i} className={`bf-form-pill bf-form-${f.toLowerCase()}`}>{f}</span>
            ))}
          </div>
        )}
        <div className="forge-card-stats">
          {variant === "market" ? (
            <>
              <div className="forge-card-stat">
                <div className="forge-card-stat-val" style={{ color: "var(--bf-yellow)" }}>
                  {displayPrice.toFixed(1)}M
                </div>
                <div className="forge-card-stat-lbl">Precio</div>
              </div>
              <div className="forge-card-stat">
                <div
                  className="forge-card-stat-val"
                  style={{ color: (priceChange ?? 0) >= 0 ? "var(--bf-blue)" : "var(--bf-red)" }}
                >
                  {(priceChange ?? 0) >= 0 ? "+" : ""}{(priceChange ?? 0).toFixed(1)}
                </div>
                <div className="forge-card-stat-lbl">Cambio</div>
              </div>
              <div className="forge-card-stat">
                <div className="forge-card-stat-val" style={{ color: "var(--bf-blue)" }}>
                  {player.fantasyOwnership}%
                </div>
                <div className="forge-card-stat-lbl">Owned</div>
              </div>
            </>
          ) : (
            <>
              <div className="forge-card-stat">
                <div className="forge-card-stat-val" style={{ color: "var(--bf-yellow)" }}>
                  {displayPrice.toFixed(1)}M
                </div>
                <div className="forge-card-stat-lbl">Valor</div>
              </div>
              <div className="forge-card-stat">
                <div className="forge-card-stat-val" style={{ color: "var(--bf-blue)" }}>
                  {player.fantasyOwnership}%
                </div>
                <div className="forge-card-stat-lbl">Owned</div>
              </div>
              <div className="forge-card-stat">
                <div className="forge-card-stat-val">{player.rating.toFixed(1)}</div>
                <div className="forge-card-stat-lbl">Rating</div>
              </div>
            </>
          )}
        </div>
        {variant === "market" && (
          <div className="forge-card-action">
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Fichar
          </div>
        )}
      </div>
    </Link>
  );
}
