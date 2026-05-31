import type { MatchMeta } from "./match-meta";
import {
  resolveMapCatalogEntry,
  resolveBrawlerCatalogEntry,
  type MapCatalogEntry,
  type BrawlerCatalogEntry,
  type MapStrategicOverride,
} from "./game-assets-catalog";

export function getMapOverride(meta: MatchMeta | undefined, mapName: string): MapStrategicOverride | undefined {
  const key = mapName.trim().toLowerCase();
  return meta?.maps?.map_overrides?.[key];
}

/** Biblioteca global + personalización opcional del partido (override gana si está definido). */
export function resolveMapForMatch(
  mapName: string,
  meta: MatchMeta | undefined,
  catalog?: MapCatalogEntry[],
): MapCatalogEntry {
  const base = resolveMapCatalogEntry(mapName, catalog);
  const ov = getMapOverride(meta, mapName);
  if (!ov) return base;
  return {
    ...base,
    description: ov.description ?? base.description,
    best_picks: ov.best_picks?.length ? ov.best_picks : base.best_picks,
    most_used: ov.most_used?.length ? ov.most_used : base.most_used,
    most_banned: ov.most_banned?.length ? ov.most_banned : base.most_banned,
    win_rates: ov.win_rates?.length ? ov.win_rates : base.win_rates,
    notes: ov.notes ?? base.notes,
    stats_extra: ov.stats_extra ?? base.stats_extra,
    mode: ov.mode ?? base.mode,
    imageUrl: ov.imageUrl?.trim() || base.imageUrl,
  };
}

export function resolveBrawlerForMatch(
  brawlerName: string,
  meta: MatchMeta | undefined,
  catalog?: BrawlerCatalogEntry[],
): BrawlerCatalogEntry {
  const base = resolveBrawlerCatalogEntry(brawlerName, catalog);
  const key = brawlerName.trim().toLowerCase();
  const ov = meta?.brawlers?.overrides?.[key];
  if (!ov) return base;
  return {
    ...base,
    rarity: ov.rarity ?? base.rarity,
    class: ov.class ?? base.class,
    description: ov.description ?? base.description,
    notes: ov.notes ?? base.notes,
    imageUrl: ov.imageUrl?.trim() || base.imageUrl,
  };
}
