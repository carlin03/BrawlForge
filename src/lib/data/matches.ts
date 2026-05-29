import type { Region } from "../types";
import {
  bsc2026Tournaments,
  BSC_TOURNAMENT_ALIASES,
  isBscCircuitSlug,
} from "./bsc-tournaments";
import { getBsc2026LiquipediaUrl } from "./bsc-2026-liquipedia-pages";
import { getBscTournamentEnrichment, getBscEnrichedMatches } from "./bsc-tournaments-enriched";
import { getBscTournamentParticipantSlugs } from "./bsc-tournament-participants";
import { bscMatches } from "./bsc-matches";
import { getTeam } from "./teams";
import { isValidLogoSlug } from "./logo-slugs";
import { toLiquipediaUrl, normalizeParticipantList } from "./catalog";
import { getMatchPool } from "./match-pool";

export interface EsportsMatch {
  id: string;
  teamASlug: string;
  teamBSlug: string;
  scoreA: number;
  scoreB: number;
  tournamentSlug: string;
  stage: string;
  date: string;
  status: "live" | "upcoming" | "finished";
  region: Region;
  format: string;
  liquipediaUrl?: string;
}

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
  liquipediaUrl: string;
  winnerSlug?: string;
  tier?: number;
  featured?: boolean;
  participantSlugs?: string[];
  logoFile?: string | null;
  /** Metadatos Liquipedia (sync bsc-tournaments-enriched.json) */
  organizer?: string;
  venue?: string;
  eventType?: string;
  series?: string;
  website?: string;
  liquipediaPage?: string;
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
    liquipediaUrl: "https://liquipedia.net/brawlstars/Brawl_Stars_World_Finals/2026",
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
    liquipediaUrl: "https://liquipedia.net/brawlstars/Brawl_Stars_Championship/2026",
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
    liquipediaUrl: "https://liquipedia.net/brawlstars/Brawl_Stars_Championship/2026",
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
    liquipediaUrl: "https://liquipedia.net/brawlstars/Brawl_Stars_Championship/2026",
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
  const liquipediaUrl =
    wiki?.liquipediaUrl ??
    getBsc2026LiquipediaUrl(t.slug) ??
    t.liquipediaUrl ??
    toLiquipediaUrl("Brawl_Stars_Championship/2026");

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
    liquipediaUrl,
    liquipediaPage: wiki?.liquipediaPage,
    organizer: wiki?.organizer,
    venue: wiki?.venue,
    eventType: wiki?.type,
    series: wiki?.series,
    website: wiki?.website,
    tier: wiki?.liquipediaTier ?? 1,
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

function matchDedupeKey(m: EsportsMatch): string {
  const a = m.teamASlug;
  const b = m.teamBSlug;
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  return `${m.tournamentSlug}|${pair}|${m.date.slice(0, 10)}`;
}

function buildMatches(): EsportsMatch[] {
  const manual2026 = [
    {
      id: "chal-es-sk-1",
      teamASlug: "sk-gaming",
      teamBSlug: "team-heretics",
      scoreA: 0,
      scoreB: 0,
      tournamentSlug: "bsc-2026-challengers-spain",
      stage: "Group Stage",
      date: "2026-05-26T17:00:00Z",
      status: "upcoming" as const,
      region: "EMEA" as const,
      format: "Bo3",
    },
    {
      id: "chal-es-sk-2",
      teamASlug: "sk-gaming",
      teamBSlug: "novo-esports",
      scoreA: 0,
      scoreB: 0,
      tournamentSlug: "bsc-2026-challengers-spain",
      stage: "Group Stage",
      date: "2026-05-27T16:00:00Z",
      status: "upcoming" as const,
      region: "EMEA" as const,
      format: "Bo3",
    },
  ];
  const wikiMatches = getBscEnrichedMatches().filter(
    (m) => isBscCircuitSlug(m.tournamentSlug) && isDisplayableMatch(m),
  );
  const keys = new Set(wikiMatches.map(matchDedupeKey));
  const manualFallback = [...bscMatches, ...manual2026].filter(
    (m) => isBscCircuitSlug(m.tournamentSlug) && isDisplayableMatch(m) && !keys.has(matchDedupeKey(m)),
  );
  const extra = [...wikiMatches, ...manualFallback];
  return extra.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const matches: EsportsMatch[] = buildMatches();

export function getTournament(slug: string): EsportsTournament | undefined {
  if (!isBscCircuitSlug(slug)) return undefined;
  return tournaments.find((t) => t.slug === slug);
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

/** Calendario BSC 2026 curado (Monthly Finals, Challengers, RTBC, WF…) — sin torneos genéricos Liquipedia */
export function getBscCircuitTournaments(limit?: number): EsportsTournament[] {
  const list = sortCircuitTournaments(tournaments.filter((t) => isBscCircuitSlug(t.slug)));
  return limit ? list.slice(0, limit) : list;
}

export function searchTournaments(query: string, limit = 60): EsportsTournament[] {
  const pool = getBscCircuitTournaments();
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

/** Listados públicos de torneos (hub / partidos) — circuito BSC 2026 */
export function getTierBPlusTournaments(limit = 32): EsportsTournament[] {
  return getBscCircuitTournaments(limit);
}

export function getMatch(id: string): EsportsMatch | undefined {
  return getMatchPool().find((m) => m.id === id);
}

export function getMatchesByTournament(tournamentSlug: string): EsportsMatch[] {
  const alias = BSC_TOURNAMENT_ALIASES[tournamentSlug];
  const slugs = alias ? [tournamentSlug, alias] : [tournamentSlug];
  return getMatchPool().filter((m) => slugs.includes(m.tournamentSlug));
}

export function getLiveMatches(): EsportsMatch[] {
  return getMatchPool().filter((m) => m.status === "live");
}

export function getUpcomingMatches(): EsportsMatch[] {
  return [...getMatchPool()]
    .filter((m) => m.status === "upcoming" || m.status === "live")
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
    .filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function isKnownTeamSlug(slug: string): boolean {
  if (!isValidLogoSlug(slug)) return false;
  return !!getTeam(slug);
}

export function isDisplayableMatch(m: EsportsMatch): boolean {
  return isKnownTeamSlug(m.teamASlug) && isKnownTeamSlug(m.teamBSlug);
}

function homeMatchScore(m: EsportsMatch): number {
  let score = 0;
  if (m.status === "live") score += 100;
  if (m.tournamentSlug.includes("bsc") || m.tournamentSlug.includes("world-finals")) score += 50;
  if (m.format.includes("5")) score += 10;
  return score;
}

/** Partidos con equipos reales — para home y widgets (sin TBD) */
export function getCuratedHomeMatches(
  tab: "live" | "upcoming" | "results",
  limit = 8,
): EsportsMatch[] {
  let pool: EsportsMatch[];
  const all = getMatchPool();
  if (tab === "live") {
    pool = all.filter((m) => m.status === "live");
  } else if (tab === "upcoming") {
    pool = all.filter((m) => m.status === "upcoming");
  } else {
    pool = all.filter((m) => m.status === "finished");
  }

  return pool
    .filter(isDisplayableMatch)
    .sort((a, b) => {
      const pri = homeMatchScore(b) - homeMatchScore(a);
      if (pri !== 0) return pri;
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return tab === "results" ? tb - ta : ta - tb;
    })
    .slice(0, limit);
}
