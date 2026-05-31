"use client";

import { Trophy, TrendingUp, Users, Ban } from "lucide-react";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import type { MapCatalogEntry } from "@/lib/data/game-assets-catalog";
import type { MatchMeta } from "@/lib/data/match-meta";
import { chunkBrawlerDisplay } from "@/lib/data/brawler-grid-layout";

function rateForBrawler(map: MapCatalogEntry, name: string): string | undefined {
  return map.win_rates?.find(
    (w) => w.brawler.trim().toLowerCase() === name.trim().toLowerCase(),
  )?.rate;
}

function CategoryGrid({
  title,
  icon: Icon,
  names,
  map,
  meta,
  accent,
}: {
  title: string;
  icon: typeof Trophy;
  names: string[];
  map: MapCatalogEntry;
  meta?: MatchMeta;
  accent: string;
}) {
  const rows = names.length ? chunkBrawlerDisplay(names) : [];
  return (
    <div className={`bf-map-brawler-cat is-${accent}`}>
      <h5 className="bf-map-brawler-cat-title">
        <Icon size={14} aria-hidden />
        {title}
      </h5>
      {rows.length > 0 ? (
        rows.map((row, ri) => (
          <div key={ri} className={`bf-map-meta-row is-cols-${row.length}`}>
            {row.map((n) => (
              <div key={n} className="bf-map-brawler-chip">
                <BrawlerAssetIcon name={n} size={48} hideName meta={meta} variant="meta" />
                <span className="bf-map-brawler-chip-name">{n}</span>
                {rateForBrawler(map, n) && (
                  <span className="bf-map-brawler-chip-rate">{rateForBrawler(map, n)}</span>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <span className="bf-map-brawler-cat-empty">—</span>
      )}
    </div>
  );
}

/** Info de brawlers debajo del mapa (catálogo / API). */
export function MapBrawlerInfoPanel({
  map,
  meta,
}: {
  map: MapCatalogEntry;
  meta?: MatchMeta;
}) {
  const topWr =
    map.win_rates
      ?.slice()
      .sort((a, b) => (parseFloat(b.rate) || 0) - (parseFloat(a.rate) || 0))
      .slice(0, 3) ?? [];

  const winnerNames =
    topWr.length > 0
      ? topWr.map((w) => w.brawler)
      : (map.best_picks ?? []).slice(0, 5);

  return (
    <div className="bf-map-brawler-info-panel">
      <h4 className="bf-map-brawler-info-title">Brawlers en este mapa</h4>

      {topWr.length > 0 && (
        <div className="bf-map-brawler-info-topwr">
          <span className="bf-map-brawler-info-label">
            <TrendingUp size={12} aria-hidden />
            Top win rate
          </span>
          <div className="bf-map-brawler-info-topwr-row">
            {topWr.map((w) => (
              <div key={w.brawler} className="bf-map-brawler-chip is-highlight">
                <BrawlerAssetIcon name={w.brawler} size={56} hideName meta={meta} variant="meta" />
                <span className="bf-map-brawler-chip-name">{w.brawler}</span>
                <span className="bf-map-brawler-chip-rate">{w.rate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bf-map-brawler-info-grid">
        <CategoryGrid
          title="Mejores picks"
          icon={Trophy}
          names={map.best_picks ?? []}
          map={map}
          meta={meta}
          accent="gold"
        />
        <CategoryGrid
          title="Ganadores"
          icon={TrendingUp}
          names={winnerNames}
          map={map}
          meta={meta}
          accent="green"
        />
        <CategoryGrid
          title="Más usados"
          icon={Users}
          names={map.most_used ?? []}
          map={map}
          meta={meta}
          accent="blue"
        />
        <CategoryGrid
          title="Más bloqueados"
          icon={Ban}
          names={map.most_banned ?? []}
          map={map}
          meta={meta}
          accent="red"
        />
      </div>
    </div>
  );
}
