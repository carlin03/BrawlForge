import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { MAIN_NAV } from "@/lib/nav-config";
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_LEGACY_CONFIG,
  DEFAULT_THEME_TOKENS,
} from "@/lib/cms/defaults";
import { logCmsAudit } from "@/lib/cms/audit";

export const dynamic = "force-dynamic";

/**
 * Siembra site_settings, navigation_items y flags desde el estado actual (legacy).
 * Idempotente — no sobrescribe valores existentes en site_settings.
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const results: string[] = [];

  for (const [flag, enabled] of Object.entries(DEFAULT_FEATURE_FLAGS)) {
    const { error } = await supabase
      .from("site_feature_flags")
      .upsert({ flag, enabled, description: `Seed Fase 0 — ${flag}` }, { onConflict: "flag", ignoreDuplicates: false });
    if (!error) results.push(`flag:${flag}`);
  }

  const branding = DEFAULT_LEGACY_CONFIG.settings.branding;
  const seo = DEFAULT_LEGACY_CONFIG.settings.seo;

  for (const [key, value] of [
    ["branding", branding],
    ["seo", seo],
  ] as const) {
    const { data: existing } = await supabase.from("site_settings").select("key").eq("key", key).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("site_settings").insert({
        key,
        value,
        description: "Snapshot inicial legacy",
      });
      if (!error) results.push(`settings:${key}`);
    }
  }

  await supabase.from("navigation_menus").upsert(
    { id: "main", label: "Navegación principal", location: "header" },
    { onConflict: "id" },
  );

  const { count } = await supabase
    .from("navigation_items")
    .select("id", { count: "exact", head: true })
    .eq("menu_id", "main");

  if (!count) {
    const items = MAIN_NAV.map((item, i) => ({
      menu_id: "main",
      label: item.label,
      href: item.href,
      sort_order: i * 10,
      accent: "accent" in item ? item.accent : null,
      visible: true,
    }));
    const { error } = await supabase.from("navigation_items").insert(items);
    if (!error) results.push(`navigation:${items.length}`);
  }

  await supabase.from("theme_token_sets").upsert(
    {
      id: "global-default",
      name: "BrawlForge Default",
      scope: "global",
      tokens: DEFAULT_THEME_TOKENS,
      is_active: true,
    },
    { onConflict: "id" },
  );
  results.push("theme:global-default");

  await logCmsAudit({
    action: "seed.phase0",
    entityType: "cms",
    meta: { results },
  });

  return NextResponse.json({
    ok: true,
    message: "Seed Fase 0 completado (flags, settings, nav, theme)",
    results,
  });
}
