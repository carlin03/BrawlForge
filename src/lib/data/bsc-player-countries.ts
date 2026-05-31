import seed from "./generated/bsc-player-countries.json";
import { countryValueForStorage } from "./country-picker";
import type { Region } from "../types";

export type PlayerCountrySeedEntry = {
  country: string;
  region?: string;
  team_slug?: string;
  source?: string;
};

const SEED_BY_SLUG = new Map<string, PlayerCountrySeedEntry>(
  Object.entries((seed as { countries?: Record<string, PlayerCountrySeedEntry> }).countries ?? {}).map(
    ([slug, entry]) => [slug.trim().toLowerCase(), entry],
  ),
);

export const BSC_PLAYER_COUNTRY_SEED_REGIONS: Region[] = ["EMEA", "EA"];

export function getPlayerCountrySeed(slug: string): PlayerCountrySeedEntry | undefined {
  return SEED_BY_SLUG.get(slug.trim().toLowerCase());
}

export function getPlayerCountrySeedIso(slug: string): string {
  const raw = getPlayerCountrySeed(slug)?.country;
  if (!raw) return "";
  return countryValueForStorage(raw);
}

export function listPlayerCountrySeedSlugs(regions?: readonly string[]): string[] {
  const allow = regions?.length ? new Set(regions.map((r) => r.toUpperCase())) : null;
  return [...SEED_BY_SLUG.entries()]
    .filter(([, e]) => !allow || allow.has(String(e.region ?? "").toUpperCase()))
    .map(([slug]) => slug);
}

export function playerCountrySeedStats() {
  const s = seed as { counts?: { players?: number; withCountry?: number; missing?: number }; generatedAt?: string };
  return {
    generatedAt: s.generatedAt ?? null,
    ...s.counts,
  };
}
