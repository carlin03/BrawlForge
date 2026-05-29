import { getPlayer, getTeam, getPlayersByTeam, teams } from "@/lib/data";
import { matches, type EsportsMatch } from "@/lib/data/matches";
import type { Region } from "@/lib/types";

export type TeamComputedStats = {
  totalMatches: number;
  finishedMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: ("W" | "L")[];
  lastMatchDate: string | null;
  tournamentsPlayed: number;
  avgFantasyPts: number;
  avgRating: number;
  topPlayer: { slug: string; ign: string; fantasyPoints: number } | null;
  regionalRank: number | null;
  totalTeamsInRegion: number;
};

export type PlayerComputedStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  form: ("W" | "L")[];
  formWins: number;
  peakRating: number;
  marketTier: "legend" | "epic" | "rare" | "common";
  teammatesCount: number;
  rosterRank: number | null;
  rosterSize: number;
  tournamentsPlayed: number;
  bestAchievement: string | null;
  mvpRate: number;
  globalRankEstimate: number | null;
};

export type RosterPlayerStats = {
  slug: string;
  ign: string;
  country: string | null;
  role: string;
  rating: number;
  fantasyPoints: number;
  winRate: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  rosterRank: number;
  isCaptain: boolean;
  star: boolean;
  form: ("W" | "L")[];
  status: string;
};

