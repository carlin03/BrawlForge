import { getPlayer } from "./players";
import { getTeam } from "./teams";
import { getTournament } from "./matches";
import { getTournamentStats } from "./tournament-stats";

export interface TournamentMVP {
  playerSlug: string;
  ign: string;
  teamSlug: string;
  stat: string;
  value: string;
}

export interface MapStat {
  map: string;
  plays: number;
  winRate: number;
}

export interface BanStat {
  brawler: string;
  bans: number;
  pct: number;
}

export interface FantasyPickStat {
  playerSlug: string;
  pickRate: number;
  avgPoints: number;
}

export interface StandingRow {
  rank: number;
  teamSlug: string;
  w: number;
  l: number;
  diff: string;
}

export interface TournamentHubData {
  slug: string;
  mvps: TournamentMVP[];
  maps: MapStat[];
  bans: BanStat[];
  fantasyPicks: FantasyPickStat[];
  standings: StandingRow[];
  scheduleNote: string;
  prizeBreakdown: { place: string; prize: string }[];
  regions: string[];
}

const HUB: Record<string, TournamentHubData> = {
  "world-finals-2026": {
    slug: "world-finals-2026",
    scheduleNote: "Playoffs · Bo5 · Berlín · 28 Nov – 1 Dic 2026",
    regions: ["Global", "EMEA", "NA", "SA", "EA"],
    prizeBreakdown: [
      { place: "1º", prize: "$400,000" },
      { place: "2º", prize: "$200,000" },
      { place: "3º–4º", prize: "$80,000" },
      { place: "5º–8º", prize: "$30,000" },
      { place: "9º–12º", prize: "$17,000" },
    ],
    standings: [
      { rank: 1, teamSlug: "crazy-raccoon", w: 0, l: 0, diff: "—" },
      { rank: 2, teamSlug: "sk-gaming", w: 0, l: 0, diff: "—" },
      { rank: 3, teamSlug: "hmble", w: 0, l: 0, diff: "—" },
      { rank: 4, teamSlug: "tribe-gaming", w: 0, l: 0, diff: "—" },
    ],
    mvps: [
      { playerSlug: "moya", ign: "Moya", teamSlug: "crazy-raccoon", stat: "K/D", value: "2.4" },
      { playerSlug: "yoshi", ign: "Yoshi", teamSlug: "sk-gaming", stat: "Sets ganados", value: "18" },
      { playerSlug: "lukii", ign: "Lukii", teamSlug: "hmble", stat: "Objetivos", value: "47" },
    ],
    maps: [
      { map: "Hot Zone", plays: 42, winRate: 58 },
      { map: "Bounty", plays: 38, winRate: 52 },
      { map: "Knockout", plays: 35, winRate: 55 },
      { map: "Gem Grab", plays: 31, winRate: 49 },
      { map: "Heist", plays: 24, winRate: 61 },
    ],
    bans: [
      { brawler: "Cordelius", bans: 89, pct: 34 },
      { brawler: "Kit", bans: 72, pct: 28 },
      { brawler: "Mico", bans: 58, pct: 22 },
      { brawler: "Surge", bans: 41, pct: 16 },
    ],
    fantasyPicks: [
      { playerSlug: "moya", pickRate: 72, avgPoints: 24 },
      { playerSlug: "yoshi", pickRate: 68, avgPoints: 22 },
      { playerSlug: "lukii", pickRate: 58, avgPoints: 19 },
      { playerSlug: "tensai", pickRate: 54, avgPoints: 18 },
    ],
  },
  "bsc-2026-brawl-cup": {
    slug: "bsc-2026-brawl-cup",
    scheduleNote: "Grupos + Playoffs · Bo3 · Berlín · 15–17 May 2026",
    regions: ["Global"],
    prizeBreakdown: [
      { place: "1º", prize: "$200,000" },
      { place: "2º", prize: "$100,000" },
      { place: "3º–4º", prize: "$40,000" },
      { place: "5º–8º", prize: "$5,000" },
    ],
    standings: [
      { rank: 1, teamSlug: "crazy-raccoon", w: 5, l: 1, diff: "+8" },
      { rank: 2, teamSlug: "hmble", w: 4, l: 2, diff: "+4" },
      { rank: 3, teamSlug: "zeta-division", w: 4, l: 2, diff: "+2" },
      { rank: 4, teamSlug: "fut-esports", w: 3, l: 3, diff: "0" },
    ],
    mvps: [
      { playerSlug: "moya", ign: "Moya", teamSlug: "crazy-raccoon", stat: "MVP final", value: "★" },
      { playerSlug: "boss", ign: "BosS", teamSlug: "hmble", stat: "Racha", value: "4W" },
      { playerSlug: "levi", ign: "Levi", teamSlug: "zeta-division", stat: "Eliminaciones", value: "156" },
    ],
    maps: [
      { map: "Bounty", plays: 28, winRate: 54 },
      { map: "Hot Zone", plays: 26, winRate: 51 },
      { map: "Knockout", plays: 22, winRate: 57 },
      { map: "Gem Grab", plays: 18, winRate: 48 },
    ],
    bans: [
      { brawler: "Kit", bans: 44, pct: 31 },
      { brawler: "Cordelius", bans: 38, pct: 27 },
      { brawler: "Charlie", bans: 32, pct: 23 },
    ],
    fantasyPicks: [
      { playerSlug: "moya", pickRate: 78, avgPoints: 28 },
      { playerSlug: "boss", pickRate: 62, avgPoints: 21 },
      { playerSlug: "levi", pickRate: 55, avgPoints: 20 },
      { playerSlug: "bobby", pickRate: 41, avgPoints: 17 },
    ],
  },
};

