import { SHOW_DEMO_SOCIAL } from "@/lib/app-config";
import { getUpcomingMatches, getRecentMatches, getTournament } from "./matches";
import { getTeam } from "./teams";

function teamName(slug: string): string {
  return getTeam(slug)?.name ?? slug;
}

function tournamentName(slug: string): string {
  return getTournament(slug)?.shortName ?? slug;
}

export interface PredictionEvent {
  id: string;
  matchId: string;
  teamASlug: string;
  teamBSlug: string;
  pickAPct: number;
  pickBPct: number;
  totalVotes: number;
  rewardPoints: number;
  deadline: string;
  stage: string;
  tournamentSlug: string;
  featured?: boolean;
  userPick?: "A" | "B" | null;
  status: "open" | "closed";
  correctPick?: "A" | "B";
}

export const userPredictorProfile = SHOW_DEMO_SOCIAL
  ? {
      username: "ForgeManager",
      totalPoints: 2340,
      rank: 892,
      streak: 4,
      accuracy: 68,
      nextRewardTier: 2500,
    }
  : {
      username: "",
      totalPoints: 0,
      rank: null as number | null,
      streak: 0,
      accuracy: 0,
      nextRewardTier: 0,
    };

function buildOpenPredictions(): PredictionEvent[] {
  const upcoming = getUpcomingMatches();
  return upcoming.map((m, i) => {
    const pickA = SHOW_DEMO_SOCIAL ? 35 + ((i * 13) % 40) : 0;
    return {
      id: `vota-${m.id}-${i}`,
      matchId: m.id,
      teamASlug: m.teamASlug,
      teamBSlug: m.teamBSlug,
      pickAPct: pickA,
      pickBPct: pickA ? 100 - pickA : 0,
      totalVotes: SHOW_DEMO_SOCIAL ? 800 + ((i * 420) % 6000) : 0,
      rewardPoints: m.format.includes("5") ? 75 : m.format.includes("3") ? 50 : 35,
      featured: i < 3,
      userPick: null,
      status: "open" as const,
      stage: m.stage,
      tournamentSlug: m.tournamentSlug,
      deadline: m.date,
    };
  });
}

function buildClosedPredictions(): PredictionEvent[] {
  const recent = getRecentMatches(24);
  return recent.map((m, i) => {
    const correct: "A" | "B" = m.scoreA > m.scoreB ? "A" : "B";
    const pickA = SHOW_DEMO_SOCIAL ? 35 + ((i * 11) % 45) : 0;
    return {
      id: `vota-closed-${m.id}`,
      matchId: m.id,
      teamASlug: m.teamASlug,
      teamBSlug: m.teamBSlug,
      pickAPct: pickA,
      pickBPct: pickA ? 100 - pickA : 0,
      totalVotes: SHOW_DEMO_SOCIAL ? 2000 + ((i * 310) % 8000) : 0,
      rewardPoints: 50,
      deadline: m.date,
      stage: m.stage,
      tournamentSlug: m.tournamentSlug,
      status: "closed" as const,
      correctPick: correct,
      userPick: SHOW_DEMO_SOCIAL ? (i % 3 === 0 ? (correct === "A" ? "B" : "A") : correct) : null,
    };
  });
}

export const openPredictions = buildOpenPredictions();
export const closedPredictions = buildClosedPredictions();

export function getPredictionLabel(event: PredictionEvent, side?: "A" | "B"): string {
  if (side === "A") return teamName(event.teamASlug);
  if (side === "B") return teamName(event.teamBSlug);
  return `${teamName(event.teamASlug)} vs ${teamName(event.teamBSlug)}`;
}

export function getPredictionTournament(event: PredictionEvent): string {
  return tournamentName(event.tournamentSlug);
}

export function hasCommunityVotes(event: PredictionEvent): boolean {
  return event.totalVotes > 0;
}
