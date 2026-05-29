import type { SupabaseClient } from "@supabase/supabase-js";
import { getRecentMatches } from "@/lib/data/matches";
import type {
  FantasyEntryRow,
  FantasyLeaderboardRow,
  FantasySquadSlotRow,
  UserGameState,
  VoteAggregate,
} from "./game-types";

export async function fetchVoteAggregates(supabase: SupabaseClient): Promise<Record<string, VoteAggregate>> {
  const { data, error } = await supabase.rpc("prediction_vote_aggregates");
  if (error || !data) return {};
  const out: Record<string, VoteAggregate> = {};
  for (const row of data as VoteAggregate[]) {
    out[row.match_id] = {
      match_id: row.match_id,
      votes_a: Number(row.votes_a),
      votes_b: Number(row.votes_b),
      total_votes: Number(row.total_votes),
    };
  }
  return out;
}

/** Crea entrada fantasy del torneo por defecto si el usuario aún no tiene (p. ej. cuenta anterior a la migración). */
export async function ensureFantasyEntry(
  supabase: SupabaseClient,
  userId: string,
  tournamentSlug: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from("fantasy_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("tournament_slug", tournamentSlug)
    .maybeSingle();
  if (existing) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  await supabase.from("fantasy_entries").insert({
    user_id: userId,
    tournament_slug: tournamentSlug,
    team_name: profile?.display_name ?? "Mi Equipo",
    total_points: 0,
  });
}

export async function fetchFantasyLeaderboard(
  supabase: SupabaseClient,
  tournamentSlug: string,
  limit = 100,
): Promise<FantasyLeaderboardRow[]> {
  const { data, error } = await supabase.rpc("fantasy_leaderboard", {
    p_tournament: tournamentSlug,
    p_limit: limit,
  });
  if (error || !data) return [];
  return (data as FantasyLeaderboardRow[]).map((r) => ({
    ...r,
    rank: Number(r.rank),
    total_points: Number(r.total_points),
  }));
}

export async function fetchUserGameState(
  supabase: SupabaseClient,
  userId: string,
  defaultTournament: string,
): Promise<UserGameState> {
  const [votesRes, entriesRes, profileRes, board] = await Promise.all([
    supabase.from("prediction_votes").select("match_id, pick, reward_points, points_awarded").eq("user_id", userId),
    supabase.from("fantasy_entries").select("*").eq("user_id", userId),
    supabase
      .from("profiles")
      .select("predict_points, predict_streak, predict_correct, predict_attempts")
      .eq("id", userId)
      .maybeSingle(),
    fetchFantasyLeaderboard(supabase, defaultTournament, 500),
  ]);

  const votes: Record<string, "A" | "B"> = {};
  for (const v of votesRes.data ?? []) {
    votes[v.match_id] = v.pick as "A" | "B";
  }

  const fantasy: UserGameState["fantasy"] = {};
  for (const entry of (entriesRes.data ?? []) as FantasyEntryRow[]) {
    const { data: slots } = await supabase
      .from("fantasy_squad_slots")
      .select("player_slug, is_captain, event_points")
      .eq("entry_id", entry.id);
    fantasy[entry.tournament_slug] = {
      entryId: entry.id,
      teamName: entry.team_name,
      totalPoints: entry.total_points,
      transfersUsed: entry.transfers_used,
      squad: ((slots ?? []) as FantasySquadSlotRow[]).map((s) => ({
        playerSlug: s.player_slug,
        isCaptain: s.is_captain,
        eventPoints: s.event_points,
      })),
    };
  }

  const myBoard = board.find((r) => r.user_id === userId);
  const defaultEntry = fantasy[defaultTournament];

  return {
    votes,
    fantasy,
    predictPoints: profileRes.data?.predict_points ?? 0,
    predictStreak: profileRes.data?.predict_streak ?? 0,
    predictCorrect: profileRes.data?.predict_correct ?? 0,
    predictAttempts: profileRes.data?.predict_attempts ?? 0,
    fantasyPoints: defaultEntry?.totalPoints ?? 0,
    fantasyRank: myBoard?.rank ?? null,
  };
}

/** Recalcula puntos de predicciones según partidos cerrados y persiste en profiles + votes */
export async function syncPredictorScores(supabase: SupabaseClient, userId: string) {
  const { data: votes } = await supabase
    .from("prediction_votes")
    .select("match_id, pick, reward_points, points_awarded")
    .eq("user_id", userId);

  if (!votes?.length) {
    await supabase
      .from("profiles")
      .update({ predict_points: 0, predict_streak: 0, predict_correct: 0, predict_attempts: 0 })
      .eq("id", userId);
    return;
  }

  const closed = getRecentMatches(80).filter((m) => m.status === "finished");
  const closedById = new Map(closed.map((m) => [m.id, m]));

  let points = 0;
  let correct = 0;
  let attempts = 0;
  let streak = 0;
  let bestStreak = 0;

  const sorted = [...votes].sort((a, b) => a.match_id.localeCompare(b.match_id));

  for (const v of sorted) {
    const m = closedById.get(v.match_id);
    if (!m) continue;
    const winner: "A" | "B" = m.scoreA > m.scoreB ? "A" : "B";
    const reward = v.reward_points || (m.format.includes("5") ? 75 : m.format.includes("3") ? 50 : 35);
    attempts += 1;
    const won = v.pick === winner;
    if (won) {
      correct += 1;
      points += reward;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      if (v.points_awarded !== reward) {
        await supabase
          .from("prediction_votes")
          .update({ points_awarded: reward, reward_points: reward })
          .eq("user_id", userId)
          .eq("match_id", v.match_id);
      }
    } else {
      streak = 0;
      if (v.points_awarded !== 0) {
        await supabase
          .from("prediction_votes")
          .update({ points_awarded: 0 })
          .eq("user_id", userId)
          .eq("match_id", v.match_id);
      }
    }
  }

  await supabase
    .from("profiles")
    .update({
      predict_points: points,
      predict_streak: bestStreak,
      predict_correct: correct,
      predict_attempts: attempts,
    })
    .eq("id", userId);
}
