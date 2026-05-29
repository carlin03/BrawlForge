import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const [{ data: page }, { data: curated }, { data: registry }] = await Promise.all([
    supabase!.from("cms_pages").select("*").eq("slug", "home").maybeSingle(),
    supabase!.from("home_curated_config").select("*").eq("id", "default").maybeSingle(),
    supabase!.from("cms_block_registry").select("*").order("block_type"),
  ]);

  let blocks: unknown[] = [];
  if (page) {
    const { data: version } = await supabase!
      .from("cms_page_versions")
      .select("id")
      .eq("page_slug", "home")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (version) {
      const { data: sections } = await supabase!
        .from("cms_sections")
        .select("id")
        .eq("page_version_id", version.id);
      const sectionIds = (sections ?? []).map((s) => s.id);
      if (sectionIds.length) {
        const { data: b } = await supabase!
          .from("cms_blocks")
          .select("*")
          .in("section_id", sectionIds)
          .order("sort_order");
        blocks = b ?? [];
      }
    }
  }

  return NextResponse.json({
    ok: true,
    page,
    curated,
    registry: registry ?? [],
    blocks,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();

  if (body.curated) {
    await supabase!.from("home_curated_config").upsert({
      id: "default",
      club_slugs: body.curated.club_slugs ?? [],
      match_limits: body.curated.match_limits ?? {},
      updated_at: new Date().toISOString(),
    });
    await auditWrite("home.curated", "home_curated_config", "default");
  }

  return NextResponse.json({ ok: true, message: "Home config guardada" });
}
