import type { PredictionEvent } from "@/lib/data/predictions";
import { getMatch, getTournament } from "@/lib/data/matches";
import { getPredictionLabel, getPredictionTournament } from "@/lib/data";
import { hasRealVotes } from "@/lib/data/predictions-build";
import {
  getMatchStageMeta,
  getPredictDisplayStatus,
  stageImportanceSort,
  type MatchStageMeta,
  type PredictDisplayStatus,
} from "@/lib/data/match-stage-meta";

export type PredictListFilter = "active" | "finished" | "hit" | "miss" | "all";

export type EnrichedPrediction = PredictionEvent & {
  outcome: "pending" | "hit" | "miss" | "none";
  pointsEarned: number;
  matchDate?: string;
  matchStatus?: string;
  region?: string;
  tournamentShortName?: string;
  stageMeta?: MatchStageMeta;
  displayStatus?: PredictDisplayStatus;
};

export type PlayoffBracketSlot = {
  matchId?: string;
  teamASlug?: string;
  teamBSlug?: string;
  status: "set" | "tbd";
  /** Reserva si faltan slugs */
  label?: string;
};

export type PlayoffBracketRound = {
  key: "quarter" | "semi" | "final" | "grand_final";
  title: string;
  shortTitle: string;
  slots: PlayoffBracketSlot[];
};

export type PlayoffBracketView = {
  tournamentSlug: string;
  tournamentName: string;
  region?: string;
  rounds: PlayoffBracketRound[];
};

export function predictAccuracy(correct: number, attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.round((correct / attempts) * 100);
}

export function predictLevel(points: number): { level: number; label: string; nextAt: number; prevAt: number } {
  const tiers = [
    { min: 0, label: "Rookie" },
    { min: 100, label: "Scout" },
    { min: 300, label: "Analyst" },
    { min: 600, label: "Expert" },
    { min: 1000, label: "Oracle" },
  ];
  let level = 1;
  let label = tiers[0].label;
  let nextAt = tiers[1].min;
  let prevAt = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (points >= tiers[i].min) {
      level = i + 1;
      label = tiers[i].label;
      prevAt = tiers[i].min;
      nextAt = tiers[i + 1]?.min ?? points + 200;
      break;
    }
  }
  return { level, label, nextAt, prevAt };
}

export function predictXpProgress(points: number): number {
  const { prevAt, nextAt } = predictLevel(points);
  const span = nextAt - prevAt;
  if (span <= 0) return 100;
  return Math.min(100, Math.round(((points - prevAt) / span) * 100));
}

export type PredictAchievement = { id: string; label: string; icon: "target" | "flame" | "trophy" | "zap" | "medal" };

export function predictAchievements(opts: {
  points: number;
  attempts: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rank: number | null;
}): PredictAchievement[] {
  const out: PredictAchievement[] = [];
  if (opts.attempts >= 1) out.push({ id: "first", label: "Primer pick", icon: "target" });
  if (opts.currentStreak >= 3) out.push({ id: "hot", label: `Racha ×${opts.currentStreak}`, icon: "flame" });
  if (opts.bestStreak >= 5) out.push({ id: "best", label: `Récord ×${opts.bestStreak}`, icon: "medal" });
  if (opts.accuracy >= 55 && opts.attempts >= 5) out.push({ id: "sharp", label: `${opts.accuracy}% precisión`, icon: "zap" });
  if (opts.rank != null && opts.rank <= 10) out.push({ id: "top10", label: `Top ${opts.rank}`, icon: "trophy" });
  if (predictLevel(opts.points).level >= 4) out.push({ id: "expert", label: "Nivel Expert+", icon: "trophy" });
  return out.slice(0, 5);
}

/** Racha actual (aciertos seguidos en partidos cerrados, orden cronológico). */
export function computeCurrentPredictStreak(
  votes: Record<string, "A" | "B">,
  closedEvents: EnrichedPrediction[],
): number {
  const sorted = [...closedEvents]
    .filter((e) => e.correctPick && votes[e.matchId])
    .sort((a, b) => (a.matchDate ?? a.deadline).localeCompare(b.matchDate ?? b.deadline));
  let streak = 0;
  for (const e of sorted) {
    if (votes[e.matchId] === e.correctPick) streak += 1;
    else streak = 0;
  }
  return streak;
}

