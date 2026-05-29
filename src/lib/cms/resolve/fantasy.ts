import { FANTASY_BUDGET } from "@/lib/data/fantasy";
import { createClient } from "@/lib/supabase/server";
import { isCmsResolverActive, isFlagEnabled, mergeFlags } from "../flags";
import { loadFlagsFromDb } from "../db";

export interface ResolvedFantasyRules {
  budget: number;
  squadSize: number;
  captainMultiplier: number;
  transfersPerGameweek: number;
  source: string;
}

const LEGACY_RULES: ResolvedFantasyRules = {
  budget: FANTASY_BUDGET,
  squadSize: 5,
  captainMultiplier: 2,
  transfersPerGameweek: 2,
  source: "legacy",
};

export async function resolveFantasyRules(): Promise<ResolvedFantasyRules> {
  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  if (!isCmsResolverActive(flags) || !isFlagEnabled(flags, "cms.fantasy_config.enabled")) {
    return LEGACY_RULES;
  }

  const supabase = await createClient();
  if (!supabase) return LEGACY_RULES;

  const { data } = await supabase
    .from("fantasy_rulesets")
    .select("budget, squad_size, captain_multiplier, transfers_per_gameweek")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!data) return LEGACY_RULES;

  return {
    budget: data.budget,
    squadSize: data.squad_size,
    captainMultiplier: Number(data.captain_multiplier),
    transfersPerGameweek: data.transfers_per_gameweek,
    source: "supabase",
  };
}
