import { DEFAULT_LEGACY_CONFIG } from "../defaults";
import { loadFlagsFromDb, loadSettingsFromDb } from "../db";
import { isCmsResolverActive, isFlagEnabled, mergeFlags } from "../flags";
import { createClient } from "@/lib/supabase/server";
import type { SiteSeoSettings } from "../types";

export async function resolveSiteSeo(): Promise<SiteSeoSettings & { source: string }> {
  const base = DEFAULT_LEGACY_CONFIG.settings.seo;
  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  if (!isCmsResolverActive(flags) || !isFlagEnabled(flags, "cms.seo.enabled")) {
    const settingsDb = await loadSettingsFromDb();
    return { ...base, ...settingsDb?.seo, source: "legacy" };
  }

  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from("seo_entries")
      .select("title, description, meta")
      .eq("entity_type", "site")
      .eq("entity_id", "global")
      .maybeSingle();
    if (data?.title) {
      return {
        title: data.title,
        description: data.description ?? base.description,
        themeColor: (data.meta as { themeColor?: string })?.themeColor ?? base.themeColor,
        source: "supabase",
      };
    }
  }

  const settingsDb = await loadSettingsFromDb();
  return { ...base, ...settingsDb?.seo, source: "hybrid" };
}
