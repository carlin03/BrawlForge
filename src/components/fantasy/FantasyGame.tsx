"use client";

import { useState, useEffect } from "react";
import { Crown, Plus, Star } from "lucide-react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { getPlayer, getTeam } from "@/lib/data";
import type { FantasySquadSlot, MarketPlayer } from "@/lib/data/fantasy";
import { getPlayerPrice, getTrendingLabel } from "@/lib/data/fantasy";

/* ─── Gameweek countdown ─── */
export function GameweekCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Deadline passed");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <div className="bf-countdown">
      <span className="bf-pulse" />
      {remaining}
    </div>
  );
}

/* ─── Budget bar ─── */
export function BudgetBar({ spent, total }: { spent: number; total: number }) {
  const remaining = total - spent;
  const pct = (spent / total) * 100;

  return (
    <div className="budget-bar">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Budget</div>
          <div className="font-display text-xl font-bold">
            <span className="text-accent-yellow">{remaining.toFixed(1)}M</span>
            <span className="text-text-muted text-base"> left</span>
          </div>
        </div>
        <div className="text-right text-[11px] text-text-muted">
          {spent.toFixed(1)}M / {total}M spent
        </div>
      </div>
      <div className="budget-track">
        <div
          className="budget-fill"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Large player card (lineup / market) ─── */
interface PlayerCardProps {
  playerSlug?: string;
  isCaptain?: boolean;
  gameweekPoints?: number;
  price?: number;
  priceChange?: number;
  trending?: MarketPlayer["trending"];
  ownership?: number;
  form?: readonly ("W" | "L")[];
  variant?: "lineup" | "market" | "pick";
  selected?: boolean;
  onSelect?: () => void;
  empty?: boolean;
}

export function PlayerCard({
  playerSlug,
  isCaptain,
  gameweekPoints,
  price,
  priceChange,
  trending,
  ownership,
  form,
  variant = "lineup",
  selected,
  onSelect,
  empty,
}: PlayerCardProps) {
  if (empty) {
    return (
      <Link
        href="/fantasy/transfers"
        className="player-card player-card-empty group"
      >
        <div className="player-card-inner flex flex-col items-center justify-center gap-2 py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-accent-blue/40 bg-accent-blue/5 transition-colors group-hover:border-accent-blue group-hover:bg-accent-blue/10">
            <Plus className="h-6 w-6 text-accent-blue" />
          </div>
          <span className="text-sm font-semibold text-accent-blue">Add player</span>
          <span className="text-[11px] text-text-muted">Go to market</span>
        </div>
      </Link>
    );
  }

  const player = playerSlug ? getPlayer(playerSlug) : null;
  if (!player) return null;
  const team = getTeam(player.teamSlug);
  const displayPrice = price ?? getPlayerPrice(playerSlug!);
  const trendLabel = getTrendingLabel(trending);

  const cardClass = `player-card group text-left w-full ${isCaptain ? "player-card-captain" : ""} ${selected ? "player-card-selected" : ""}`;
  const inner = (
    <>
      {isCaptain && (
        <div className="captain-badge">
          <Crown className="h-3.5 w-3.5" />
          Captain · 2×
        </div>
      )}
      {trendLabel && variant === "market" && (
        <div className="trend-badge">{trendLabel}</div>
      )}

      <div className="player-card-inner">
        <div className="flex items-start justify-between gap-2">
          {team && <TeamLogo slug={team.slug} name={team.name} size="lg" />}
          {team && <CountryFlag country={team.country} size={20} />}
        </div>

        <div className="mt-4">
          <div className="font-display text-xl font-bold leading-tight group-hover:text-accent-blue">
            {player.ign}
          </div>
          <div className="mt-0.5 text-[12px] text-text-muted">{team?.name}</div>
        </div>

        {form && (
          <div className="mt-3 flex gap-1">
            {form.map((f, i) => (
              <span key={i} className={`form-pill form-${f.toLowerCase()}`}>{f}</span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between border-t border-border-subtle/80 pt-3">
          {variant === "lineup" && gameweekPoints !== undefined && (
            <>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">GW pts</div>
                <div className="font-display text-2xl font-bold text-accent-blue">{gameweekPoints}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Season</div>
                <div className="font-display text-lg font-bold text-accent-yellow">{player.fantasyPoints}</div>
              </div>
            </>
          )}
          {variant === "market" && (
            <>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Price</div>
                <div className="font-display text-xl font-bold text-accent-yellow">{displayPrice.toFixed(1)}M</div>
              </div>
              <div className="text-right">
                {priceChange !== undefined && (
                  <div className={`text-sm font-bold ${priceChange >= 0 ? "text-accent-success" : "text-accent-red"}`}>
                    {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}M
                  </div>
                )}
                {ownership !== undefined && (
                  <div className="text-[11px] text-text-muted">{ownership}% owned</div>
                )}
              </div>
            </>
          )}
          {variant === "pick" && (
            <div className="flex w-full items-center justify-between">
              <div className="font-display text-lg font-bold text-accent-yellow">{displayPrice.toFixed(1)}M</div>
              <Star className="h-4 w-4 text-accent-yellow/60" />
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (variant === "market" && onSelect) {
    return (
      <button type="button" onClick={onSelect} className={cardClass}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/players/${player.slug}`} className={cardClass}>
      {inner}
    </Link>
  );
}

/* ─── 3-player lineup pitch ─── */
export function LineupPitch({ squad }: { squad: FantasySquadSlot[] }) {
  const slots = [...squad];
  while (slots.length < 3) {
    slots.push({ playerSlug: "", isCaptain: false, eventPoints: 0 });
  }

  return (
    <div className="lineup-pitch">
      <div className="lineup-pitch-grid">
        {slots.map((slot, i) =>
          slot.playerSlug ? (
            <PlayerCard
              key={slot.playerSlug}
              playerSlug={slot.playerSlug}
              isCaptain={slot.isCaptain}
              gameweekPoints={slot.eventPoints}
              variant="lineup"
            />
          ) : (
            <PlayerCard key={`empty-${i}`} playerSlug="" empty variant="lineup" />
          )
        )}
      </div>
      <div className="lineup-pitch-label">Your Brawl Squad · 3 players</div>
    </div>
  );
}

/* ─── League chip (not table row) ─── */
export function LeagueChip({
  league,
}: {
  league: import("@/lib/data/fantasy").FantasyLeague;
}) {
  const accent =
    league.type === "global"
      ? "league-chip-yellow"
      : league.type === "social"
        ? "league-chip-blue"
        : league.type === "pro"
          ? "league-chip-red"
          : "league-chip-neutral";

  return (
    <Link href="/fantasy/leagues" className={`league-chip ${accent}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-base font-bold">{league.name}</div>
          <div className="mt-0.5 text-[11px] opacity-80">
            {league.members.toLocaleString()} managers
          </div>
        </div>
        <div className="rounded-lg bg-black/20 px-2.5 py-1 text-center">
          <div className="text-[9px] font-bold uppercase opacity-70">Rank</div>
          <div className="font-display text-lg font-bold">#{league.yourRank.toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-sm font-semibold">{league.yourPoints} pts</span>
        <span className="text-[11px] opacity-70">Leader: {league.leaderName}</span>
      </div>
    </Link>
  );
}

/* ─── Market grid ─── */
export function MarketGrid({ players }: { players: MarketPlayer[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {players.map((p) => {
        const player = getPlayer(p.playerSlug);
        if (!player) return null;
        return (
          <PlayerCard
            key={p.playerSlug}
            playerSlug={p.playerSlug}
            price={p.price}
            priceChange={p.priceChange}
            trending={p.trending}
            ownership={player.fantasyOwnership}
            form={p.form}
            variant="market"
          />
        );
      })}
    </div>
  );
}

/* ─── Podium for rankings ─── */
export function FantasyPodium({
  entries,
}: {
  entries: import("@/lib/data/fantasy").FantasyLeaderboardEntry[];
}) {
  const top3 = entries.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="fantasy-podium">
      {order.map((entry, i) => {
        const place = entry.rank;
        const heights = ["h-24", "h-32", "h-20"];
        const heightClass = heights[i] ?? "h-20";
        return (
          <div key={entry.rank} className="flex flex-col items-center">
            <div
              className="mb-2 flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold text-white"
              style={{ backgroundColor: entry.avatarColor }}
            >
              {entry.username.charAt(0)}
            </div>
            <div className="mb-1 max-w-[100px] truncate text-center text-sm font-semibold">{entry.username}</div>
            <div className="font-display text-lg font-bold text-accent-yellow">{entry.points}</div>
            <div className={`mt-2 w-full max-w-[120px] rounded-t-lg bg-bg-elevated ${heightClass} flex items-end justify-center pb-2`}>
              <span className="font-display text-2xl font-bold text-text-muted">#{place}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
