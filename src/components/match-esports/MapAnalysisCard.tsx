"use client";

import { Trophy, TrendingUp, Users, Ban } from "lucide-react";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import type { MapCatalogEntry } from "@/lib/data/game-assets-catalog";
import type { MatchMeta } from "@/lib/data/match-meta";

function rateForBrawler(map: MapCatalogEntry, name: string): string | undefined {
  return map.win_rates?.find(
    (w) => w.brawler.trim().toLowerCase() === name.trim().toLowerCase(),
  )?.rate;
}

function topBrawlersForMap(map: MapCatalogEntry, limit = 3): { name: string; rate?: string }[] {
  if (map.win_rates?.length) {
    return map.win_rates
      .slice()
      .sort((a, b) => {
        const pa = parseFloat(a.rate.replace("%", "")) || 0;
        const pb = parseFloat(b.rate.replace("%", "")) || 0;
        return pb - pa;
      })
      .slice(0, limit)
      .map((w) => ({ name: w.brawler, rate: w.rate }));
  }
  return (map.best_picks ?? []).slice(0, limit).map((name) => ({
    name,
    rate: rateForBrawler(map, name),
  }));
}

function StatPill({
  label,
  names,
  icon: Icon,
  accent,
}: {
  label: string;
  names: string[];
  icon: typeof Trophy;
  accent: string;
}) {
  if (!names.length) return null;
  return (
    <div className={`bf-map-stat-pill is-${accent}`}>
      <Icon size={12} aria-hidden />
      <span className="bf-map-stat-pill-label">{label}</span>
      <span className="bf-map-stat-pill-names">{names.slice(0, 3).join(" · ")}</span>
    </div>
  );
}

/** Tarjeta compacta estilo Brawlify: mapa grande + top 3 WR + stats en línea. */
export function MapAnalysisCard({
  map,
  meta,
  mapIndex,
  decisive,
}: {
  map: MapCatalogEntry;
  meta?: MatchMeta;
  mapIndex: number;
  decisive?: boolean;
}) {
  const top3 = topBrawlersForMap(map, 3);

  return (
    <article className="bf-map-analysis-card">
      <header className="bf-map-analysis-card-head">
        <span className="bf-map-lane-number">Mapa {mapIndex + 1}</span>
        {decisive && <span className="bf-map-series-decisive-badge">Decisivo</span>}
        {map.mode && <span className="bf-map-meta-mode-pill">{map.mode}</span>}
      </header>

      <div className="bf-map-analysis-card-hero">
        <MapAssetCard name={map.name} variant="order" index={mapIndex} meta={meta} size="lg" />
        <div className="bf-map-analysis-top3">
          {top3.length > 0 ? (
            top3.map(({ name, rate }) => (
              <div key={name} className="bf-map-top-brawler">
                <BrawlerAssetIcon name={name} size={48} hideName meta={meta} variant="meta" />
                <span className="bf-map-top-brawler-name">{name}</span>
                {rate && <span className="bf-map-top-brawler-rate">{rate}</span>}
              </div>
            ))
          ) : (
            <p className="bf-map-meta-empty-inline">—</p>
          )}
        </div>
      </div>

      {map.description && <p className="bf-map-analysis-desc">{map.description}</p>}

      <div className="bf-map-analysis-stat-row">
        <StatPill label="Picks" names={map.best_picks ?? []} icon={Trophy} accent="gold" />
        <StatPill label="Usados" names={map.most_used ?? []} icon={Users} accent="blue" />
        <StatPill label="Baneados" names={map.most_banned ?? []} icon={Ban} accent="red" />
        <StatPill
          label="WR"
          names={
            map.win_rates?.length
              ? map.win_rates
                  .slice()
                  .sort(
                    (a, b) =>
                      (parseFloat(b.rate) || 0) - (parseFloat(a.rate) || 0),
                  )
                  .slice(0, 3)
                  .map((w) => `${w.brawler} ${w.rate}`)
              : []
          }
          icon={TrendingUp}
          accent="green"
        />
      </div>
    </article>
  );
}
