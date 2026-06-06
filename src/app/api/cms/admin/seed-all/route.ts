import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { getLegacyMatchList } from "@/lib/data/matches";
import { logCmsAudit } from "@/lib/cms/audit";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/cms/defaults";

export const dynamic = "force-dynamic";

/** Siembra idempotente Fases 0–11 (legacy → CMS). No activa flags. */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const results: string[] = [];

  for (const [flag] of Object.entries(DEFAULT_FEATURE_FLAGS)) {
    await supabase
      .from("site_feature_flags")
      .upsert({ flag, enabled: true, description: `Seed producción — ${flag}` }, { onConflict: "flag" });
    results.push(`flag:${flag}=on`);
  }

  const batch = getLegacyMatchList().slice(0, 120).map((m) => ({
    id: m.id,
    tournament_slug: m.tournamentSlug,
    team_a_slug: m.teamASlug,
    team_b_slug: m.teamBSlug,
    scheduled_at: m.date,
    status: m.status,
    stage: m.stage || null,
    region: m.region || null,
    format: m.format || "Bo3",
    score_a: m.scoreA,
    score_b: m.scoreB,
    published: true,
  }));

  if (batch.length) {
    const { error } = await supabase.from("matches_catalog").upsert(batch, { onConflict: "id" });
    if (!error) results.push(`matches:${batch.length}`);
  }

  await supabase.from("cms_pages").upsert(
    { slug: "home", route: "/", title: "Inicio", status: "draft" },
    { onConflict: "slug" },
  );

  const { data: existingVer } = await supabase
    .from("cms_page_versions")
    .select("id")
    .eq("page_slug", "home")
    .limit(1)
    .maybeSingle();

  if (!existingVer) {
    const { data: ver } = await supabase
      .from("cms_page_versions")
      .insert({ page_slug: "home", version: 1, status: "draft" })
      .select("id")
      .single();

    if (ver) {
      const { data: sec } = await supabase
        .from("cms_sections")
        .insert({ page_version_id: ver.id, label: "Principal", sort_order: 0 })
        .select("id")
        .single();

      if (sec) {
        const blocks = [
          "hero",
          "clubs_marquee",
          "matches_strip",
          "vote_strip",
          "news",
          "tournaments",
        ].map((block_type, i) => ({
          section_id: sec.id,
          block_type,
          sort_order: i * 10,
          enabled: true,
          props: {},
        }));
        await supabase.from("cms_blocks").insert(blocks);
        results.push("home:blocks");
      }
    }
  }

  await logCmsAudit({ action: "seed.all", entityType: "cms", meta: { results } });

  return NextResponse.json({
    ok: true,
    message: "Seed completo (flags off, datos legacy en CMS)",
    results,
  });
}
