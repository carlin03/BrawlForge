import enrichedFile from "./generated/bsc-tournaments-enriched.json";
import type { EsportsMatch } from "./matches";
import { isLiquipediaReference, sanitizePublicWebsite } from "@/lib/sanitize-liquipedia";

export type BscTournamentPrizeRow = { place: string; prize: string };

export type BscTournamentEnrichment = {
  slug: string;
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
  tier?: number;
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
  tournaments?: Record<string, Record<string, unknown>>;
  matches?: EsportsMatch[];
};

const FILE = enrichedFile as EnrichedFile;
const TOURNAMENTS = FILE.tournaments ?? {};

function mapEnrichment(raw: Record<string, unknown>, slug: string): BscTournamentEnrichment {
  const tier =
    typeof raw.liquipediaTier === "number"
      ? raw.liquipediaTier
      : typeof raw.tier === "number"
        ? raw.tier
        : undefined;
  const website = sanitizePublicWebsite(
    typeof raw.website === "string" ? raw.website : undefined,
  );
  return {
    slug,
    name: typeof raw.name === "string" ? raw.name : undefined,
    shortName: typeof raw.shortName === "string" ? raw.shortName : undefined,
    prizePool: typeof raw.prizePool === "string" ? raw.prizePool : undefined,
    startDate: typeof raw.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
    location: typeof raw.location === "string" ? raw.location : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    country: typeof raw.country === "string" ? raw.country : undefined,
    venue: typeof raw.venue === "string" ? raw.venue : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    format: typeof raw.format === "string" ? raw.format : undefined,
    organizer:
      typeof raw.organizer === "string" && !isLiquipediaReference(raw.organizer)
        ? raw.organizer
        : undefined,
    tier,
    teamCount: typeof raw.teamCount === "number" ? raw.teamCount : undefined,
    series: typeof raw.series === "string" ? raw.series : undefined,
    website,
    winnerSlug: typeof raw.winnerSlug === "string" ? raw.winnerSlug : undefined,
    status:
      raw.status === "live" || raw.status === "upcoming" || raw.status === "finished"
        ? raw.status
        : undefined,
    participantSlugs: Array.isArray(raw.participantSlugs)
      ? (raw.participantSlugs as string[])
      : undefined,
    matchCount: typeof raw.matchCount === "number" ? raw.matchCount : undefined,
    prizeBreakdown: Array.isArray(raw.prizeBreakdown)
      ? (raw.prizeBreakdown as BscTournamentPrizeRow[])
      : undefined,
    syncedAt: typeof raw.syncedAt === "string" ? raw.syncedAt : undefined,
    missing: Boolean(raw.missing),
  };
}

export function getBscTournamentEnrichment(slug: string): BscTournamentEnrichment | undefined {
  const key = slug.trim().toLowerCase();
  const fromFile = TOURNAMENTS[key];
  if (!fromFile || fromFile.missing) return undefined;
  return mapEnrichment(fromFile, key);
}

export function getBscEnrichedMatches(): EsportsMatch[] {
  return FILE.matches ?? [];
}

export function getBscEnrichmentSyncedAt(): string | undefined {
  return FILE.syncedAt ?? undefined;
}
