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

function BrawlerMetaChip({
  name,
  map,
  meta,
  accent,
  compact,
}: {
  name: string;
  map: MapCatalogEntry;
  meta?: MatchMeta;
  accent?: "gold" | "green" | "blue" | "red";
  compact?: boolean;
}) {
  const rate = rateForBrawler(map, name);
  const size = compact ? 44 : 52;
  return (
    <div className={`bf-brawler-meta-chip is-${accent ?? "gold"}`}>
      <BrawlerAssetIcon name={name} size={size} hideName meta={meta} variant="meta" />
      <span className="bf-brawler-meta-chip-name">{name}</span>
      {rate && <span className="bf-brawler-meta-chip-rate">{rate}</span>}
    </div>
  );
}

function BrawlerCategoryBlock({
  title,
  hint,
  names,
  map,
  meta,
  accent,
  icon: Icon,
  compact,
}: {
  title: string;
  hint: string;
  names: string[];
  map: MapCatalogEntry;
  meta?: MatchMeta;
  accent: "gold" | "green" | "blue" | "red";
  icon: typeof Trophy;
  compact?: boolean;
}) {
  const rows = names.length ? chunkBrawlerDisplay(names) : [];
  return (
    <div className={`bf-map-meta-category is-${accent}`}>
      <header className="bf-map-meta-category-head">
        <Icon size={16} aria-hidden />
        <div>
          <strong>{title}</strong>
          <span>{hint}</span>
        </div>
      </header>
      <div className="bf-map-meta-category-body">
        {rows.length > 0 ? (
          rows.map((row, ri) => (
            <div
              key={`${title}-row-${ri}`}
              className={`bf-map-meta-row is-cols-${row.length}`}
            >
              {row.map((n) => (
                <BrawlerMetaChip
                  key={`${title}-${n}`}
                  name={n}
                  map={map}
                  meta={meta}
                  accent={accent}
                  compact={compact}
                />
              ))}
            </div>
          ))
        ) : (
          <p className="bf-map-meta-empty-inline">
            Sin datos — edita este mapa en Biblioteca global
          </p>
        )}
      </div>
    </div>
  );
}

/** Meta del mapa: categorías en rejilla 3+2 / 2+2+2 (no fila infinita 1,1,1…). */
export function MapStrategicAnalysis({
  map,
  meta,
  compact,
}: {
  map: MapCatalogEntry;
  meta?: MatchMeta;
  compact?: boolean;
}) {
  const winnersFromRates =
    map.win_rates
      ?.slice()
      .sort((a, b) => {
        const pa = parseFloat(a.rate.replace("%", "")) || 0;
        const pb = parseFloat(b.rate.replace("%", "")) || 0;
        return pb - pa;
      })
      .map((w) => w.brawler) ?? [];

  const winnerNames = winnersFromRates.length
    ? winnersFromRates
    : (map.best_picks ?? []).slice(0, 5);

  return (
    <div className={`bf-map-strategic-analysis ${compact ? "is-compact" : ""}`}>
      <header className="bf-map-meta-section-title">
        <span>Análisis del mapa</span>
        {map.fromLibrary && <em>Biblioteca global</em>}
      </header>

      <div className="bf-map-meta-intro">
        {map.mode && <span className="bf-map-meta-mode-pill">{map.mode}</span>}
        {map.description ? (
          <p>{map.description}</p>
        ) : (
          <p className="bf-map-meta-empty-inline">
            Añade descripción y brawlers en Admin → Biblioteca → Mapas.
          </p>
        )}
      </div>

      <div className="bf-map-meta-categories">
        <BrawlerCategoryBlock
          title="Mejores picks"
          hint="Top en este mapa"
          names={map.best_picks ?? []}
          map={map}
          meta={meta}
          accent="gold"
          icon={Trophy}
          compact={compact}
        />
        <BrawlerCategoryBlock
          title="Ganadores"
          hint="Win rate"
          names={winnerNames}
          map={map}
          meta={meta}
          accent="green"
          icon={TrendingUp}
          compact={compact}
        />
        <BrawlerCategoryBlock
          title="Más usados"
          hint="Popularidad"
          names={map.most_used ?? []}
          map={map}
          meta={meta}
          accent="blue"
          icon={Users}
          compact={compact}
        />
        <BrawlerCategoryBlock
          title="Más baneados"
          hint="Bans frecuentes"
          names={map.most_banned ?? []}
          map={map}
          meta={meta}
          accent="red"
          icon={Ban}
          compact={compact}
        />
      </div>

      {map.stats_extra && <p className="bf-map-strategic-stats">{map.stats_extra}</p>}
      {map.notes && <p className="bf-map-strategic-notes">{map.notes}</p>}
    </div>
  );
}
