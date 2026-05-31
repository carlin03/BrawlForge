import {
  BS_BRAWLER_CATALOG,
  BS_MAP_CATALOG,
  getBrawlerDef,
  getMapDef,
  slugifyBsName,
  type BsBrawlerDef,
  type BsMapDef,
} from "./bs-catalog";

export type MapWinRateEntry = { brawler: string; rate: string };

export type CustomBrawlerEntry = {
  name: string;
  slug?: string;
  imageUrl?: string;
  enabled?: boolean;
  rarity?: string;
  class?: string;
  description?: string;
  notes?: string;
  extra?: Record<string, string>;
};

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
  stats_extra?: string;
};

export type MapStrategicOverride = Partial<
  Pick<
    CustomMapEntry,
    | "description"
    | "mode"
    | "imageUrl"
    | "best_picks"
    | "most_used"
    | "most_banned"
    | "win_rates"
    | "notes"
    | "stats_extra"
  >
>;

export type BrawlerOverride = Partial<
  Pick<CustomBrawlerEntry, "rarity" | "class" | "description" | "notes" | "imageUrl" | "extra">
>;

export type MapCatalogEntry = BsMapDef & {
  description?: string;
  best_picks?: string[];
  most_used?: string[];
  most_banned?: string[];
  win_rates?: MapWinRateEntry[];
  notes?: string;
  stats_extra?: string;
  /** true si hay datos estratégicos en biblioteca */
  fromLibrary?: boolean;
};

export type BrawlerCatalogEntry = BsBrawlerDef & {
  rarity?: string;
  class?: string;
  description?: string;
  notes?: string;
  extra?: Record<string, string>;
  fromLibrary?: boolean;
};

export type GameAssetsCatalog = {
  brawlers: CustomBrawlerEntry[];
  maps: CustomMapEntry[];
  updated_at?: string;
  brawlapi_synced_at?: string;
};

export const GAME_ASSETS_SETTINGS_KEY = "game_assets_catalog";

export function emptyGameAssetsCatalog(): GameAssetsCatalog {
  return { brawlers: [], maps: [] };
}

function entryEnabled(e: { enabled?: boolean }): boolean {
  return e.enabled !== false;
}

function hasMapStrategic(row: CustomMapEntry): boolean {
  return Boolean(
    row.description ||
      row.best_picks?.length ||
      row.most_used?.length ||
      row.most_banned?.length ||
      row.win_rates?.length ||
      row.notes ||
      row.stats_extra,
  );
}

function customRowToMapEntry(row: CustomMapEntry): MapCatalogEntry {
  const name = row.name.trim();
  const base = getMapDef(name);
  return {
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
    stats_extra: row.stats_extra?.trim() || undefined,
    fromLibrary: hasMapStrategic(row),
  };
}

function customRowToBrawlerEntry(row: CustomBrawlerEntry): BrawlerCatalogEntry {
  const name = row.name.trim();
  const slug = row.slug?.trim() || slugifyBsName(name);
  const base = getBrawlerDef(name);
  return {
    name,
    slug,
    imageUrl: row.imageUrl?.trim() || base.imageUrl,
    rarity: row.rarity?.trim() || undefined,
    class: row.class?.trim() || undefined,
    description: row.description?.trim() || undefined,
    notes: row.notes?.trim() || undefined,
    extra: row.extra,
    fromLibrary: Boolean(row.rarity || row.class || row.description || row.notes || row.imageUrl),
  };
}

export function mergeBrawlerCatalog(
  custom: GameAssetsCatalog | null | undefined,
): BrawlerCatalogEntry[] {
  /** Una entrada por slug (evita duplicados al indexar nombre + slug). */
  const bySlug = new Map<string, BrawlerCatalogEntry>();
  for (const b of BS_BRAWLER_CATALOG) {
    const slug = b.slug.toLowerCase();
    if (!bySlug.has(slug)) bySlug.set(slug, { ...b });
  }
  for (const row of custom?.brawlers ?? []) {
    if (!entryEnabled(row) || !row.name?.trim()) continue;
    const entry = customRowToBrawlerEntry(row);
    bySlug.set(entry.slug.toLowerCase(), entry);
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeMapCatalog(custom: GameAssetsCatalog | null | undefined): MapCatalogEntry[] {
  const byName = new Map<string, MapCatalogEntry>();
  for (const m of BS_MAP_CATALOG) {
    const key = m.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, { ...m, fromLibrary: false });
  }
  for (const row of custom?.maps ?? []) {
    if (!entryEnabled(row) || !row.name?.trim()) continue;
    const entry = customRowToMapEntry(row);
    byName.set(entry.name.toLowerCase(), entry);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveMapCatalogEntry(
  name: string,
  catalog?: MapCatalogEntry[],
): MapCatalogEntry {
  const list = catalog ?? mergeMapCatalog(null);
  const key = name.trim().toLowerCase();
  const hit = list.find((m) => m.name.toLowerCase() === key);
  return hit ?? { ...getMapDef(name), fromLibrary: false };
}

export function resolveBrawlerCatalogEntry(
  name: string,
  catalog?: BrawlerCatalogEntry[],
): BrawlerCatalogEntry {
  const list = catalog ?? mergeBrawlerCatalog(null);
  const key = name.trim().toLowerCase();
  const hit = list.find(
    (b) => b.name.toLowerCase() === key || b.slug.toLowerCase() === key,
  );
  return hit ?? { ...getBrawlerDef(name), fromLibrary: false };
}

/** @deprecated Usar resolveBrawlerCatalogEntry */
export function resolveBrawlerDef(
  name: string,
  catalog?: BrawlerCatalogEntry[],
): BrawlerCatalogEntry {
  return resolveBrawlerCatalogEntry(name, catalog);
}

export function resolveMapDef(name: string, catalog?: MapCatalogEntry[]): BsMapDef {
  return resolveMapCatalogEntry(name, catalog);
}

export function isBrawlerBanned(name: string, banned: string[]): boolean {
  const key = name.trim().toLowerCase();
  return banned.some((b) => b.trim().toLowerCase() === key);
}

export const MAX_BRAWLER_BANS_CENTRAL = 2;
/** Bans bajo los picks de cada equipo (3 por lado). */
export const MAX_BRAWLER_BANS_PER_TEAM = 3;
export const MAX_BRAWLER_PICKS_PER_MAP = 3;
