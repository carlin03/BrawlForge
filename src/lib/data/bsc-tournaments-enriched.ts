import enrichedFile from "./generated/bsc-tournaments-enriched.json";
import type { EsportsMatch } from "./matches";
import { getBsc2026LiquipediaUrl } from "./bsc-2026-liquipedia-pages";

export type BscTournamentPrizeRow = { place: string; prize: string };

export type BscTournamentEnrichment = {
  slug: string;
  liquipediaPage: string;
  liquipediaUrl: string;
  name?: string;
  shortName?: string;
  prizePool?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  city?: string;
  country?: string;
  venue?: string;
  type?: string;
  format?: string;
  organizer?: string;
  liquipediaTier?: number;
  teamCount?: number;
  series?: string;
  website?: string;
  winnerSlug?: string;
  status?: "live" | "upcoming" | "finished";
  participantSlugs?: string[];
  matchCount?: number;
  prizeBreakdown?: BscTournamentPrizeRow[];
  syncedAt?: string;
  missing?: boolean;
};

type EnrichedFile = {
  syncedAt?: string | null;
  tournaments?: Record<string, BscTournamentEnrichment>;
  matches?: EsportsMatch[];
};

const FILE = enrichedFile as EnrichedFile;
const TOURNAMENTS = FILE.tournaments ?? {};

export function getBscTournamentEnrichment(slug: string): BscTournamentEnrichment | undefined {
  const key = slug.trim().toLowerCase();
  const fromFile = TOURNAMENTS[key];
  if (fromFile && !fromFile.missing) return fromFile;
  const url = getBsc2026LiquipediaUrl(key);
  if (!url) return undefined;
  return {
    slug: key,
    liquipediaPage: url.replace("https://liquipedia.net/brawlstars/", ""),
    liquipediaUrl: url,
  };
}

export function getBscEnrichedMatches(): EsportsMatch[] {
  return FILE.matches ?? [];
}

export function getBscEnrichmentSyncedAt(): string | undefined {
  return FILE.syncedAt ?? undefined;
}
