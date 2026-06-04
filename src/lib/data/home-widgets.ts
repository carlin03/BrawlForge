import { getPlayer, getPlayersByTeam } from "./players";
import { getTeam } from "./teams";

function teamName(slug: string): string {
  return getTeam(slug)?.name ?? slug;
}
import { transferMarket, getTournamentFantasyProfile, DEFAULT_FANTASY_TOURNAMENT, getTournamentLeaderboard } from "./fantasy";
import { getFeaturedTournaments, getLiveMatches, getRecentMatches } from "./matches";
import { getPickRate, getFantasyRole } from "./fantasy-meta";
import { closedPredictions, openPredictions, userPredictorProfile } from "./predictions";
import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";

export interface RecentTransfer {
  playerSlug: string;
  type: "in" | "out";
  price: number;
  ago: string;
  username?: string;
}

export interface ActivityItem {
  id: string;
  type: "transfer" | "prediction" | "match" | "fantasy";
  text: string;
  ago: string;
  accent?: "gold" | "blue" | "red";
}

export interface TrendingPlayer {
  playerSlug: string;
  ign: string;
  teamSlug: string;
  price: number;
  priceChange: number;
  pickRate: number;
  role: string;
}

export interface TopPredictor {
  username: string;
  points: number;
  streak: number;
  accuracy: number;
  rankChange: number;
  avatarColor: string;
}

const TRANSFER_LOG: RecentTransfer[] = [
  { playerSlug: "moya", type: "in", price: 14.2, ago: "2m", username: "User123" },
  { playerSlug: "yoshi", type: "out", price: 12.8, ago: "18m", username: "SK_Elite" },
  { playerSlug: "lukii", type: "in", price: 11.5, ago: "1h", username: "ForgeManager" },
  { playerSlug: "boss", type: "in", price: 10.2, ago: "2h", username: "BC_Cup_King" },
  { playerSlug: "response", type: "out", price: 9.8, ago: "3h", username: "TribeFan_NA" },
  { playerSlug: "levi", type: "in", price: 8.4, ago: "5h", username: "ZetaWarrior" },
  { playerSlug: "moya", type: "in", price: 14.2, ago: "6h", username: "CR_Fan_Tokyo" },
];

export function getRecentTransfers(limit = 5): RecentTransfer[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  return TRANSFER_LOG.slice(0, limit);
}

export function getTrendingPlayers(limit = 5): TrendingPlayer[] {
  return [...transferMarket]
    .sort((a, b) => getPickRate(b.playerSlug) - getPickRate(a.playerSlug))
    .slice(0, limit)
    .map((m) => {
      const p = getPlayer(m.playerSlug)!;
      return {
        playerSlug: m.playerSlug,
        ign: p.ign,
        teamSlug: p.teamSlug ?? "",
        price: m.price,
        priceChange: m.priceChange,
        pickRate: getPickRate(m.playerSlug),
        role: getFantasyRole(m.playerSlug),
      };
    })
    .filter((t) => t.teamSlug);
}

export function getTopGainers(limit = 4) {
  return [...transferMarket]
    .filter((m) => m.priceChange > 0)
    .sort((a, b) => b.priceChange - a.priceChange)
    .slice(0, limit);
}

export function getTopLosers(limit = 4) {
  return [...transferMarket]
    .filter((m) => m.priceChange < 0)
    .sort((a, b) => a.priceChange - b.priceChange)
    .slice(0, limit);
}

export function getMvpOfWeek() {
  const top = [...transferMarket]
    .map((m) => ({ m, p: getPlayer(m.playerSlug) }))
    .filter((x) => x.p?.teamSlug)
    .sort((a, b) => (b.p!.fantasyPoints) - (a.p!.fantasyPoints))[0];
  if (!top?.p) return null;
  return {
    playerSlug: top.m.playerSlug,
    ign: top.p.ign,
    teamSlug: top.p.teamSlug!,
    points: top.p.fantasyPoints,
    price: top.m.price,
    role: getFantasyRole(top.m.playerSlug),
    ownership: top.p.fantasyOwnership,
  };
}

export function getCommunityStats() {
  const live = getLiveMatches().length;
  if (!SHOW_DEMO_SOCIAL) {
    return {
      activeManagers: 0,
      liveMatches: live,
      openVotes: openPredictions.length,
      transfersToday: 0,
      votesToday: 0,
      avgAccuracy: 0,
    };
  }
  const profile = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);
  const votesToday = openPredictions.reduce((sum, e) => sum + e.totalVotes, 0)
    + closedPredictions.slice(0, 6).reduce((sum, e) => sum + e.totalVotes, 0);
  return {
    activeManagers: profile.participants,
    liveMatches: live,
    openVotes: openPredictions.length,
    transfersToday: TRANSFER_LOG.length + 41,
    votesToday: Math.min(votesToday, 5247),
    avgAccuracy: userPredictorProfile.accuracy,
  };
}

