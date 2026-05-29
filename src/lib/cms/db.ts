import { createClient } from "@/lib/supabase/server";
import type { FlagMap } from "./flags";
import type {
  CmsAuditEntry,
  CmsModuleInfo,
  ResolvedNavItem,
  ResolvedSiteSettings,
  ResolvedThemeTokens,
} from "./types";
import {
  DEFAULT_LEGACY_CONFIG,
  DEFAULT_NAVIGATION,
  DEFAULT_THEME_TOKENS,
} from "./defaults";

export async function loadFlagsFromDb(): Promise<FlagMap | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_feature_flags").select("flag, enabled");
  if (error) {
    if (error.code === "42P01") return null;
    return null;
  }
  const map: FlagMap = {};
  for (const row of data ?? []) {
    if (row.flag) map[row.flag] = Boolean(row.enabled);
  }
  return map;
}

export async function loadSettingsFromDb(): Promise<Partial<ResolvedSiteSettings> | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) {
    if (error.code === "42P01") return null;
    return null;
  }
  if (!data?.length) return null;
  const out: Partial<ResolvedSiteSettings> = {};
  for (const row of data) {
    const v = row.value as Record<string, unknown>;
    if (row.key === "branding" && v) out.branding = v as unknown as ResolvedSiteSettings["branding"];
    if (row.key === "seo" && v) out.seo = v as unknown as ResolvedSiteSettings["seo"];
    if (row.key === "card_watermark" && v) {
      out.cardWatermark = v as unknown as ResolvedSiteSettings["cardWatermark"];
    }
  }
  return Object.keys(out).length ? out : null;
}

export async function loadNavigationFromDb(): Promise<ResolvedNavItem[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("navigation_items")
    .select("label, href, sort_order, accent, visible")
    .eq("menu_id", "main")
    .eq("visible", true)
    .order("sort_order", { ascending: true });
  if (error) {
    if (error.code === "42P01") return null;
    return null;
  }
  if (!data?.length) return null;
  return data.map((row) => ({
    label: row.label,
    href: row.href,
    ...(row.accent === "fantasy" || row.accent === "predict"
      ? { accent: row.accent as "fantasy" | "predict" }
      : {}),
  }));
}

export async function loadThemeFromDb(): Promise<ResolvedThemeTokens | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("theme_token_sets")
    .select("tokens")
    .eq("scope", "global")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) {
    if (error.code === "42P01") return null;
    return null;
  }
  if (!data?.tokens || typeof data.tokens !== "object") return null;
  const t = data.tokens as Partial<ResolvedThemeTokens>;
  if (!t.colors || !t.layout) return null;
  return {
    colors: { ...DEFAULT_THEME_TOKENS.colors, ...t.colors },
    layout: { ...DEFAULT_THEME_TOKENS.layout, ...t.layout },
  };
}

export async function loadModulesFromDb(): Promise<CmsModuleInfo[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cms_modules")
    .select("id, label, phase, status, description, sort_order")
    .order("sort_order", { ascending: true });
  if (error) {
    if (error.code === "42P01") return null;
    return null;
  }
  if (!data?.length) return null;
  return data.map((row) => ({
    id: row.id,
    label: row.label,
    phase: row.phase,
    status: row.status as CmsModuleInfo["status"],
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

export async function loadAuditLog(limit = 50): Promise<CmsAuditEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cms_audit_log")
    .select("id, action, entity_type, entity_id, created_at, meta")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    meta: (row.meta as Record<string, unknown>) ?? {},
  }));
}

export function buildDefaultSiteSettings(): ResolvedSiteSettings {
  return { ...DEFAULT_LEGACY_CONFIG.settings };
}
