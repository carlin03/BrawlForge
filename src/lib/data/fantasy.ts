import type { Region } from "../types";
import { SHOW_DEMO_SOCIAL } from "../app-config";
import { getPlayer, getPlayersByTeam, players } from "./players";
import { getFantasyTournamentTeams } from "./fantasy-tournaments";
import { getFantasyTeamPlayerSlugs, getFantasyPlayersForTournament } from "./fantasy-rosters";
import { getTournament } from "./matches";

function hashNum(s: string, mod: number): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % mod;
}

function pseudoForm(slug: string): readonly ("W" | "L")[] {
  const f: ("W" | "L")[] = [];
  for (let i = 0; i < 3; i++) f.push(hashNum(slug + i, 3) > 0 ? "W" : "L");
  return f;
}

export interface FantasySquadSlot {
  playerSlug: string;
  isCaptain: boolean;
  /** Puntos acumulados en el torneo */
  eventPoints: number;
}

export interface TournamentFantasyProfile {
  tournamentSlug: string;
  teamName: string;
  totalPoints: number;
  rank: number;
  rankChange: number;
  deadline: string;
  transfersAllowed: number;
  transfersUsed: number;
  isLocked: boolean;
  participants: number;
}

export interface FantasyLeague {
  id: string;
  slug: string;
  name: string;
  type: "global" | "regional" | "social" | "pro";
  region?: Region;
  tournamentSlug: string;
  members: number;
  yourRank: number;
  leaderName: string;
  leaderPoints: number;
  yourPoints: number;
}

export interface FantasyLeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  roundPoints: number;
  rankChange: number;
  captainIgn: string;
  avatarColor: string;
}

export interface MarketPlayer {
  playerSlug: string;
  price: number;
  priceChange: number;
  form: readonly ("W" | "L")[];
  trending?: "hot" | "value" | "differential";
}

/** Brawl Stars fantasy = 3 pro players, 100M budget por torneo */
export const FANTASY_SQUAD_SIZE = 3;
export const FANTASY_BUDGET = 100;

/** Torneo fantasy por defecto al entrar */
export const DEFAULT_FANTASY_TOURNAMENT = "bsc-2026-brawl-cup";

/** Perfil + deadline por torneo */
export const tournamentFantasyProfiles: Record<string, TournamentFantasyProfile> = {
  "bsc-2026-brawl-cup": {
    tournamentSlug: "bsc-2026-brawl-cup",
    teamName: "Forge XI",
    totalPoints: 312,
    rank: 847,
    rankChange: 124,
    deadline: "2026-05-17T10:00:00",
    transfersAllowed: 2,
    transfersUsed: 1,
    isLocked: false,
    participants: 18400,
  },
  "bsc-2026-s3-emea-mf": {
    tournamentSlug: "bsc-2026-s3-emea-mf",
    teamName: "Forge EMEA",
    totalPoints: 198,
    rank: 412,
    rankChange: 56,
    deadline: "2026-06-14T18:00:00",
    transfersAllowed: 3,
    transfersUsed: 0,
    isLocked: false,
    participants: 9200,
  },
  "bsc-2026-s3-ea-mf": {
    tournamentSlug: "bsc-2026-s3-ea-mf",
    teamName: "Forge EA",
    totalPoints: 0,
    rank: 0,
    rankChange: 0,
    deadline: "2026-07-12T18:00:00",
    transfersAllowed: 3,
    transfersUsed: 0,
    isLocked: false,
    participants: 6100,
  },
  "bsc-2026-s3-na-mf": {
    tournamentSlug: "bsc-2026-s3-na-mf",
    teamName: "Forge NA",
    totalPoints: 0,
    rank: 0,
    rankChange: 0,
    deadline: "2026-06-28T18:00:00",
    transfersAllowed: 3,
    transfersUsed: 0,
    isLocked: false,
    participants: 5400,
  },
};

/** Plantillas del usuario — una por torneo */
export const userSquadsByTournament: Record<string, FantasySquadSlot[]> = {
  "bsc-2026-brawl-cup": [
    { playerSlug: "moya", isCaptain: true, eventPoints: 42 },
    { playerSlug: "boss", isCaptain: false, eventPoints: 28 },
    { playerSlug: "yoshi", isCaptain: false, eventPoints: 31 },
  ],
  "bsc-2026-s3-emea-mf": [
    { playerSlug: "yoshi", isCaptain: true, eventPoints: 0 },
    { playerSlug: "lukii", isCaptain: false, eventPoints: 0 },
    { playerSlug: "boss", isCaptain: false, eventPoints: 0 },
  ],
  "bsc-2026-s3-ea-mf": [
    { playerSlug: "moya", isCaptain: true, eventPoints: 0 },
    { playerSlug: "tensai", isCaptain: false, eventPoints: 0 },
    { playerSlug: "yoshi", isCaptain: false, eventPoints: 0 },
  ],
  "bsc-2026-s3-na-mf": [
    { playerSlug: "lxffy", isCaptain: true, eventPoints: 0 },
    { playerSlug: "response", isCaptain: false, eventPoints: 0 },
    { playerSlug: "bobby", isCaptain: false, eventPoints: 0 },
  ],
};

