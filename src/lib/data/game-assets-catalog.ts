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

export type CustomMapEntry = {
  name: string;
  slug?: string;
  mode?: string;
  imageUrl?: string;
  enabled?: boolean;
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

export function mergeMapCatalog(custom: GameAssetsCatalog | null | undefined): BsMapDef[] {
  const byKey = new Map<string, BsMapDef>();
  for (const m of BS_MAP_CATALOG) byKey.set(m.name.toLowerCase(), m);
  for (const row of custom?.maps ?? []) {
    if (!entryEnabled(row) || !row.name?.trim()) continue;
    const name = row.name.trim();
    const base = getMapDef(name);
    byKey.set(name.toLowerCase(), {
      name,
      slug: row.slug?.trim() || base.slug,
      mode: row.mode?.trim() || base.mode,
      imageUrl: row.imageUrl?.trim() || base.imageUrl,
    });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
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

export function resolveMapDef(name: string, catalog?: BsMapDef[]): BsMapDef {
  const list = catalog ?? BS_MAP_CATALOG;
  const key = name.trim().toLowerCase();
  const hit = list.find((m) => m.name.toLowerCase() === key);
  return hit ?? getMapDef(name);
}

export function isBrawlerBanned(name: string, banned: string[]): boolean {
  const key = name.trim().toLowerCase();
  return banned.some((b) => b.trim().toLowerCase() === key);
}

export const MAX_BRAWLER_BANS_PER_TEAM = 2;
export const MAX_BRAWLER_PICKS_PER_MAP = 3;