function defaultHub(slug: string): TournamentHubData {
  const t = getTournament(slug);
  const stats = getTournamentStats(slug);
  const topTeams = stats.standings.slice(0, 8);
  const topPlayers = stats.participantSlugs
    .flatMap((ts) => {
      const team = getTeam(ts);
      return team?.roster?.slice(0, 1).map((p) => ({ p, ts })) ?? [];
    })
    .slice(0, 4);

  return {
    slug,
    scheduleNote: t
      ? `${t.stage} · ${t.location} · ${t.startDate}${t.endDate !== t.startDate ? ` — ${t.endDate}` : ""}`
      : "Calendario del torneo",
    regions: t ? [t.region] : ["GLOBAL"],
    prizeBreakdown: stats.prizeBreakdown,
    standings: topTeams,
    mvps: topPlayers.map(({ p, ts }, i) => {
      const player = getPlayer(p);
      return {
        playerSlug: p,
        ign: player?.ign ?? p,
        teamSlug: ts,
        stat: i === 0 ? "Top rated" : "Participante",
        value: player ? player.rating.toFixed(2) : "—",
      };
    }),
    maps: stats.totalMatches
      ? [
          { map: "Hot Zone", plays: Math.max(4, Math.round(stats.finishedMatches * 0.35)), winRate: 52 },
          { map: "Bounty", plays: Math.max(3, Math.round(stats.finishedMatches * 0.3)), winRate: 50 },
          { map: "Knockout", plays: Math.max(3, Math.round(stats.finishedMatches * 0.25)), winRate: 54 },
        ]
      : [],
    bans: stats.totalMatches
      ? [
          { brawler: "Kit", bans: 8, pct: 28 },
          { brawler: "Cordelius", bans: 6, pct: 22 },
        ]
      : [],
    fantasyPicks: topPlayers.slice(0, 3).map(({ p }) => {
      const player = getPlayer(p);
      return {
        playerSlug: p,
        pickRate: player?.fantasyOwnership ?? 20,
        avgPoints: player ? Math.round(player.fantasyPoints / 10) : 15,
      };
    }),
  };
}

export function getTournamentHub(slug: string): TournamentHubData {
  return HUB[slug] ?? defaultHub(slug);
}

export function getMVPPlayer(slug: string) {
  return getPlayer(slug);
}

export function getStandingTeamName(teamSlug: string) {
  return getTeam(teamSlug)?.name ?? teamSlug;
}