/** Compat: plantilla del torneo por defecto */
export const userSquad: FantasySquadSlot[] =
  userSquadsByTournament[DEFAULT_FANTASY_TOURNAMENT] ?? [];

/** Compat: perfil global derivado del torneo activo por defecto */
export const userFantasyProfile = {
  teamName: tournamentFantasyProfiles[DEFAULT_FANTASY_TOURNAMENT].teamName,
  totalPoints: tournamentFantasyProfiles[DEFAULT_FANTASY_TOURNAMENT].totalPoints,
  globalRank: tournamentFantasyProfiles[DEFAULT_FANTASY_TOURNAMENT].rank,
  rankChange: tournamentFantasyProfiles[DEFAULT_FANTASY_TOURNAMENT].rankChange,
};

export function getTournamentFantasyProfile(slug: string): TournamentFantasyProfile {
  let profile: TournamentFantasyProfile;
  if (tournamentFantasyProfiles[slug]) {
    profile = tournamentFantasyProfiles[slug];
  } else {
    const t = getTournament(slug);
    const pool = getTournamentPlayerPool(slug);
    const teamCount = getFantasyTournamentTeams(slug).length;
    const finished = t?.status === "finished";
    profile = {
      tournamentSlug: slug,
      teamName: "Mi Equipo",
      totalPoints: 0,
      rank: 0,
      rankChange: 0,
      deadline: t?.endDate ? `${t.endDate}T18:00:00` : new Date(Date.now() + 7 * 86400000).toISOString(),
      transfersAllowed: finished ? 0 : 2,
      transfersUsed: 0,
      isLocked: Boolean(finished),
      participants: Math.max(800, teamCount * 900 + hashNum(slug, 4000) + pool.length * 40),
    };
  }
  if (!SHOW_DEMO_SOCIAL) {
    return {
      ...profile,
      totalPoints: 0,
      rank: 0,
      rankChange: 0,
      participants: 0,
    };
  }
  return profile;
}

export function getUserSquad(tournamentSlug: string): FantasySquadSlot[] {
  const pool = new Set(getTournamentPlayerPool(tournamentSlug));
  const saved = userSquadsByTournament[tournamentSlug] ?? [];
  return saved.filter((s) => pool.has(s.playerSlug));
}

export function isPlayerInTournament(playerSlug: string, tournamentSlug: string): boolean {
  return getTournamentPlayerPool(tournamentSlug).includes(playerSlug);
}

export function getTournamentPlayerPool(tournamentSlug: string): string[] {
  const teamSlugs = getFantasyTournamentTeams(tournamentSlug);
  const fromTeams = teamSlugs.flatMap((ts) => getFantasyTeamPlayerSlugs(ts));
  const pool = [...new Set(fromTeams)].filter((slug) => {
    const p = getPlayer(slug);
    return p && p.status === "active";
  });
  if (pool.length > 0) return pool;
  return getFantasyPlayersForTournament(tournamentSlug);
}

/** Player prices in millions (M) */
export const playerPrices: Record<string, number> = {
  moya: 14.5,
  tensai: 12.0,
  milkreo: 9.5,
  yoshi: 13.5,
  ope: 11.0,
  joker: 10.0,
  lukii: 12.5,
  boss: 11.5,
  symantec: 10.5,
  lxffy: 11.0,
  rbm: 9.0,
  zeus: 8.5,
  nowy297: 10.0,
  meow: 8.0,
  gero: 7.5,
  zhar: 9.0,
  ikaoss: 8.0,
  lenain: 7.5,
  response: 10.5,
  "sergeant-clash": 9.5,
  x9jay: 8.5,
  kaiodog: 9.0,
  edinho: 8.5,
  firecrow: 8.0,
  pain: 9.5,
  tacos: 8.5,
  "juan-carlos": 8.0,
  levi: 10.0,
  sizuku: 9.0,
  sitetampo: 8.5,
  rhz: 8.0,
  kristian: 7.5,
  prozy: 7.0,
  marco: 8.5,
  biso: 8.0,
  subeme: 7.5,
  bobby: 9.0,
  chino: 8.0,
  sans: 7.5,
  melty: 8.5,
  shu: 8.0,
  battoman: 7.5,
  tomzy: 8.0,
  filippo: 7.5,
  enraged: 7.0,
  meliodas: 8.0,
  bryan: 7.5,
  deykon: 7.0,
  maru: 8.0,
  maury: 7.5,
  angelboy: 7.0,
  drage: 8.5,
  guesti: 7.0,
  portox: 8.0,
  wesley: 7.5,
  patchy: 7.5,
  cauebr: 8.0,
  jubileu: 7.5,
  mohtep: 7.0,
  engine: 8.5,
  toc: 8.0,
  ou: 7.5,
  "david-ax": 8.0,
  galaxy: 7.5,
  nagi: 7.0,
  doritos: 8.0,
  derrp: 7.5,
  loko: 7.0,
  adrii: 7.0,
};

