"use client";

import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { MapBrawlerInfoPanel } from "@/components/match-esports/MapBrawlerInfoPanel";
import type { MapCatalogEntry } from "@/lib/data/game-assets-catalog";
import type { MatchMeta } from "@/lib/data/match-meta";

/** Mapa arriba (completo) + panel de brawlers debajo. */
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
  return (
    <article className="bf-map-analysis-card is-stacked">
      <header className="bf-map-analysis-card-head">
        <span className="bf-map-lane-number">Mapa {mapIndex + 1}</span>
        <strong className="bf-map-analysis-map-name">{map.name}</strong>
        {decisive && <span className="bf-map-series-decisive-badge">Decisivo</span>}
        {map.mode && <span className="bf-map-meta-mode-pill">{map.mode}</span>}
      </header>

      <div className="bf-map-analysis-map-wrap">
        <MapAssetCard
          name={map.name}
          variant="order"
          index={mapIndex}
          meta={meta}
          size="xl"
          imageFit="contain"
        />
      </div>

      {map.description && <p className="bf-map-analysis-desc">{map.description}</p>}

      <MapBrawlerInfoPanel map={map} meta={meta} />
    </article>
  );
}
