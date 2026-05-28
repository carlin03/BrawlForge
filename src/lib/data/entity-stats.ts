import { getPlayer, getTeam, getPlayersByTeam } from "@/lib/data";
import { matches } from "@/lib/data/matches";

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
};

export type PlayerComputedStats = {
  matchesAsRoster: number;
  winsInForm: number;
  formLength: number;
  peakRating: number;
  marketTier: "legend" | "epic" | "rare" | "common";
  teammatesCount: number;
};

export function getTeamComputedStats(teamSlug: string, rosterSlugs: string[]): TeamComputedStats {
  const teamMatches = matches.filter((m) => m.teamASlug === teamSlug || m.teamBSlug === teamSlug);
  const finished = teamMatches.filter((m) => m.status === "finished");
  let wins = 0;
  const recentForm: ("W" | "L")[] = [];

  for (const m of finished.slice(0, 8)) {
    const isA = m.teamASlug === teamSlug;
    const won = isA ? m.scoreA > m.scoreB : m.scoreB > m.scoreA;
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
  const top = rosterPlayers.sort((a, b) => b!.fantasyPoints - a!.fantasyPoints)[0];

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
  };
}

export function getPlayerComputedStats(playerSlug: string, teamSlug?: string): PlayerComputedStats {
  const p = getPlayer(playerSlug);
  const rating = p?.rating ?? 1;
  const pts = p?.fantasyPoints ?? 70;
  let marketTier: PlayerComputedStats["marketTier"] = "common";
  if (rating >= 1.2 || pts >= 85) marketTier = "legend";
  else if (rating >= 1.12 || pts >= 75) marketTier = "epic";
  else if (rating >= 1.05 || pts >= 65) marketTier = "rare";

  const mates = teamSlug
    ? getPlayersByTeam(teamSlug).filter((p) => p.slug !== playerSlug && p.status === "active").length
    : 0;

  return {
    matchesAsRoster: 0,
    winsInForm: 0,
    formLength: 0,
    peakRating: rating,
    marketTier,
    teammatesCount: mates,
  };
}

export function getPlayerMatchHistory(playerSlug: string, teamSlug: string, limit = 6) {
  return matches
    .filter(
      (m) =>
        m.status === "finished" &&
        (m.teamASlug === teamSlug || m.teamBSlug === teamSlug),
    )
    .slice(0, limit);
}
