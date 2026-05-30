import { createClient } from "@/lib/supabase/server";
import type { PlayoffBracketsStore } from "@/lib/data/bracket-config";

const SETTINGS_KEY = "playoff_brackets";

export async function loadPlayoffBracketsFromDb(): Promise<PlayoffBracketsStore> {
  const supabase = await createClient();
  if (!supabase) return {};

  const { data, error } = await supabase.from("site_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  if (error || !data?.value || typeof data.value !== "object") return {};
  return data.value as PlayoffBracketsStore;
}
