"use client";

import { useMemo } from "react";
import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MapAnalysisCard } from "@/components/match-esports/MapAnalysisCard";
import {
  mapCountFromExactScore,
  resolveMatchMapOrder,
  visibleAnalysisMapSlots,
} from "@/lib/data/series-map-utils";
import { resolveMapForMatch } from "@/lib/data/resolve-match-assets";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

/** Análisis de mapas al final: rejilla 3+2 (BO5) con estadísticas debajo de cada mapa. */
export function MatchMapAnalysisSection({
  match,
  meta,
  ext,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
  ext: MatchExtendedPrediction;
}) {
  const parsed = parseMatchMeta(meta);
  const { maps: mapCatalog } = useGameAssetsCatalog();
  const order = resolveMatchMapOrder(parsed, match.format);
  if (!order.length) return null;

  const mapCount = mapCountFromExactScore(ext.exactScore, match.format);
  const slots = useMemo(
    () =>
      visibleAnalysisMapSlots(
        order,
        ext.exactScore,
        parsed.maps?.decisive,
        match.format,
      ),
    [order, ext.exactScore, parsed.maps?.decisive, match.format],
  );

  const gridClass =
    slots.length === 5
      ? "is-maps-5"
      : slots.length === 4
        ? "is-maps-4"
        : slots.length >= 3
          ? "is-maps-3"
          : "";

  return (
    <section className="bf-match-map-analysis bf-match-esports-panel" id="match-map-analysis">
      <header className="bf-match-section-head">
        <h2 className="bf-match-esports-h2">Análisis de mapas</h2>
        <p className="bf-match-section-lead">
          Estadísticas del catálogo por mapa de tu serie predicha.
        </p>
      </header>

      {!mapCount && (
        <p className="bf-match-predict-hint">
          Elige un marcador exacto en Predicciones para ver el análisis de tus mapas.
        </p>
      )}

      {slots.length > 0 && (
        <div className={`bf-map-analysis-grid ${gridClass}`}>
          {slots.map((slot) => {
            const mapEntry = resolveMapForMatch(slot.name, meta, mapCatalog);
            return (
              <MapAnalysisCard
                key={`${slot.name}-${slot.index}`}
                map={mapEntry}
                meta={meta}
                mapIndex={slot.index}
                decisive={slot.decisive}
                variant="grid"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
