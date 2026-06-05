import type { Region } from "@/lib/types";
import type { EsportsMatch } from "./esports-match-types";
import { getBsc2026TeamRegion } from "./bsc-2026-team-regions";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { parseMatchMeta } from "./match-meta";
import { hasFinishedSeriesResults } from "./finish-match-results-enrich";
import { isPublicScheduleMatch, isPublicUpcomingCalendarMatch } from "./match-schedule-trust";
import { isCredibleFinishedResult } from "./public-calendar-matches";
import { getActivePlayers } from "./players";
import { getTeamDisplayName } from "./team-display-resolve";
import { getTeam } from "./teams";
import { getTournament } from "./matches";

export type TeamEsportStats = {
  slug: string;
  name: string;
  tag: string;
  region: Region;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
  form: ("W" | "L")[];
  mapWins: number;
  mapLosses: number;
};

export type EsportLeaderboard = {
  topWinRate: TeamEsportStats[];
  worstWinRate: TeamEsportStats[];
  mostWins: TeamEsportStats[];
  mostMatches: TeamEsportStats[];
};

export type BrawlerEsportStat = {
  name: string;
  picks: number;
  bans: number;
  mvpMentions: number;
  mapWins: number;
  winRate: number;
};

export type MapEsportStat = {
  name: string;
  plays: number;
  winsA: number;
  winsB: number;
};

export type TournamentEsportStat = {
  slug: string;
  name: string;
  region: Region;
  finished: number;
  upcoming: number;
  total: number;
};

export type EsportOverview = {
  teamCount: number;
  playerCount: number;
  matchCount: number;
  upcomingCount: number;
  liveCount: number;
  matchesWithMeta: number;
  mapDecisionsTracked: number;
  syncedFrom: "liquipedia" | "mixed";
  teams: TeamEsportStats[];
  leaderboards: EsportLeaderboard;
  topBrawlers: BrawlerEsportStat[];
  topMaps: MapEsportStat[];
  activeTournaments: TournamentEsportStat[];
  regionalMatches: Record<Region, number>;
};

const MIN_WR_SAMPLE = 3;

function resolveTeamRegion(slug: string, matchRegion: Region): Region {
  return getTeam(slug)?.region ?? getBsc2026TeamRegion(slug) ?? matchRegion ?? "GLOBAL";
}