export type WeeklyPredictSummary = { points: number; correct: number; attempts: number };

export function weeklyPredictSummary(
  votes: Record<string, "A" | "B">,
  closedEvents: EnrichedPrediction[],
): WeeklyPredictSummary {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let points = 0;
  let correct = 0;
  let attempts = 0;
  for (const e of closedEvents) {
    const pick = votes[e.matchId];
    if (!pick || !e.correctPick) continue;
    const t = new Date(e.matchDate ?? e.deadline).getTime();
    if (Number.isNaN(t) || t < weekAgo) continue;
    attempts += 1;
    if (pick === e.correctPick) {
      correct += 1;
      points += e.pointsEarned || e.rewardPoints;
    }
  }
  return { points, correct, attempts };
}

export type PopularPickCategory = "most_voted" | "controversial" | "even" | "upset";

export function categorizePopularPicks(open: EnrichedPrediction[]): Record<PopularPickCategory, EnrichedPrediction[]> {
  const active = open.filter((e) => e.status === "open" && hasRealVotes(e));
  const byVotes = [...active].sort((a, b) => b.totalVotes - a.totalVotes);
  const controversial = [...active]
    .filter((e) => e.pickAPct >= 35 && e.pickAPct <= 65)
    .sort((a, b) => Math.abs(50 - a.pickAPct) - Math.abs(50 - b.pickAPct));
  const even = [...active]
    .filter((e) => Math.abs(e.pickAPct - e.pickBPct) <= 8)
    .sort((a, b) => Math.abs(a.pickAPct - a.pickBPct) - Math.abs(b.pickAPct - b.pickBPct));
  const upset = [...active]
    .filter((e) => {
      const underdogPct = Math.min(e.pickAPct, e.pickBPct);
      return underdogPct >= 18 && underdogPct <= 42;
    })
    .sort((a, b) => Math.min(a.pickAPct, a.pickBPct) - Math.min(b.pickAPct, b.pickBPct));

  return {
    most_voted: byVotes.slice(0, 6),
    controversial: controversial.slice(0, 6),
    even: even.length ? even.slice(0, 6) : controversial.slice(0, 6),
    upset: upset.length ? upset.slice(0, 6) : byVotes.slice(1, 7),
  };
}

export function pointsToNextRank(
  myPoints: number,
  myRank: number | null,
  leaderboard: { rank: number; predict_points: number }[],
): { gap: number | null; aboveName: string | null; aboveRank: number | null } {
  if (!myRank || myRank <= 1) return { gap: null, aboveName: null, aboveRank: null };
  const above = leaderboard.find((r) => r.rank === myRank - 1);
  if (!above) return { gap: null, aboveName: null, aboveRank: null };
  return {
    gap: Math.max(0, above.predict_points - myPoints + 1),
    aboveName: null,
    aboveRank: above.rank,
  };
}

export function pickFeaturedEvent(open: PredictionEvent[]): PredictionEvent | null {
  if (!open.length) return null;
  const ranked = [...open].sort(stageImportanceSort);
  return ranked[0] ?? null;
}

/** Partidos que cierran antes (fecha más cercana). */
export function getClosingSoonMatches(open: EnrichedPrediction[], limit = 4): EnrichedPrediction[] {
  const now = Date.now();
  return [...open]
    .filter((e) => e.status === "open")
    .sort((a, b) => {
      const ta = new Date(a.matchDate ?? a.deadline).getTime();
      const tb = new Date(b.matchDate ?? b.deadline).getTime();
      const da = Number.isNaN(ta) ? Infinity : ta - now;
      const db = Number.isNaN(tb) ? Infinity : tb - now;
      return da - db;
    })
    .slice(0, limit);
}

