export { teams, getTeam, getTeamByTag } from "./teams";
export type { EsportsTeam } from "./teams";
export { players, getPlayer, getPlayersByTeam, getPlayerTeam, getTopFantasyPlayers, getTopActivePlayers, getActivePlayers, getPlayersWithTeam, getTeamsWithPlayers, searchPlayers } from "./players";
export type { EsportsPlayer, PlayerStatus } from "./players";
export { CATALOG_STATS, catalogSyncedAt, getCompetitiveTeamSlugs, isTierBPlus, tierLabel, tierBadgeClass } from "./catalog";
export {
  tournaments,
  matches,
  getTournament,
  getMatch,
  getMatchesByTournament,
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  getCuratedHomeMatches,
  getFeaturedTournaments,
  getTierBPlusTournaments,
  isKnownTeamSlug,
  getTournamentParticipantSlugs,
} from "./matches";
export type { EsportsMatch, EsportsTournament } from "./matches";
export { news, getNews, getLatestNews } from "./news";
export type { NewsArticle } from "./news";
export { TEAM_LOGOS, getTeamLogo, getTournamentLogo } from "./logos";
export {
  DEFAULT_FANTASY_TOURNAMENT,
  userSquad,
  userSquadsByTournament,
  userFantasyProfile,
  tournamentFantasyProfiles,
  fantasyLeagues,
  fantasyLeaderboard,
  transferMarket,
  featuredPicks,
  FANTASY_BUDGET,
  FANTASY_SQUAD_SIZE,
  getSquadValue,
  getBudgetRemaining,
  getSquadEventTotal,
  getGameweekTotal,
  getPlayerPrice,
  getFantasyLeague,
  getFantasyLeaguesForTournament,
  getTournamentFantasyProfile,
  getUserSquad,
  getTournamentMarket,
  getTournamentFeaturedPicks,
  getTournamentLeaderboard,
  isPlayerInTournament,
  isPlayerInSquad,
  getTrendingClass,
} from "./fantasy";
export type { FantasySquadSlot, FantasyLeague, TournamentFantasyProfile, FantasyLeaderboardEntry, MarketPlayer } from "./fantasy";
export { openPredictions, closedPredictions, userPredictorProfile, getPredictionLabel, getPredictionTournament, hasCommunityVotes } from "./predictions";
export type { PredictionEvent } from "./predictions";
export { pickemEvents, getPickem } from "./pickems";
export type { PickemEvent, PickemMatch } from "./pickems";
export { getFantasyRole, getPickRate, getPriceTrend, getFormStreak, buildMarketSections } from "./fantasy-meta";
export type { FantasyRole, MarketSection } from "./fantasy-meta";
export { hasFantasyForTournament, getFantasyTournamentStats } from "./fantasy-rosters";
export { getFantasyTournaments, getFantasyTournamentBySlug } from "./fantasy-tournaments";
export type { FantasyTournamentConfig } from "./fantasy-tournaments";
export {
  getRecentTransfers,
  getTrendingPlayers,
  getTopGainers,
  getTopLosers,
  getMvpOfWeek,
  getCommunityStats,
  getLiveActivity,
  getUpcomingTournamentsWidget,
  getTopPredictors,
  getRecentCorrectPicks,
  getHotMarketPick,
  getMostVotedTeams,
  getMostTransferredIn,
  getMostTransferredOut,
  getCaptainPopularity,
  getFantasyActivity,
  getPredictionVotingActivity,
  getAccuracyTrend,
  getRecentFantasyPoints,
  getTeamPlatformMeta,
  getStreakLeaders,
} from "./home-widgets";
export type {
  RecentTransfer,
  ActivityItem,
  TrendingPlayer,
  TopPredictor,
  MostVotedTeam,
  TransferTrend,
  CaptainPick,
  VotingActivity,
  AccuracyPoint,
  FantasyPointGain,
  TeamPlatformMeta,
} from "./home-widgets";

import { getTeam } from "./teams";
import { getTournament } from "./matches";

/** Resolve team slug → display name, safe fallback */
export function teamName(slug: string): string {
  return getTeam(slug)?.name ?? slug;
}

/** Resolve tournament slug → display name */
export function tournamentName(slug: string): string {
  return getTournament(slug)?.shortName ?? slug;
}

export const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Fantasy", href: "/fantasy", accent: "fantasy" as const },
  { label: "Votar", href: "/predictions", accent: "predict" as const },
  { label: "Partidos", href: "/matches" },
  { label: "Torneos", href: "/tournaments" },
  { label: "Clubes", href: "/teams" },
  { label: "Noticias", href: "/news" },
] as const;

export const FOOTER_LINKS: readonly { label: string; href: string }[] = [];