export function getPlayerPrice(slug: string, tournamentSlug?: string): number {
  let base: number;
  if (playerPrices[slug]) base = playerPrices[slug];
  else {
    const p = getPlayer(slug);
    if (!p) base = 8;
    else {
      const fromPts = 5 + (p.fantasyPoints / 100) * 10;
      const fromRating = p.rating * 8;
      base = Math.min(16, Math.max(5.5, Math.round((fromPts + fromRating) * 10) / 10));
    }
  }
  if (!tournamentSlug) return base;
  const tweak = (hashNum(`${slug}:${tournamentSlug}`, 21) - 10) / 20;
  return Math.min(16, Math.max(5.5, Math.round((base + tweak) * 10) / 10));
}

function buildMarketEntry(slug: string, tournamentSlug?: string): MarketPlayer {
  const p = getPlayer(slug);
  const priceChange = Math.round((hashNum(slug + (tournamentSlug ?? ""), 41) - 20) / 10) / 10;
  let trending: MarketPlayer["trending"];
  if (p && p.fantasyOwnership > 45) trending = "hot";
  else if (priceChange < -0.08) trending = "value";
  else if (p && p.fantasyOwnership < 18 && p.fantasyPoints >= 72) trending = "differential";
  return {
    playerSlug: slug,
    price: getPlayerPrice(slug, tournamentSlug),
    priceChange,
    form: pseudoForm(slug + (tournamentSlug ?? "")),
    trending,
  };
}

export function getSquadValue(squad: FantasySquadSlot[], tournamentSlug?: string): number {
  return squad.reduce((sum, s) => sum + getPlayerPrice(s.playerSlug, tournamentSlug), 0);
}

export function getBudgetRemaining(squad: FantasySquadSlot[]): number {
  return FANTASY_BUDGET - getSquadValue(squad);
}

/** Total pts del torneo (capitán ×2) */
export function getSquadEventTotal(squad: FantasySquadSlot[]): number {
  return squad.reduce(
    (sum, s) => sum + s.eventPoints + (s.isCaptain ? s.eventPoints : 0),
    0
  );
}

/** @deprecated use getSquadEventTotal */
export function getGameweekTotal(squad: FantasySquadSlot[]): number {
  return getSquadEventTotal(squad);
}

export function getTournamentMarket(tournamentSlug: string): MarketPlayer[] {
  const pool = getTournamentPlayerPool(tournamentSlug);
  return pool
    .map((slug) => buildMarketEntry(slug, tournamentSlug))
    .sort((a, b) => (getPlayer(b.playerSlug)?.fantasyPoints ?? 0) - (getPlayer(a.playerSlug)?.fantasyPoints ?? 0));
}

export function getTournamentFeaturedPicks(tournamentSlug: string): MarketPlayer[] {
  return getTournamentMarket(tournamentSlug).slice(0, 6);
}

/** Mercado global — todos los pros (solo referencia; fantasy usa mercado por torneo) */
export const transferMarket: MarketPlayer[] = players.map((p) => buildMarketEntry(p.slug));
export const featuredPicks = transferMarket.slice(0, 8);

const LEADERBOARD_TEMPLATES: Omit<FantasyLeaderboardEntry, "points" | "roundPoints">[] = [
  { rank: 1, username: "CR_Fan_Tokyo", rankChange: 0, captainIgn: "Moya", avatarColor: "#e0354a" },
  { rank: 2, username: "SK_Elite", rankChange: 2, captainIgn: "Yoshi", avatarColor: "#2b9bff" },
  { rank: 3, username: "HMBLE_Supporter", rankChange: -1, captainIgn: "Lukii", avatarColor: "#f0b429" },
  { rank: 4, username: "TribeFan_NA", rankChange: 4, captainIgn: "Lxffy", avatarColor: "#2ecc71" },
  { rank: 5, username: "BrawlForge_Official", rankChange: 1, captainIgn: "Response", avatarColor: "#9b59b6" },
];

