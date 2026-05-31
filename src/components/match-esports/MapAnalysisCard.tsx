"use client";

import { Trophy, TrendingUp, Users, Ban } from "lucide-react";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import type { MapCatalogEntry } from "@/lib/data/game-assets-catalog";
import type { MatchMeta } from "@/lib/data/match-meta";
import { chunkBrawlerDisplay } from "@/lib/data/brawler-grid-layout";

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

function BrawlerStatSection({
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
  if (!names.length) return null;
  const rows = chunkBrawlerDisplay(names);
  return (
    <section className={`bf-map-analysis-brawler-block is-${accent}`}>
      <h4 className="bf-map-analysis-block-title">
        <Icon size={14} aria-hidden />
        {title}
      </h4>
      {rows.map((row, ri) => (
        <div key={`${title}-${ri}`} className={`bf-map-meta-row is-cols-${row.length}`}>
          {row.map((n) => (
            <div key={`${title}-${n}`} className="bf-map-top-brawler">
              <BrawlerAssetIcon name={n} size={52} hideName meta={meta} variant="meta" />
              <span className="bf-map-top-brawler-name">{n}</span>
              {rateForBrawler(map, n) && (
                <span className="bf-map-top-brawler-rate">{rateForBrawler(map, n)}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

/** Mapa a tamaño completo + brawlers del catálogo/API debajo. */
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
  const winnersFromRates =
    map.win_rates
      ?.slice()
      .sort((a, b) => (parseFloat(b.rate) || 0) - (parseFloat(a.rate) || 0))
      .map((w) => w.brawler) ?? [];

  return (
    <article className="bf-map-analysis-card is-large">
      <header className="bf-map-analysis-card-head">
        <span className="bf-map-lane-number">Mapa {mapIndex + 1}</span>
        {decisive && <span className="bf-map-series-decisive-badge">Decisivo</span>}
        {map.mode && <span className="bf-map-meta-mode-pill">{map.mode}</span>}
      </header>

      <MapAssetCard
        name={map.name}
        variant="order"
        index={mapIndex}
        meta={meta}
        size="xl"
        imageFit="contain"
      />

      {map.description && <p className="bf-map-analysis-desc">{map.description}</p>}

      {top3.length > 0 && (
        <section className="bf-map-analysis-top3-block">
          <h4 className="bf-map-analysis-block-title">
            <TrendingUp size={14} aria-hidden />
            Top win rate
          </h4>
          <div className="bf-map-analysis-top3-row">
            {top3.map(({ name, rate }) => (
              <div key={name} className="bf-map-top-brawler is-hero">
                <BrawlerAssetIcon name={name} size={64} hideName meta={meta} variant="meta" />
                <span className="bf-map-top-brawler-name">{name}</span>
                {rate && <span className="bf-map-top-brawler-rate">{rate}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bf-map-analysis-brawler-sections">
        <BrawlerStatSection
          title="Mejores picks"
          icon={Trophy}
          names={map.best_picks ?? []}
          map={map}
          meta={meta}
          accent="gold"
        />
        <BrawlerStatSection
          title="Ganadores (WR)"
          icon={TrendingUp}
          names={winnersFromRates.length ? winnersFromRates : (map.best_picks ?? [])}
          map={map}
          meta={meta}
          accent="green"
        />
        <BrawlerStatSection
          title="Más usados"
          icon={Users}
          names={map.most_used ?? []}
          map={map}
          meta={meta}
          accent="blue"
        />
        <BrawlerStatSection
          title="Más bloqueados"
          icon={Ban}
          names={map.most_banned ?? []}
          map={map}
          meta={meta}
          accent="red"
        />
      </div>
    </article>
  );
}