function teamFinishedMatches(teamSlug: string) {
  return matches
    .filter((m) => m.status === "finished" && (m.teamASlug === teamSlug || m.teamBSlug === teamSlug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function matchWon(m: EsportsMatch, teamSlug: string) {
  const isA = m.teamASlug === teamSlug;
  return isA ? m.scoreA > m.scoreB : m.scoreB > m.scoreA;
}

export function getRegionalRank(teamSlug: string, region: Region, globalRank: number | null) {
  const inRegion = teams
    .filter((t) => t.region === region && t.rank > 0)
    .sort((a, b) => a.rank - b.rank);
  const idx = inRegion.findIndex((t) => t.slug === teamSlug);
  return {
    regionalRank: idx >= 0 ? idx + 1 : globalRank,
    totalInRegion: inRegion.length || teams.filter((t) => t.region === region).length,
  };
}

export function getTeamComputedStats(teamSlug: string, rosterSlugs: string[]): TeamComputedStats {
  const team = getTeam(teamSlug);
  const teamMatches = matches.filter((m) => m.teamASlug === teamSlug || m.teamBSlug === teamSlug);
  const finished = teamFinishedMatches(teamSlug);
  let wins = 0;
  const recentForm: ("W" | "L")[] = [];

  for (const m of finished.slice(0, 10)) {
    const won = matchWon(m, teamSlug);
    if (won) wins++;
    recentForm.push(won ? "W" : "L");
  }

  const tourSlugs = new Set(teamMatches.map((m) => m.tournamentSlug));
  const rosterPlayers = rosterSlugs.map((s) => getPlayer(s)).filter(Boolean);
  const avgFantasyPts = rosterPlayers.length
    ? Math.round(rosterPlayers.reduce((s, p) => s + p!.fantasyPoints, 0) / rosterPlayers.length)
    : 0;
  const avgRating = rosterPlayers.length
    ? rosterPlayers.reduce((s, p) => s + p!.rating, 0) / rosterPlayers.length
    : 0;
  const top = [...rosterPlayers].sort((a, b) => b!.fantasyPoints - a!.fantasyPoints)[0];
  const { regionalRank, totalInRegion } = getRegionalRank(
    teamSlug,
    team?.region ?? "GLOBAL",
    team?.rank ?? null,
  );

  return {
    totalMatches: teamMatches.length,
    finishedMatches: finished.length,
    wins,
    losses: finished.length - wins,
    winRate: finished.length ? Math.round((wins / finished.length) * 100) : 0,
    recentForm,
    lastMatchDate: teamMatches[0]?.date ?? null,
    tournamentsPlayed: tourSlugs.size,
    avgFantasyPts,
    avgRating,
    topPlayer: top ? { slug: top.slug, ign: top.ign, fantasyPoints: top.fantasyPoints } : null,
    regionalRank,
    totalTeamsInRegion: totalInRegion,
  };
}

export function getTeamNextOrLiveMatch(teamSlug: string): EsportsMatch | null {
  const live = matches.find(
    (m) => m.status === "live" && (m.teamASlug === teamSlug || m.teamBSlug === teamSlug),
  );
  if (live) return live;
  const upcoming = matches
    .filter((m) => m.status === "upcoming" && (m.teamASlug === teamSlug || m.teamBSlug === teamSlug))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] ?? null;
}

export function getRosterPlayerStats(
  teamSlug: string,
  rosterSlugs: string[],
  formByPlayer?: Map<string, ("W" | "L")[]>,
  playerMeta?: Map<string, { country?: string | null; isCaptain?: boolean }>,
): RosterPlayerStats[] {
  const finished = teamFinishedMatches(teamSlug);
  const teamWinRate = finished.length
    ? Math.round(
        (finished.filter((m) => matchWon(m, teamSlug)).length / finished.length) * 100,
      )
    : 0;
  const matchesPlayed = finished.length;

  const sorted = rosterSlugs
    .map((slug) => getPlayer(slug))
    .filter(Boolean)
    .sort((a, b) => b!.fantasyPoints - a!.fantasyPoints);

  return sorted.map((p, i) => {
    const form = formByPlayer?.get(p!.slug) ?? [];
    const formWins = form.filter((f) => f === "W").length;
    const wr = form.length ? Math.round((formWins / form.length) * 100) : teamWinRate;
    const meta = playerMeta?.get(p!.slug);
    return {
      slug: p!.slug,
      ign: p!.ign,
      country: meta?.country ?? getTeam(teamSlug)?.country ?? null,
      role: p!.role,
      rating: p!.rating,
      fantasyPoints: p!.fantasyPoints,
      winRate: wr,
      matchesPlayed,
      wins: Math.round((wr / 100) * matchesPlayed),
      losses: matchesPlayed - Math.round((wr / 100) * matchesPlayed),
      rosterRank: i + 1,
      isCaptain: meta?.isCaptain ?? false,
      star: i === 0,
      form,
      status: p!.status,
    };
  });
}

export function getPlayerComputedStats(
  playerSlug: string,
  teamSlug?: string,
  marketForm?: ("W" | "L")[],
  achievements?: { place: string; tournament: string }[],
): PlayerComputedStats {
  const p = getPlayer(playerSlug);
  const rating = p?.rating ?? 1;
  const pts = p?.fantasyPoints ?? 70;
  let marketTier: PlayerComputedStats["marketTier"] = "common";
  if (rating >= 1.2 || pts >= 85) marketTier = "legend";
  else if (rating >= 1.12 || pts >= 75) marketTier = "epic";
  else if (rating >= 1.05 || pts >= 65) marketTier = "rare";

  const mates = teamSlug
    ? getPlayersByTeam(teamSlug).filter((pl) => pl.status === "active")
    : [];
  const rosterRank = teamSlug
    ? [...mates].sort((a, b) => b.fantasyPoints - a.fantasyPoints).findIndex((m) => m.slug === playerSlug) + 1
    : null;

  const form = marketForm ?? [];
  const formWins = form.filter((f) => f === "W").length;

  let matchesPlayed = 0;
  let wins = 0;
  let losses = 0;
  let tournamentsPlayed = 0;
  if (teamSlug) {
    const fin = teamFinishedMatches(teamSlug);
    matchesPlayed = fin.length;
    wins = fin.filter((m) => matchWon(m, teamSlug)).length;
    losses = matchesPlayed - wins;
    tournamentsPlayed = new Set(
      matches
        .filter((m) => m.teamASlug === teamSlug || m.teamBSlug === teamSlug)
        .map((m) => m.tournamentSlug),
    ).size;
  }

  const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : form.length ? Math.round((formWins / form.length) * 100) : 0;
  const mvpRate = form.length ? Math.round((formWins / form.length) * 100) : Math.min(100, Math.round((rating - 1) * 80 + pts / 2));

  const bestAchievement =
    achievements?.find((a) => a.place.toLowerCase().includes("1") || a.place.toLowerCase().includes("campe"))?.tournament ??
    achievements?.[0]?.tournament ??
    null;

  const globalRankEstimate = p ? Math.max(1, Math.round((2 - p.rating) * 120 + (100 - p.fantasyPoints))) : null;

  return {
    matchesPlayed,
    wins,
    losses,
    winRate,
    form,
    formWins,
    peakRating: rating,
    marketTier,
    teammatesCount: mates.filter((m) => m.slug !== playerSlug).length,
    rosterRank: rosterRank && rosterRank > 0 ? rosterRank : null,
    rosterSize: mates.length,
    tournamentsPlayed,
    bestAchievement,
    mvpRate,
    globalRankEstimate,
  };
}

export function getPlayerMatchHistory(teamSlug: string, limit = 8) {
  return teamFinishedMatches(teamSlug).slice(0, limit);
}