function toTeamStats(
  slug: string,
  row: {
    wins: number;
    losses: number;
    region: Region;
    form: ("W" | "L")[];
    mapWins: number;
    mapLosses: number;
  },
): TeamEsportStats {
  const matches = row.wins + row.losses;
  const team = getTeam(slug);
  return {
    slug,
    name: team?.name ?? getTeamDisplayName(slug),
    tag: team?.tag ?? slug.slice(0, 3).toUpperCase(),
    region: row.region,
    wins: row.wins,
    losses: row.losses,
    matches,
    winRate: matches > 0 ? Math.round((row.wins / matches) * 1000) / 10 : 0,
    form: row.form.slice(0, 5),
    mapWins: row.mapWins,
    mapLosses: row.mapLosses,
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

function bumpBrawler(
  acc: Map<string, { picks: number; bans: number; mvpMentions: number; mapWins: number }>,
  name: string,
  field: "picks" | "bans" | "mvpMentions" | "mapWins",
): void {
  const key = name.trim();
  if (!key) return;
  const row = acc.get(key) ?? { picks: 0, bans: 0, mvpMentions: 0, mapWins: 0 };
  row[field] += 1;
  acc.set(key, row);
}

/** Estadísticas competitivas derivadas de partidos reales (BSC + Liquipedia + CMS). */
export function buildEsportAnalytics(pool: EsportsMatch[]): EsportOverview {
  const finished = pool.filter(
    (m) =>
      isPublicScheduleMatch(m) &&
      getEffectiveMatchStatus(m) === "finished" &&
      isCredibleFinishedResult(m),
  );

  const upcoming = pool.filter(
    (m) => isPublicUpcomingCalendarMatch(m) && getEffectiveMatchStatus(m) === "upcoming",
  );
  const live = pool.filter(
    (m) => isPublicUpcomingCalendarMatch(m) && getEffectiveMatchStatus(m) === "live",
  );

  const acc = new Map<
    string,
    {
      wins: number;
      losses: number;
      region: Region;
      form: ("W" | "L")[];
      mapWins: number;
      mapLosses: number;
    }
  >();

  const sortedFinished = [...finished].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  for (const m of sortedFinished) {
    if (m.scoreA === m.scoreB) continue;
    const winA = m.scoreA > m.scoreB;

    for (const [slug, won] of [
      [m.teamASlug, winA],
      [m.teamBSlug, !winA],
    ] as const) {
      const region = resolveTeamRegion(slug, m.region);
      const row = acc.get(slug) ?? {
        wins: 0,
        losses: 0,
        region,
        form: [],
        mapWins: 0,
        mapLosses: 0,
      };
      if (won) row.wins += 1;
      else row.losses += 1;
      if (row.form.length < 5) row.form.push(won ? "W" : "L");
      row.region = row.region === "GLOBAL" ? region : row.region;
      acc.set(slug, row);
    }
  }

  const brawlerAcc = new Map<
    string,
    { picks: number; bans: number; mvpMentions: number; mapWins: number }
  >();
  const mapAcc = new Map<string, { plays: number; winsA: number; winsB: number }>();
  let matchesWithMeta = 0;
  let mapDecisionsTracked = 0;

  for (const m of finished) {
    const meta = parseMatchMeta(m.meta);
    if (!hasFinishedSeriesResults(meta)) continue;
    matchesWithMeta += 1;

    const adv = meta.advanced_predictions;
    if (adv?.most_used_brawler) bumpBrawler(brawlerAcc, adv.most_used_brawler, "mvpMentions");
    if (adv?.match_mvp_brawler) bumpBrawler(brawlerAcc, adv.match_mvp_brawler, "mvpMentions");
    if (adv?.most_banned_brawler) bumpBrawler(brawlerAcc, adv.most_banned_brawler, "bans");

    for (const row of Object.values(adv?.map_results ?? {})) {
      mapDecisionsTracked += 1;
      const winnerSide = row.winner;
      for (const b of row.picks_a ?? []) {
        bumpBrawler(brawlerAcc, b, "picks");
        if (winnerSide === "A") bumpBrawler(brawlerAcc, b, "mapWins");
      }
      for (const b of row.picks_b ?? []) {
        bumpBrawler(brawlerAcc, b, "picks");
        if (winnerSide === "B") bumpBrawler(brawlerAcc, b, "mapWins");
      }
      for (const b of row.central_bans ?? []) bumpBrawler(brawlerAcc, b, "bans");
      for (const b of row.team_bans_a ?? []) bumpBrawler(brawlerAcc, b, "bans");
      for (const b of row.team_bans_b ?? []) bumpBrawler(brawlerAcc, b, "bans");
    }

    for (const entry of meta.maps?.played ?? []) {
      if (entry.name) {
        const prev = mapAcc.get(entry.name) ?? { plays: 0, winsA: 0, winsB: 0 };
        prev.plays += 1;
        mapAcc.set(entry.name, prev);
      }
    }

    for (const [slug, won] of [
      [m.teamASlug, m.scoreA > m.scoreB],
      [m.teamBSlug, m.scoreB > m.scoreA],
    ] as const) {
      const row = acc.get(slug);
      if (!row) continue;
      const metaMaps = Object.values(adv?.map_results ?? {});
      let mw = 0;
      let ml = 0;
      for (const mr of metaMaps) {
        const side = m.teamASlug === slug ? "A" : "B";
        if (mr.winner === side) mw += 1;
        else if (mr.winner) ml += 1;
      }
      if (mw + ml > 0) {
        row.mapWins += mw;
        row.mapLosses += ml;
        acc.set(slug, row);
      }
    }
  }

  const teams = [...acc.entries()]
    .map(([slug, row]) => toTeamStats(slug, row))
    .sort((a, b) => b.matches - a.matches || b.winRate - a.winRate);

  const lpCount = finished.filter((m) => m.id.startsWith("lp-")).length;

  const topBrawlers = [...brawlerAcc.entries()]
    .map(([name, row]) => ({
      name,
      picks: row.picks,
      bans: row.bans,
      mvpMentions: row.mvpMentions,
      mapWins: row.mapWins,
      winRate:
        row.picks > 0 ? Math.round((row.mapWins / row.picks) * 1000) / 10 : 0,
    }))
    .sort(
      (a, b) =>
        b.picks + b.mvpMentions * 2 + b.mapWins - (a.picks + a.mvpMentions * 2 + a.mapWins),
    )
    .slice(0, 14);

  const topMaps = [...mapAcc.entries()]
    .map(([name, row]) => ({ name, plays: row.plays, winsA: row.winsA, winsB: row.winsB }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 12);

  const tourAcc = new Map<string, { finished: number; upcoming: number; region: Region }>();
  for (const m of [...finished, ...upcoming, ...live]) {
    const row = tourAcc.get(m.tournamentSlug) ?? {
      finished: 0,
      upcoming: 0,
      region: m.region,
    };
    const st = getEffectiveMatchStatus(m);
    if (st === "finished") row.finished += 1;
    else row.upcoming += 1;
    tourAcc.set(m.tournamentSlug, row);
  }

  const activeTournaments = [...tourAcc.entries()]
    .map(([slug, row]) => ({
      slug,
      name: getTournament(slug)?.shortName ?? slugToTournamentName(slug),
      region: row.region,
      finished: row.finished,
      upcoming: row.upcoming,
      total: row.finished + row.upcoming,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 14);

  const regionalMatches: Record<Region, number> = {
    EMEA: 0,
    NA: 0,
    SA: 0,
    EA: 0,
    SEA: 0,
    GLOBAL: 0,
  };
  for (const m of finished) {
    regionalMatches[m.region] = (regionalMatches[m.region] ?? 0) + 1;
  }

  return {
    teamCount: teams.length,
    playerCount: getActivePlayers().length,
    matchCount: finished.length,
    upcomingCount: upcoming.length,
    liveCount: live.length,
    matchesWithMeta,
    mapDecisionsTracked,
    syncedFrom: lpCount >= finished.length * 0.35 ? "liquipedia" : "mixed",
    teams,
    leaderboards: buildLeaderboards(teams),
    topBrawlers,
    topMaps,
    activeTournaments,
    regionalMatches,
  };
}

function slugToTournamentName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function filterEsportTeamsByRegion(
  teams: TeamEsportStats[],
  region: Region | "all",
): TeamEsportStats[] {
  if (region === "all") return teams;
  return teams.filter((t) => t.region === region);
}

export type EsportSortKey = "matches" | "winRate" | "wins" | "mapWins";

export function sortEsportTeams(
  teams: TeamEsportStats[],
  key: EsportSortKey,
  desc = true,
): TeamEsportStats[] {
  const mul = desc ? -1 : 1;
  return [...teams].sort((a, b) => {
    if (key === "matches") return mul * (a.matches - b.matches);
    if (key === "wins") return mul * (a.wins - b.wins);
    if (key === "mapWins") return mul * (a.mapWins - b.mapWins);
    return mul * (a.winRate - b.winRate) || mul * (a.matches - b.matches);
  });
}
