import { createClient } from "@/lib/supabase/server";
import { isCmsResolverActive, isFlagEnabled, mergeFlags } from "../flags";
import { loadFlagsFromDb } from "../db";

export interface ResolvedPredictionScoring {
  basePoints: number;
  streakBonus: Record<string, number>;
  rules: Record<string, unknown>;
  source: string;
}

const LEGACY_SCORING: ResolvedPredictionScoring = {
  basePoints: 10,
  streakBonus: { "3": 5, "5": 10 },
  rules: { correct_winner: 10 },
  source: "legacy",
};

export async function resolvePredictionScoring(): Promise<ResolvedPredictionScoring> {
  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  if (!isCmsResolverActive(flags) || !isFlagEnabled(flags, "cms.predictions_config.enabled")) {
    return LEGACY_SCORING;
  }

  const supabase = await createClient();
  if (!supabase) return LEGACY_SCORING;

  const { data } = await supabase
    .from("prediction_scoring")
    .select("base_points, streak_bonus, rules")
    .eq("id", "default")
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return LEGACY_SCORING;

  return {
    basePoints: data.base_points,
    streakBonus: (data.streak_bonus as Record<string, number>) ?? LEGACY_SCORING.streakBonus,
    rules: (data.rules as Record<string, unknown>) ?? LEGACY_SCORING.rules,
    source: "supabase",
  };
}