export function pickPlayoffTournamentSlug(events: EnrichedPrediction[]): string | null {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.stageMeta?.isPlayoff) {
      counts.set(e.tournamentSlug, (counts.get(e.tournamentSlug) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let max = 0;
  for (const [slug, n] of counts) {
    if (n > max) {
      max = n;
      best = slug;
    }
  }
  return max >= 2 ? best : null;
}

const ROUND_SHORT: Record<PlayoffBracketRound["key"], string> = {
  quarter: "Cuartos",
  semi: "Semis",
  final: "Final",
  grand_final: "Final",
};

export function buildPlayoffBracket(
  tournamentSlug: string,
  events: EnrichedPrediction[],
): PlayoffBracketView | null {
  const tour = getTournament(tournamentSlug);
  const tourEvents = events.filter((e) => e.tournamentSlug === tournamentSlug && e.stageMeta?.isPlayoff);
  if (tourEvents.length < 2) return null;

  const byRound = (key: PlayoffBracketRound["key"]) =>
    tourEvents
      .filter((e) => e.stageMeta?.roundKey === key || (key === "final" && e.stageMeta?.roundKey === "grand_final"))
      .sort((a, b) => (a.matchDate ?? a.deadline).localeCompare(b.matchDate ?? b.deadline));

  const roundDefs: { key: PlayoffBracketRound["key"]; title: string }[] = [
    { key: "quarter", title: "Cuartos de final" },
    { key: "semi", title: "Semifinales" },
    { key: "grand_final", title: "Gran final" },
  ];

  const rounds: PlayoffBracketRound[] = [];
  for (const def of roundDefs) {
    const matches =
      def.key === "grand_final"
        ? [...byRound("grand_final"), ...byRound("final")]
        : byRound(def.key);
    if (!matches.length) continue;
    rounds.push({
      key: def.key,
      title: def.title,
      shortTitle: ROUND_SHORT[def.key],
      slots: matches.map((e) => ({
        matchId: e.matchId,
        teamASlug: e.teamASlug,
        teamBSlug: e.teamBSlug,
        status: "set" as const,
      })),
    });
  }

  if (rounds.length < 2) return null;

  return {
    tournamentSlug,
    tournamentName: tour?.shortName ?? tour?.name ?? tournamentSlug,
    region: tour?.region,
    rounds,
  };
}

export function enrichPrediction(
  event: PredictionEvent,
  votes: Record<string, "A" | "B">,
  pointsByMatch?: Record<string, number>,
): EnrichedPrediction {
  const match = getMatch(event.matchId);
  const userPick = event.userPick ?? votes[event.matchId] ?? null;
  let outcome: EnrichedPrediction["outcome"] = "none";
  if (userPick && event.status === "closed" && event.correctPick) {
    outcome = userPick === event.correctPick ? "hit" : "miss";
  } else if (userPick && event.status === "open") {
    outcome = "pending";
  }
  const pointsEarned =
    event.status === "closed" && outcome === "hit" ? (pointsByMatch?.[event.matchId] ?? event.rewardPoints) : 0;

  const stageMeta = getMatchStageMeta(event.stage);
  const displayStatus = getPredictDisplayStatus({
    eventStatus: event.status,
    matchStatus: match?.status,
  });
  const tour = getTournament(event.tournamentSlug);

  return {
    ...event,
    userPick,
    outcome,
    pointsEarned,
    matchDate: match?.date ?? event.deadline,
    matchStatus: match?.status,
    region: match?.region ?? tour?.region,
    tournamentShortName: tour?.shortName ?? getPredictionTournament(event),
    stageMeta,
    displayStatus:
      displayStatus === "open" && match?.status === "upcoming" ? "upcoming" : displayStatus,
  };
}

export function formatPredictMatchTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function filterEnrichedList(list: EnrichedPrediction[], filter: PredictListFilter): EnrichedPrediction[] {
  switch (filter) {
    case "active":
      return list.filter((e) => e.status === "open");
    case "finished":
      return list.filter((e) => e.status === "closed");
    case "hit":
      return list.filter((e) => e.outcome === "hit");
    case "miss":
      return list.filter((e) => e.outcome === "miss");
    default:
      return list;
  }
}

export function tournamentLabel(event: PredictionEvent): string {
  return getPredictionTournament(event);
}
