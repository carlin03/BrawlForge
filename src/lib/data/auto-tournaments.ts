import type { Region } from "../types";
import discoveredTournaments from "./generated/tournaments-discovered.json";
import { getGeneratedTournaments, isTierBPlus } from "./catalog";
import type { EsportsTournament } from "./matches";

type DiscoveredTournamentRow = {
  slug: string;
  name: string;
  shortName: string;
  region: Region;
  prizePool: string;
  teams: number;
  status: EsportsTournament["status"];
  startDate: string;
  endDate: string;
  location: string;
  stage: string;
  tier?: number;
  logoFile?: string | null;
  source?: string;
};

const discoveredRows = (
  Array.isArray(discoveredTournaments) ? discoveredTournaments : []
) as DiscoveredTournamentRow[];

const generatedBySlug = new Map(getGeneratedTournaments().map((t) => [t.slug, t]));
const discoveredBySlug = new Map(discoveredRows.map((t) => [t.slug.trim().toLowerCase(), t]));
const stubCache = new Map<string, EsportsTournament>();

function rowToTournament(row: DiscoveredTournamentRow): EsportsTournament {
  return {
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    region: row.region,
    prizePool: row.prizePool,
    teams: row.teams,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    location: row.location,
    stage: row.stage,
    tier: row.tier,
    featured: row.tier != null ? row.tier <= 3 : true,
    logoFile: row.logoFile ?? null,
  };
}

/** Torneo mínimo para slugs de partidos/Liquipedia que aún no están en admin BSC. */
export function ensureAutoTournament(slug: string): EsportsTournament | undefined {
  const key = slug.trim().toLowerCase();
  if (!key) return undefined;
  if (stubCache.has(key)) return stubCache.get(key);

  const gen = generatedBySlug.get(key);
  if (gen && isTierBPlus(gen)) {
    const t: EsportsTournament = {
      slug: gen.slug,
      name: gen.name,
      shortName: gen.shortName,
      region: gen.region,
      prizePool: gen.prizePool,
      teams: gen.teams,
      status: gen.status,
      startDate: gen.startDate,
      endDate: gen.endDate,
      location: gen.location,
      stage: gen.stage,
      tier: gen.tier,
      featured: true,
      participantSlugs: gen.participantSlugs,
      logoFile: gen.logoFile,
    };
    stubCache.set(key, t);
    return t;
  }

  const disc = discoveredBySlug.get(key);
  if (disc) {
    const t = rowToTournament(disc);
    stubCache.set(key, t);
    return t;
  }

  return undefined;
}

export function getDiscoveredTournaments(): EsportsTournament[] {
  return discoveredRows.map(rowToTournament);
}
