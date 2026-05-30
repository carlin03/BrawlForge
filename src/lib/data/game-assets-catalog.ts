import {
  BS_BRAWLER_CATALOG,
  BS_MAP_CATALOG,
  getBrawlerDef,
  getMapDef,
  slugifyBsName,
  type BsBrawlerDef,
  type BsMapDef,
} from "./bs-catalog";

export type CustomBrawlerEntry = {
  name: string;
  slug?: string;
  imageUrl?: string;
  enabled?: boolean;
};

export type MapWinRateEntry = { brawler: string; rate: string };

export type CustomMapEntry = {
  name: string;
  slug?: string;
  mode?: string;
  imageUrl?: string;
  enabled?: boolean;
  description?: string;
  best_picks?: string[];
  most_used?: string[];
  most_banned?: string[];
  win_rates?: MapWinRateEntry[];
  notes?: string;
};

export type MapCatalogEntry = BsMapDef & {
  description?: string;
  best_picks?: string[];
  most_used?: string[];
  most_banned?: string[];
  win_rates?: MapWinRateEntry[];
  notes?: string;
};

export type GameAssetsCatalog = {
  brawlers: CustomBrawlerEntry[];
  maps: CustomMapEntry[];
  updated_at?: string;
};

export const GAME_ASSETS_SETTINGS_KEY = "game_assets_catalog";

export function emptyGameAssetsCatalog(): GameAssetsCatalog {
  return { brawlers: [], maps: [] };
}

function entryEnabled(e: { enabled?: boolean }): boolean {
  return e.enabled !== false;
}

export function mergeBrawlerCatalog(custom: GameAssetsCatalog | null | undefined): BsBrawlerDef[] {
  const byKey = new Map<string, BsBrawlerDef>();
  for (const b of BS_BRAWLER_CATALOG) {
    byKey.set(b.name.toLowerCase(), b);
    byKey.set(b.slug, b);
  }
  for (const row of custom?.brawlers ?? []) {
    if (!entryEnabled(row) || !row.name?.trim()) continue;
    const name = row.name.trim();
    const slug = row.slug?.trim() || slugifyBsName(name);
    byKey.set(name.toLowerCase(), {
      name,
      slug,
      imageUrl: row.imageUrl?.trim() || getBrawlerDef(name).imageUrl,
    });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeMapCatalog(custom: GameAssetsCatalog | null | undefined): MapCatalogEntry[] {
  const byKey = new Map<string, MapCatalogEntry>();
  for (const m of BS_MAP_CATALOG) byKey.set(m.name.toLowerCase(), { ...m });
  for (const row of custom?.maps ?? []) {
    if (!entryEnabled(row) || !row.name?.trim()) continue;
    const name = row.name.trim();
    const base = getMapDef(name);
    byKey.set(name.toLowerCase(), {
      name,
      slug: row.slug?.trim() || base.slug,
      mode: row.mode?.trim() || base.mode,
      imageUrl: row.imageUrl?.trim() || base.imageUrl,
      description: row.description?.trim() || undefined,
      best_picks: row.best_picks?.filter(Boolean),
      most_used: row.most_used?.filter(Boolean),
      most_banned: row.most_banned?.filter(Boolean),
      win_rates: row.win_rates?.filter((w) => w.brawler?.trim()),
      notes: row.notes?.trim() || undefined,
    });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveMapCatalogEntry(
  name: string,
  catalog?: MapCatalogEntry[],
): MapCatalogEntry {
  const list = catalog ?? mergeMapCatalog(null);
  const key = name.trim().toLowerCase();
  const hit = list.find((m) => m.name.toLowerCase() === key);
  return hit ?? { ...getMapDef(name) };
}

export function resolveBrawlerDef(
  name: string,
  catalog?: BsBrawlerDef[],
): BsBrawlerDef {
  const list = catalog ?? BS_BRAWLER_CATALOG;
  const key = name.trim().toLowerCase();
  const hit = list.find((b) => b.name.toLowerCase() === key || b.slug === key);
  return hit ?? getBrawlerDef(name);
}

export function resolveMapDef(name: string, catalog?: MapCatalogEntry[]): BsMapDef {
  return resolveMapCatalogEntry(name, catalog);
}

export function isBrawlerBanned(name: string, banned: string[]): boolean {
  const key = name.trim().toLowerCase();
  return banned.some((b) => b.trim().toLowerCase() === key);
}

/** Bans centrales por mapa (draft competitivo). */
export const MAX_BRAWLER_BANS_CENTRAL = 2;
/** @deprecated Usar MAX_BRAWLER_BANS_CENTRAL */
export const MAX_BRAWLER_BANS_PER_TEAM = MAX_BRAWLER_BANS_CENTRAL;
export const MAX_BRAWLER_PICKS_PER_MAP = 3;