export function getLiveActivity(limit = 12): ActivityItem[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  const topVote = openPredictions[0];
  const voteLine = topVote
    ? `${teamName(topVote.teamASlug)} alcanza ${topVote.pickAPct}% de votos`
    : "Nueva votación abierta en Brawl Cup";

  const items: ActivityItem[] = [
    { id: "a1", type: "transfer", text: "User123 fichó a Moya por 14.2M", ago: "2m", accent: "gold" },
    { id: "a2", type: "prediction", text: voteLine, ago: "4m", accent: "blue" },
    { id: "a3", type: "fantasy", text: "CR_Fan_Tokyo sube al #1 del ranking", ago: "6m", accent: "gold" },
    { id: "a4", type: "prediction", text: "5.247 usuarios votaron hoy", ago: "8m", accent: "blue" },
    { id: "a5", type: "fantasy", text: "ForgeManager +12 pts fantasy esta jornada", ago: "11m", accent: "gold" },
    { id: "a6", type: "transfer", text: "SK_Elite vendió a Yoshi por 12.8M", ago: "14m", accent: "gold" },
    { id: "a7", type: "prediction", text: `${userPredictorProfile.username} — racha de ${userPredictorProfile.streak} aciertos`, ago: "18m", accent: "blue" },
    { id: "a8", type: "match", text: "Semifinal Brawl Cup en directo", ago: "21m", accent: "red" },
    { id: "a9", type: "fantasy", text: "Moya +18 pts en la última ronda", ago: "25m", accent: "gold" },
    { id: "a10", type: "prediction", text: "VoteKing_2026 acierta y sube a #1 predictors", ago: "31m", accent: "blue" },
    { id: "a11", type: "transfer", text: "BC_Cup_King fichó a Boss por 10.2M", ago: "38m", accent: "gold" },
    { id: "a12", type: "fantasy", text: "Crazy Raccoon lidera propiedad fantasy del evento", ago: "45m", accent: "gold" },
  ];
  return items.slice(0, limit);
}

export function getHotMarketPick() {
  const hot = [...transferMarket].sort((a, b) => getPickRate(b.playerSlug) - getPickRate(a.playerSlug))[0];
  if (!hot) return null;
  const p = getPlayer(hot.playerSlug);
  if (!p) return null;
  return {
    playerSlug: hot.playerSlug,
    ign: p.ign,
    pickRate: getPickRate(hot.playerSlug),
    priceChange: hot.priceChange,
    price: hot.price,
  };
}

export function getUpcomingTournamentsWidget(limit = 4) {
  return getFeaturedTournaments(limit)
    .filter((t) => t.status !== "finished")
    .slice(0, limit);
}

export function getTopPredictors(limit = 5): TopPredictor[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  return [
    { username: "VoteKing_2026", points: 4120, streak: 9, accuracy: 78, rankChange: 2, avatarColor: "#ffc82e" },
    { username: "BracketMaster", points: 3890, streak: 6, accuracy: 74, rankChange: -1, avatarColor: "#5eb8ff" },
    { username: userPredictorProfile.username, points: userPredictorProfile.totalPoints, streak: userPredictorProfile.streak, accuracy: userPredictorProfile.accuracy, rankChange: 3, avatarColor: "#ff3d5a" },
    { username: "PickEmPro", points: 2100, streak: 3, accuracy: 71, rankChange: 0, avatarColor: "#2ecc71" },
    { username: "BSC_Oracle", points: 1980, streak: 5, accuracy: 69, rankChange: 5, avatarColor: "#9b59b6" },
  ].slice(0, limit);
}

export function getRecentCorrectPicks(limit = 4) {
  return closedPredictions
    .filter((e) => e.correctPick && e.userPick === e.correctPick)
    .slice(0, limit);
}

export interface MostVotedTeam {
  teamSlug: string;
  votePct: number;
  totalVotes: number;
}

export function getMostVotedTeams(limit = 5): MostVotedTeam[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  const best = new Map<string, MostVotedTeam>();
  for (const e of openPredictions) {
    for (const [teamSlug, votePct] of [[e.teamASlug, e.pickAPct], [e.teamBSlug, e.pickBPct]] as const) {
      const prev = best.get(teamSlug);
      if (!prev || votePct > prev.votePct) {
        best.set(teamSlug, { teamSlug, votePct, totalVotes: e.totalVotes });
      }
    }
  }
  return [...best.values()].sort((a, b) => b.votePct - a.votePct).slice(0, limit);
}

export interface TransferTrend {
  playerSlug: string;
  count: number;
}

