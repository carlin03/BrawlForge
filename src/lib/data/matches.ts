import type { Region } from "../types";
import {
  bsc2026Tournaments,
  BSC_TOURNAMENT_ALIASES,
  isBscCircuitSlug,
} from "./bsc-tournaments";
import { getBscTournamentEnrichment, getBscEnrichedMatches } from "./bsc-tournaments-enriched";
import { getBscTournamentParticipantSlugs } from "./bsc-tournament-participants";
import { bscMatches } from "./bsc-matches";
import { getTeam } from "./teams";
import { isValidLogoSlug } from "./logo-slugs";
import { ensureAutoTournament, getDiscoveredTournaments } from "./auto-tournaments";
import {
  getGeneratedMatches,
  getGeneratedTournaments,
  isFeaturedTournament,
  isTierBPlus,
  normalizeParticipantList,
} from "./catalog";
import { sanitizePublicWebsite } from "@/lib/sanitize-liquipedia";
import { getMatchPool } from "./match-pool";
import { isPublicScheduleMatch, isPublicUpcomingCalendarMatch } from "./match-schedule-trust";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { isPendingTeamSlug } from "./match-meta";
import { getMatchStageMeta } from "./match-stage-meta";
import { isCuratedPublicTournamentSlug } from "./curated-tournaments";
import { TOURNAMENT_SLUG_ALIASES } from "./catalog";

import type { MatchMeta } from "./match-meta";
import type { EsportsMatch } from "./esports-match-types";

export type { EsportsMatch } from "./esports-match-types";

export interface EsportsTournament {
  slug: string;
  name: string;
  shortName: string;
  region: Region;
  prizePool: string;
  teams: number;
  status: "live" | "upcoming" | "finished";
  startDate: string;
  endDate: string;
  location: string;
  stage: string;
  winnerSlug?: string;
  tier?: number;
  featured?: boolean;
  participantSlugs?: string[];
  logoFile?: string | null;
  organizer?: string;
  venue?: string;
  eventType?: string;
  series?: string;
  website?: string;
  format?: string;
  prizeBreakdown?: { place: string; prize: string }[];
}

const PRIORITY_TOURNAMENTS: EsportsTournament[] = [
  {
    slug: "world-finals-2026",
    name: "Brawl Stars World Finals 2026",
    shortName: "World Finals 2026",
    region: "GLOBAL",
    prizePool: "TBA",
    teams: 16,
    status: "upcoming",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    location: "Tokyo, Japan",
    stage: "Qualifiers ongoing",
    featured: true,
  },
  {
    slug: "bsc-2026-s3-emea-mf",
    name: "BSC 2026: Season 3 EMEA Monthly Finals",
    shortName: "BSC S3 EMEA MF",
    region: "EMEA",
    prizePool: "$42,000",
    teams: 8,
    status: "finished",
    startDate: "2026-04-12",
    endDate: "2026-04-12",
    location: "Online",
    stage: "Completed",
    winnerSlug: "fut-esports",
  },
  {
    slug: "bsc-2026-s3-ea-mf",
    name: "BSC 2026: Season 3 East Asia Monthly Finals",
    shortName: "BSC S3 EA MF",
    region: "EA",
    prizePool: "$40,000",
    teams: 8,
    status: "finished",
    startDate: "2026-04-11",
    endDate: "2026-04-11",
    location: "Online",
    stage: "Completed",
    winnerSlug: "crazy-raccoon",
  },
  {
    slug: "bsc-2026-s3-na-mf",
    name: "BSC 2026: Season 3 NA Monthly Finals",
    shortName: "BSC S3 NA MF",
    region: "NA",
    prizePool: "$34,000",
    teams: 8,
    status: "finished",
    startDate: "2026-04-19",
    endDate: "2026-04-19",
    location: "Online",
    stage: "Completed",
    winnerSlug: "tribe-gaming",
  },
];

