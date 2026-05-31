import { slugifyBsName } from "@/lib/data/bs-catalog";
import type { CustomBrawlerEntry, CustomMapEntry } from "@/lib/data/game-assets-catalog";

const BRAWLAPI_BASE = "https://api.brawlapi.com/v1";

type BrawlApiBrawler = {
  name: string;
  hash?: string;
  path?: string;
  imageUrl?: string;
  imageUrl2?: string;
  class?: { name?: string };
  rarity?: { name?: string };
  description?: string;
  released?: boolean;
};

type BrawlApiMap = {
  name: string;
  hash?: string;
  disabled?: boolean;
  imageUrl?: string;
  gameMode?: { name?: string };
};

function titleCaseMapName(raw: string): string {
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/s /g, "'s ");
}

function normalizeBrawlerList(raw: unknown): BrawlApiBrawler[] {
  if (Array.isArray(raw)) return raw as BrawlApiBrawler[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.list)) return o.list as BrawlApiBrawler[];
    if (Array.isArray(o.brawlers)) return o.brawlers as BrawlApiBrawler[];
  }
  return [];
}

function normalizeMapList(raw: unknown): BrawlApiMap[] {
  if (Array.isArray(raw)) return raw as BrawlApiMap[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.list)) return o.list as BrawlApiMap[];
    if (Array.isArray(o.maps)) return o.maps as BrawlApiMap[];
  }
  return [];
}

export async function fetchBrawlApiBrawlers(): Promise<CustomBrawlerEntry[]> {
  const res = await fetch(`${BRAWLAPI_BASE}/brawlers`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`BrawlAPI brawlers: ${res.status}`);
  const raw = await res.json();
  const list = normalizeBrawlerList(raw);

  return list
    .filter((b) => b.released !== false && b.name?.trim())
    .map((b) => {
      const slug = b.path?.trim() || b.hash?.trim() || slugifyBsName(b.name);
      const proper = (b.path || b.hash || b.name)
        .split("-")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      return {
        name: proper,
        slug,
        imageUrl:
          b.imageUrl2 ||
          `https://cdn.brawlify.com/profile/${slug}.png`,
        rarity: b.rarity?.name && b.rarity.name !== "Unknown" ? b.rarity.name : undefined,
        class: b.class?.name && b.class.name !== "Unknown" ? b.class.name : undefined,
        description: b.description?.trim() || undefined,
        enabled: true,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchBrawlApiMaps(): Promise<CustomMapEntry[]> {
  const res = await fetch(`${BRAWLAPI_BASE}/maps`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`BrawlAPI maps: ${res.status}`);
  const raw = await res.json();
  const list = normalizeMapList(raw);

  return list
    .filter((m) => !m.disabled && (m.hash || m.name))
    .map((m) => {
      const slug = m.hash?.trim() || slugifyBsName(m.name);
      const name = m.name.includes("-") ? titleCaseMapName(m.name) : m.name;
      const mode = m.gameMode?.name
        ? m.gameMode.name.charAt(0) + m.gameMode.name.slice(1).toLowerCase()
        : undefined;
      return {
        name,
        slug,
        mode,
        imageUrl: m.imageUrl || `https://cdn.brawlify.com/map-bgs/${slug}.png`,
        enabled: true,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Fusiona importación BrawlAPI sin borrar datos estratégicos ya editados en admin. */
export function mergeCatalogImport<T extends { name: string }>(
  existing: T[],
  imported: T[],
  fillEmpty: (prev: T | undefined, next: T) => T,
): T[] {
  const byName = new Map<string, T>();
  for (const row of existing) {
    if (row.name?.trim()) byName.set(row.name.trim().toLowerCase(), row);
  }
  for (const row of imported) {
    const key = row.name.trim().toLowerCase();
    const prev = byName.get(key);
    byName.set(key, fillEmpty(prev, row));
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeBrawlerImport(
  existing: CustomBrawlerEntry[],
  imported: CustomBrawlerEntry[],
): CustomBrawlerEntry[] {
  return mergeCatalogImport(existing, imported, (prev, next) => ({
    ...next,
    ...prev,
    name: next.name,
    slug: prev?.slug || next.slug,
    imageUrl: prev?.imageUrl?.trim() || next.imageUrl,
    rarity: prev?.rarity || next.rarity,
    class: prev?.class || next.class,
    description: prev?.description || next.description,
    notes: prev?.notes || next.notes,
    enabled: prev?.enabled ?? next.enabled ?? true,
  }));
}

export function mergeMapImport(
  existing: CustomMapEntry[],
  imported: CustomMapEntry[],
): CustomMapEntry[] {
  return mergeCatalogImport(existing, imported, (prev, next) => ({
    ...next,
    ...prev,
    name: next.name,
    slug: prev?.slug || next.slug,
    mode: prev?.mode || next.mode,
    imageUrl: prev?.imageUrl?.trim() || next.imageUrl,
    description: prev?.description || next.description,
    best_picks: prev?.best_picks?.length ? prev.best_picks : next.best_picks,
    most_used: prev?.most_used?.length ? prev.most_used : next.most_used,
    most_banned: prev?.most_banned?.length ? prev.most_banned : next.most_banned,
    win_rates: prev?.win_rates?.length ? prev.win_rates : next.win_rates,
    notes: prev?.notes || next.notes,
    stats_extra: prev?.stats_extra || next.stats_extra,
    enabled: prev?.enabled ?? next.enabled ?? true,
  }));
}