export function getMostTransferredIn(limit = 4): TransferTrend[] {
  const counts = new Map<string, number>();
  for (const t of TRANSFER_LOG.filter((x) => x.type === "in")) {
    counts.set(t.playerSlug, (counts.get(t.playerSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([playerSlug, count]) => ({ playerSlug, count }));
}

export function getMostTransferredOut(limit = 4): TransferTrend[] {
  const counts = new Map<string, number>();
  for (const t of TRANSFER_LOG.filter((x) => x.type === "out")) {
    counts.set(t.playerSlug, (counts.get(t.playerSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([playerSlug, count]) => ({ playerSlug, count }));
}

export interface CaptainPick {
  playerSlug: string;
  ign: string;
  captainPct: number;
  pickRate: number;
}

export function getCaptainPopularity(limit = 5): CaptainPick[] {
  return getTrendingPlayers(limit * 2)
    .map((t, i) => ({
      playerSlug: t.playerSlug,
      ign: t.ign,
      captainPct: Math.min(94, Math.round(t.pickRate * 0.58 + 8 + i * 2)),
      pickRate: t.pickRate,
    }))
    .slice(0, limit);
}

export function getFantasyActivity(limit = 8): ActivityItem[] {
  return getLiveActivity(16).filter((a) => a.type === "fantasy" || a.type === "transfer").slice(0, limit);
}

export interface VotingActivity {
  id: string;
  text: string;
  pct: number;
  ago: string;
}

export function getPredictionVotingActivity(limit = 6): VotingActivity[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  return openPredictions.slice(0, limit).map((e, i) => {
    const leader = e.pickAPct >= e.pickBPct ? teamName(e.teamASlug) : teamName(e.teamBSlug);
    const pct = Math.max(e.pickAPct, e.pickBPct);
    const newVotes = Math.round(e.totalVotes * (0.02 + (i % 4) * 0.008));
    return {
      id: `vote-${e.id}`,
      text: `${newVotes} votos → ${leader} (${pct}%)`,
      pct,
      ago: `${1 + i * 3}m`,
    };
  });
}

export interface AccuracyPoint {
  label: string;
  pct: number;
}

export function getAccuracyTrend(): AccuracyPoint[] {
  const base = userPredictorProfile.accuracy;
  return [
    { label: "Ene", pct: Math.max(45, base - 10) },
    { label: "Feb", pct: Math.max(48, base - 6) },
    { label: "Mar", pct: Math.max(50, base - 3) },
    { label: "Abr", pct: base - 1 },
    { label: "May", pct: base },
  ];
}

export interface FantasyPointGain {
  username: string;
  points: number;
  roundPoints: number;
  captainIgn: string;
}

export function getRecentFantasyPoints(limit = 5): FantasyPointGain[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  return getTournamentLeaderboard(DEFAULT_FANTASY_TOURNAMENT)
    .filter((e) => e.roundPoints > 0)
    .slice(0, limit)
    .map((e) => ({
      username: e.username,
      points: e.points,
      roundPoints: e.roundPoints,
      captainIgn: e.captainIgn,
    }));
}

export interface TeamPlatformMeta {
  fantasyPick: number;
  votePct: number;
  trending: "hot" | "rising" | "stable";
  recentResult: string | null;
}

export function getTeamPlatformMeta(teamSlug: string): TeamPlatformMeta {
  const roster = getPlayersByTeam(teamSlug);
  const fantasyPick = roster.length
    ? Math.round(roster.reduce((s, p) => s + getPickRate(p.slug), 0) / roster.length)
    : 0;

  let votePct = 0;
  for (const e of openPredictions) {
    if (e.teamASlug === teamSlug) votePct = Math.max(votePct, e.pickAPct);
    if (e.teamBSlug === teamSlug) votePct = Math.max(votePct, e.pickBPct);
  }

  const recent = getRecentMatches(30).find(
    (m) => m.teamASlug === teamSlug || m.teamBSlug === teamSlug,
  );
  let recentResult: string | null = null;
  if (recent) {
    const isA = recent.teamASlug === teamSlug;
    const won = isA ? recent.scoreA > recent.scoreB : recent.scoreB > recent.scoreA;
    const opp = isA ? teamName(recent.teamBSlug) : teamName(recent.teamASlug);
    recentResult = `${won ? "W" : "L"} vs ${opp.split(" ").slice(-1)[0]}`;
  }

  const trending: TeamPlatformMeta["trending"] =
    fantasyPick >= 55 ? "hot" : votePct >= 60 ? "rising" : "stable";

  return { fantasyPick, votePct, trending, recentResult };
}

export function getStreakLeaders(limit = 5) {
  return getTopPredictors(limit).sort((a, b) => b.streak - a.streak);
}
