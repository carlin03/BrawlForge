import type { Region } from "../types";
import { bsc2026Tournaments, BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";
import { bscMatches } from "./bsc-matches";
import { getTeam } from "./teams";
import { isValidLogoSlug } from "./logo-slugs";
import {
  getGeneratedTournaments,
  getGeneratedMatches,
  getTournamentParticipants,
  toLiquipediaUrl,
  isFeaturedTournament,
  isTierBPlus,
  normalizeParticipantList,
} from "./catalog";

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

function cleanLabel(s: string): string {
  return s.replace(/<!--[\s\S]*?-->/g, "").split("\n")[0].trim();
}

function fromGenerated(): EsportsTournament[] {
  return getGeneratedTournaments().map((t) => ({
    slug: t.slug,
    name: cleanLabel(t.name),
    shortName: cleanLabel(t.shortName),
    region: t.region,
    prizePool: t.prizePool,
    teams: t.participantSlugs?.length || t.teams,
    status: t.status,
    startDate: t.startDate,
    endDate: t.endDate,
    location: t.location,
    stage: t.stage,
    liquipediaUrl: toLiquipediaUrl(t.liquipediaPage),
    tier: t.tier,
    featured: isFeaturedTournament(t),
    participantSlugs: t.participantSlugs,
    logoFile: t.logoFile,
  }));
}

function fromGeneratedMatches(): EsportsMatch[] {
  return getGeneratedMatches().map((m) => ({ ...m }));
}

function sortEsportsTournaments(list: EsportsTournament[]): EsportsTournament[] {
  const statusOrder: Record<EsportsTournament["status"], number> = { live: 0, upcoming: 1, finished: 2 };
  return [...list].sort((a, b) => {
    const sa = statusOrder[a.status] - statusOrder[b.status];
    if (sa !== 0) return sa;
    if (a.status === "finished") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
}

function buildTournaments(): EsportsTournament[] {
  const map = new Map<string, EsportsTournament>();

  for (const t of fromGenerated()) {
    map.set(t.slug, t);
  }

  for (const t of bsc2026Tournaments) {
    const existing = map.get(t.slug);
    map.set(t.slug, {
      ...existing,
      ...t,
      liquipediaUrl: t.liquipediaUrl ?? toLiquipediaUrl("Brawl_Stars_Championship/2026"),
      featured: true,
      tier: existing?.tier ?? 1,
      logoFile: existing?.logoFile ?? t.logoFile,
      participantSlugs: existing?.participantSlugs ?? t.participantSlugs,
    });
  }

  for (const t of PRIORITY_TOURNAMENTS) {
    map.set(t.slug, { ...map.get(t.slug), ...t, featured: true });
  }

  return sortEsportsTournaments([...map.values()]);
}

export const tournaments: EsportsTournament[] = buildTournaments();

function buildMatches(): EsportsMatch[] {
  const generated = fromGeneratedMatches();
  const genIds = new Set(generated.map((m) => m.id));
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
  const extra = [...bscMatches, ...manual2026].filter((m) => !genIds.has(m.id));
  return [...generated, ...extra].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export const matches: EsportsMatch[] = buildMatches();

export function getTournament(slug: string): EsportsTournament | undefined {
  return tournaments.find((t) => t.slug === slug);
}

export function searchTournaments(query: string, limit = 60): EsportsTournament[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return tournaments
      .filter((t) => t.featured || t.status !== "finished")
      .slice(0, limit);
  }
  return tournaments
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.slug.includes(q),
    )
    .slice(0, limit);
}

export function getFeaturedTournaments(limit = 24): EsportsTournament[] {
  return tournaments.filter((t) => t.featured).slice(0, limit);
}

/** S / A / B tier Liquipedia tournaments */
export function getTierBPlusTournaments(limit = 32): EsportsTournament[] {
  const statusOrder: Record<EsportsTournament["status"], number> = { live: 0, upcoming: 1, finished: 2 };
  return tournaments
    .filter((t) => t.tier != null && isTierBPlus(t))
    .sort((a, b) => {
      const sa = statusOrder[a.status] - statusOrder[b.status];
      if (sa !== 0) return sa;
      if (a.status === "finished") return b.endDate.localeCompare(a.endDate);
      return a.startDate.localeCompare(b.startDate);
    })
    .slice(0, limit);
}

export function getMatch(id: string): EsportsMatch | undefined {
  return matches.find((m) => m.id === id);
}

export function getMatchesByTournament(tournamentSlug: string): EsportsMatch[] {
  const alias = BSC_TOURNAMENT_ALIASES[tournamentSlug];
  const slugs = alias ? [tournamentSlug, alias] : [tournamentSlug];
  return matches.filter((m) => slugs.includes(m.tournamentSlug));
}

export function getLiveMatches(): EsportsMatch[] {
  return matches.filter((m) => m.status === "live");
}

export function getUpcomingMatches(): EsportsMatch[] {
  return [...matches]
    .filter((m) => m.status === "upcoming" || m.status === "live")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getTournamentParticipantSlugs(slug: string): string[] {
  const t = getTournament(slug);
  if (t?.participantSlugs?.length) return normalizeParticipantList(t.participantSlugs);
  return getTournamentParticipants(slug);
}

export function getRecentMatches(limit = 8): EsportsMatch[] {
  return [...matches]
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
  if (tab === "live") {
    pool = matches.filter((m) => m.status === "live");
  } else if (tab === "upcoming") {
    pool = matches.filter((m) => m.status === "upcoming");
  } else {
    pool = matches.filter((m) => m.status === "finished");
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