function buildLeaderboard(basePoints: number): FantasyLeaderboardEntry[] {
  return LEADERBOARD_TEMPLATES.map((e, i) => ({
    ...e,
    points: basePoints - i * 45 + Math.floor(Math.random() * 0),
    roundPoints: 112 - i * 12,
  }));
}

export const tournamentLeaderboards: Record<string, FantasyLeaderboardEntry[]> = {
  "bsc-2026-brawl-cup": [
    { rank: 1, username: "CR_Fan_Tokyo", points: 428, roundPoints: 86, rankChange: 0, captainIgn: "Moya", avatarColor: "#e0354a" },
    { rank: 2, username: "BC_Cup_King", points: 401, roundPoints: 72, rankChange: 3, captainIgn: "Boss", avatarColor: "#2b9bff" },
    { rank: 3, username: "HMBLE_Supporter", points: 388, roundPoints: 68, rankChange: -1, captainIgn: "Lukii", avatarColor: "#f0b429" },
    { rank: 4, username: "ZetaWarrior", points: 356, roundPoints: 61, rankChange: 2, captainIgn: "Levi", avatarColor: "#2ecc71" },
    { rank: 5, username: "ForgeFan", points: 334, roundPoints: 55, rankChange: 5, captainIgn: "Yoshi", avatarColor: "#9b59b6" },
  ],
  "bsc-2026-s3-emea-mf": buildLeaderboard(380),
  "bsc-2026-s3-ea-mf": buildLeaderboard(290),
  "bsc-2026-s3-na-mf": buildLeaderboard(310),
};

export function getTournamentLeaderboard(tournamentSlug: string): FantasyLeaderboardEntry[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  return tournamentLeaderboards[tournamentSlug] ?? buildLeaderboard(400);
}

/** Compat */
export const fantasyLeaderboard = tournamentLeaderboards[DEFAULT_FANTASY_TOURNAMENT];

export const fantasyLeagues: FantasyLeague[] = [
  {
    id: "bc-global",
    slug: "bc-global",
    name: "Brawl Cup · Global",
    type: "global",
    tournamentSlug: "bsc-2026-brawl-cup",
    members: 18400,
    yourRank: 847,
    leaderName: "CR_Fan_Tokyo",
    leaderPoints: 428,
    yourPoints: 312,
  },
  {
    id: "emea-mf",
    slug: "emea-mf",
    name: "EMEA Monthly Final",
    type: "pro",
    region: "EMEA",
    tournamentSlug: "bsc-2026-s3-emea-mf",
    members: 9200,
    yourRank: 412,
    leaderName: "HMBLE_Supporter",
    leaderPoints: 380,
    yourPoints: 198,
  },
  {
    id: "friends-bc",
    slug: "friends-bc",
    name: "Amigos · Brawl Cup",
    type: "social",
    tournamentSlug: "bsc-2026-brawl-cup",
    members: 12,
    yourRank: 2,
    leaderName: "TribeFan_NA",
    leaderPoints: 356,
    yourPoints: 312,
  },
  {
    id: "na-mf",
    slug: "na-mf",
    name: "NA Monthly Final",
    type: "regional",
    region: "NA",
    tournamentSlug: "bsc-2026-s3-na-mf",
    members: 5400,
    yourRank: 0,
    leaderName: "LxffyEnjoyer",
    leaderPoints: 310,
    yourPoints: 0,
  },
];

export function getFantasyLeague(slug: string): FantasyLeague | undefined {
  return fantasyLeagues.find((l) => l.slug === slug);
}

export function getFantasyLeaguesForTournament(tournamentSlug: string): FantasyLeague[] {
  if (!SHOW_DEMO_SOCIAL) return [];
  return fantasyLeagues.filter((l) => l.tournamentSlug === tournamentSlug);
}

export function isPlayerInSquad(slug: string, squad = userSquad): boolean {
  return squad.some((s) => s.playerSlug === slug);
}

export function getTrendingLabel(trending?: MarketPlayer["trending"]): string | null {
  if (trending === "hot") return "En racha";
  if (trending === "value") return "Ganga";
  if (trending === "differential") return "Diferencial";
  return null;
}

export function getTrendingClass(trending?: MarketPlayer["trending"]): string {
  if (trending === "hot") return "bf-trend-hot";
  if (trending === "value") return "bf-trend-value";
  if (trending === "differential") return "bf-trend-diff";
  return "";
}

export function getPlayerOwnership(slug: string): number {
  return getPlayer(slug)?.fantasyOwnership ?? 0;
}
