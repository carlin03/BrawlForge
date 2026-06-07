export { teams, getTeam, getTeamByTag } from "./teams";
export type { EsportsTeam } from "./teams";
export {
  players,
  getPlayer,
  getPlayersByTeam,
  getPlayerTeam,
  getTopFantasyPlayers,
  getTopActivePlayers,
  getActivePlayers,
  getPlayersWithTeam,
  getTeamsWithPlayers,
  searchPlayers,
  resolvePlayerRegion,
} from "./players";
export type { EsportsPlayer, PlayerStatus } from "./players";
export { CATALOG_STATS, catalogSyncedAt, isTierBPlus, tierLabel, tierBadgeClass } from "./catalog";
export { hasPlayedBsc2026, getBsc2026PlayedTeamSlugs, getCompetitiveTeamSlugs } from "./bsc-teams-played-2026";
export { getBsc2026CircuitTeamSlugs, BSC_2026_CIRCUIT_SLUGS, BSC_2026_CLUB_COUNT } from "./bsc-2026-circuit-teams";
export {
  TIER_BPLUS_TEAM_COUNT,
  BSC_CORE_CLUB_COUNT,
  TIER_BPLUS_TOURNAMENT_COUNT,
} from "./tier-bplus-pool";
export { BSC_2026_ROSTERS, BSC_2026_TEAM_SLUGS } from "./bsc-2026-rosters";
export {
  tournaments,
  getLegacyMatchList,
  getTournament,
  getMatch,
  getMatchesByTournament,
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  getBscCircuitTournaments,
  getFeaturedTournaments,
  getTierBPlusTournaments,
  isKnownTeamSlug,
  isDisplayableMatch,
  isPickemMatchEligible,
  getTournamentParticipantSlugs,
  expandTournamentSlugFilter,
} from "./matches";
export {
  getTeamDisplayName,
  resolveMatchTeamName,
  isTeamInCatalog,
  isSchedulableMatch,
  isSchedulableTeamSlug,
  slugToDisplayName,
} from "./team-display-resolve";
export { getCuratedHomeMatches } from "./home-matches";
export {
  isPublicScheduleMatch,
  isPublicUpcomingCalendarMatch,
  isPickemTemplateMatch,
  buildPublicCalendarPool,
} from "./match-schedule-trust";
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
  getUserSquadDisplay,
  getTournamentMarket,
  getTournamentFeaturedPicks,
  getTournamentLeaderboard,
  isPlayerInTournament,
  isPlayerInSquad,
  getTrendingClass,
  getTournamentPlayerPool,
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
import { getTeamDisplayName } from "./team-display-resolve";

/** Resolve team slug → display name, safe fallback */
export function teamName(slug: string): string {
  return getTeamDisplayName(slug);
}

/** Resolve tournament slug → display name */
export function tournamentName(slug: string): string {
  return getTournament(slug)?.shortName ?? slug;
}

export { MAIN_NAV as NAV_ITEMS } from "../nav-config";

export const FOOTER_LINKS: readonly { label: string; href: string }[] = [];
