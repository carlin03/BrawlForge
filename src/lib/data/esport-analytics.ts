import type { Region } from "@/lib/types";
import type { EsportsMatch } from "./esports-match-types";
import { getBsc2026TeamRegion } from "./bsc-2026-team-regions";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { isPublicScheduleMatch } from "./match-schedule-trust";
import { getActivePlayers } from "./players";
import { getTeamDisplayName } from "./team-display-resolve";
import { getTeam } from "./teams";

export type TeamEsportStats = {
  slug: string;
  name: string;
  tag: string;
  region: Region;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
};

export type EsportLeaderboard = {
  topWinRate: TeamEsportStats[];
  worstWinRate: TeamEsportStats[];
  mostWins: TeamEsportStats[];
  mostMatches: TeamEsportStats[];
};

export type EsportOverview = {
  teamCount: number;
  playerCount: number;
  matchCount: number;
  syncedFrom: "liquipedia" | "mixed";
  teams: TeamEsportStats[];
  leaderboards: EsportLeaderboard;
};

const MIN_WR_SAMPLE = 3;

function resolveTeamRegion(slug: string, matchRegion: Region): Region {
  return getTeam(slug)?.region ?? getBsc2026TeamRegion(slug) ?? matchRegion ?? "GLOBAL";
}

function toTeamStats(
  slug: string,
  wins: number,
  losses: number,
  region: Region,
): TeamEsportStats {
  const matches = wins + losses;
  const team = getTeam(slug);
  return {
    slug,
    name: team?.name ?? getTeamDisplayName(slug),
    tag: team?.tag ?? slug.slice(0, 3).toUpperCase(),
    region,
    wins,
    losses,
    matches,
    winRate: matches > 0 ? Math.round((wins / matches) * 1000) / 10 : 0,
  };
}

function buildLeaderboards(teams: TeamEsportStats[]): EsportLeaderboard {
  const wrEligible = teams.filter((t) => t.matches >= MIN_WR_SAMPLE);
  const byWr = [...wrEligible].sort((a, b) => b.winRate - a.winRate || b.matches - a.matches);
  const byWorst = [...wrEligible].sort((a, b) => a.winRate - b.winRate || b.matches - a.matches);
  const byWins = [...teams].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  const byMatches = [...teams].sort((a, b) => b.matches - a.matches || b.winRate - a.winRate);

  return {
    topWinRate: byWr.slice(0, 5),
    worstWinRate: byWorst.slice(0, 5),
    mostWins: byWins.slice(0, 5),
    mostMatches: byMatches.slice(0, 5),
  };
}

/** Estadísticas competitivas derivadas solo de partidos reales (Liquipedia/CMS). */
export function buildEsportAnalytics(pool: EsportsMatch[]): EsportOverview {
  const finished = pool.filter(
    (m) => isPublicScheduleMatch(m) && getEffectiveMatchStatus(m) === "finished",
  );

  const acc = new Map<string, { wins: number; losses: number; region: Region }>();

  for (const m of finished) {
    if (m.scoreA === m.scoreB) continue;
    const winA = m.scoreA > m.scoreB;

    for (const [slug, won] of [
      [m.teamASlug, winA],
      [m.teamBSlug, !winA],
    ] as const) {
      const region = resolveTeamRegion(slug, m.region);
      const row = acc.get(slug) ?? { wins: 0, losses: 0, region };
      if (won) row.wins += 1;
      else row.losses += 1;
      row.region = row.region === "GLOBAL" ? region : row.region;
      acc.set(slug, row);
    }
  }

  const teams = [...acc.entries()]
    .map(([slug, row]) => toTeamStats(slug, row.wins, row.losses, row.region))
    .sort((a, b) => b.matches - a.matches || b.winRate - a.winRate);

  const lpCount = finished.filter((m) => m.id.startsWith("lp-")).length;

  return {
    teamCount: teams.length,
    playerCount: getActivePlayers().length,
    matchCount: finished.length,
    syncedFrom: lpCount >= finished.length * 0.5 ? "liquipedia" : "mixed",
    teams,
    leaderboards: buildLeaderboards(teams),
  };
}

export function filterEsportTeamsByRegion(
  teams: TeamEsportStats[],
  region: Region | "all",
): TeamEsportStats[] {
  if (region === "all") return teams;
  return teams.filter((t) => t.region === region);
}

export type EsportSortKey = "matches" | "winRate" | "wins";

export function sortEsportTeams(
  teams: TeamEsportStats[],
  key: EsportSortKey,
  desc = true,
): TeamEsportStats[] {
  const mul = desc ? -1 : 1;
  return [...teams].sort((a, b) => {
    if (key === "matches") return mul * (a.matches - b.matches);
    if (key === "wins") return mul * (a.wins - b.wins);
    return mul * (a.winRate - b.winRate) || mul * (a.matches - b.matches);
  });
}
