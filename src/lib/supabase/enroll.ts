import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_FANTASY_TOURNAMENT } from "@/lib/data/fantasy";
import { ensureFantasyEntry } from "@/lib/supabase/game-server";

/** Inscribe al usuario en fantasy del torneo por defecto (idempotente). */
export async function enrollUserInDefaultFantasy(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await ensureFantasyEntry(supabase, userId, DEFAULT_FANTASY_TOURNAMENT);
}