function sortEsportsTournaments(list: EsportsTournament[]): EsportsTournament[] {
  const statusOrder: Record<EsportsTournament["status"], number> = { live: 0, upcoming: 1, finished: 2 };
  return [...list].sort((a, b) => {
    const sa = statusOrder[a.status] - statusOrder[b.status];
    if (sa !== 0) return sa;
    if (a.status === "finished") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
}

function mergeBscTournamentDef(t: (typeof bsc2026Tournaments)[number]): EsportsTournament {
  const wiki = getBscTournamentEnrichment(t.slug);
  const wikiParticipants = (wiki?.participantSlugs ?? []).filter((s) => Boolean(getTeam(s)));
  const participants =
    wikiParticipants.length >= 2 ? wikiParticipants : getBscTournamentParticipantSlugs(t.slug);
  return {
    ...t,
    name: wiki?.name ?? t.name,
    shortName: wiki?.shortName ?? t.shortName,
    prizePool: wiki?.prizePool ?? t.prizePool,
    startDate: wiki?.startDate || t.startDate,
    endDate: wiki?.endDate || t.endDate,
    location: wiki?.location ?? t.location,
    status: wiki?.status ?? t.status,
    teams: wiki?.teamCount ?? (participants.length || t.teams),
    winnerSlug: wiki?.winnerSlug ?? t.winnerSlug,
    organizer: wiki?.organizer,
    venue: wiki?.venue,
    eventType: wiki?.type,
    series: wiki?.series,
    website: sanitizePublicWebsite(wiki?.website),
    format: wiki?.format,
    prizeBreakdown: wiki?.prizeBreakdown,
    tier: wiki?.tier ?? 1,
    featured: true,
    logoFile: t.logoFile,
    participantSlugs: participants.length ? participants : undefined,
  };
}

/** Solo torneos BSC 2026 curados (admin) — sin AGG League, ADWT, etc. de Liquipedia */
function buildTournaments(): EsportsTournament[] {
  const map = new Map<string, EsportsTournament>();

  for (const t of bsc2026Tournaments) {
    map.set(t.slug, mergeBscTournamentDef(t));
  }

  for (const [alias, canonical] of Object.entries(BSC_TOURNAMENT_ALIASES)) {
    const base = map.get(canonical);
    if (!base) continue;
    const participants = getBscTournamentParticipantSlugs(alias);
    map.set(alias, {
      ...base,
      slug: alias,
      participantSlugs: participants.length ? participants : base.participantSlugs,
      teams: participants.length || base.teams,
    });
  }

  for (const t of PRIORITY_TOURNAMENTS) {
    map.set(t.slug, { ...map.get(t.slug), ...t, featured: true });
  }

  return sortEsportsTournaments([...map.values()]);
}

export const tournaments: EsportsTournament[] = buildTournaments();

export { getLegacyMatchList } from "./legacy-matches";
export { matchDedupeKey } from "./playoff-pool-normalize";

function mapGeneratedTournament(t: ReturnType<typeof getGeneratedTournaments>[number]): EsportsTournament {
  return {
    slug: t.slug,
    name: t.name,
    shortName: t.shortName,
    region: t.region,
    prizePool: t.prizePool,
    teams: t.participantSlugs?.length || t.teams,
    status: t.status,
    startDate: t.startDate,
    endDate: t.endDate,
    location: t.location,
    stage: t.stage,
    tier: t.tier,
    featured: isFeaturedTournament(t),
    participantSlugs: t.participantSlugs,
    logoFile: t.logoFile,
    organizer: t.organizer,
    venue: t.venue,
    eventType: t.eventType,
    series: t.series,
    website: sanitizePublicWebsite(t.website),
    winnerSlug: t.winnerSlug,
    format: t.format,
    prizeBreakdown: t.prizeBreakdown,
  };
}

export function getTournament(slug: string): EsportsTournament | undefined {
  const bsc = tournaments.find((t) => t.slug === slug);
  if (bsc) return bsc;
  const gen = getGeneratedTournaments().find((t) => t.slug === slug);
  if (gen) return mapGeneratedTournament(gen);
  return ensureAutoTournament(slug);
}

const STATUS_ORDER: Record<EsportsTournament["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function sortCircuitTournaments(list: EsportsTournament[]): EsportsTournament[] {
  return [...list].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (sa !== 0) return sa;
    if (a.status === "finished") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
}

/** Calendario BSC 2026 — solo torneos con logo manual del usuario */
export function getBscCircuitTournaments(limit?: number): EsportsTournament[] {
  const list = sortCircuitTournaments(
    tournaments.filter((t) => isCuratedPublicTournamentSlug(t.slug)),
  );
  return limit ? list.slice(0, limit) : list;
}

export function searchTournaments(query: string, limit = 60): EsportsTournament[] {
  const pool = getTierBPlusTournaments();
  const q = query.trim().toLowerCase();
  if (!q) {
    return pool.filter((t) => t.featured || t.status !== "finished").slice(0, limit);
  }
  return pool
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.slug.includes(q),
    )
    .slice(0, limit);
}

export function getFeaturedTournaments(limit = 24): EsportsTournament[] {
  return getBscCircuitTournaments()
    .filter((t) => t.featured !== false)
    .slice(0, limit);
}

function buildTierBPlusTournamentList(): EsportsTournament[] {
  return sortCircuitTournaments(tournaments.filter((t) => isBscCircuitSlug(t.slug)));
}

/** Listados públicos de torneos — solo circuito BSC 2026 curado (~52 eventos). */
export function getTierBPlusTournaments(limit?: number): EsportsTournament[] {
  const list = buildTierBPlusTournamentList();
  return limit ? list.slice(0, limit) : list;
}

export function getMatch(id: string): EsportsMatch | undefined {
  return getMatchPool().find((m) => m.id === id);
}

/** Slugs equivalentes (alias BSC S3 ↔ april, etc.) para filtros y listados. */
export function expandTournamentSlugFilter(tournamentSlug: string): string[] {
  const set = new Set<string>([tournamentSlug]);
  const alias = BSC_TOURNAMENT_ALIASES[tournamentSlug];
  if (alias) set.add(alias);
  for (const [a, canonical] of Object.entries(BSC_TOURNAMENT_ALIASES)) {
    if (canonical === tournamentSlug) set.add(a);
  }
  const lpAlias = TOURNAMENT_SLUG_ALIASES[tournamentSlug];
  if (lpAlias) set.add(lpAlias);
  for (const [canonical, lp] of Object.entries(TOURNAMENT_SLUG_ALIASES)) {
    if (lp === tournamentSlug) set.add(canonical);
  }
  return [...set];
}

export function getMatchesByTournament(tournamentSlug: string): EsportsMatch[] {
  const slugs = expandTournamentSlugFilter(tournamentSlug);
  return getMatchPool().filter((m) => slugs.includes(m.tournamentSlug));
}

export function getLiveMatches(): EsportsMatch[] {
  return getMatchPool().filter((m) => isPublicScheduleMatch(m) && m.status === "live");
}

export function getUpcomingMatches(): EsportsMatch[] {
  return [...getMatchPool()]
    .filter((m) => {
      const status = getEffectiveMatchStatus(m);
      return (
        isPublicUpcomingCalendarMatch(m) && (status === "upcoming" || status === "live")
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getTournamentParticipantSlugs(slug: string): string[] {
  if (/^bsc-2026|^world-finals-2026/.test(slug)) {
    const bsc = getBscTournamentParticipantSlugs(slug);
    if (bsc.length) return bsc;
  }

  const t = getTournament(slug);
  if (t?.participantSlugs?.length) return normalizeParticipantList(t.participantSlugs);

  const fromMatches = [
    ...new Set(
      getMatchesByTournament(slug)
        .flatMap((m) => [m.teamASlug, m.teamBSlug])
        .filter((s) => s && s !== "tbd"),
    ),
  ];
  if (fromMatches.length >= 2) return normalizeParticipantList(fromMatches);

  return [];
}

export function getRecentMatches(limit = 8): EsportsMatch[] {
  return [...getMatchPool()]
    .filter((m) => isPublicScheduleMatch(m) && m.status === "finished")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export {
  isKnownTeamSlug,
  isDisplayableMatch,
  isSchedulableMatch,
  isSchedulableTeamSlug,
  isPickemMatchEligible,
} from "./pickem-eligibility";

export { getCuratedHomeMatches } from "./home-matches";
