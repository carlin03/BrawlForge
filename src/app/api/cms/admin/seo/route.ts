import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const [{ data: seo }, { data: redirects }, { data: announcements }] = await Promise.all([
    supabase!.from("seo_entries").select("*").order("entity_type"),
    supabase!.from("redirects").select("*").order("from_path"),
    supabase!.from("announcement_bars").select("*").order("sort_order"),
  ]);

  return NextResponse.json({
    ok: true,
    seo: seo ?? [],
    redirects: redirects ?? [],
    announcements: announcements ?? [],
  });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();

  if (body.globalSeo) {
    const g = body.globalSeo;
    await supabase!.from("seo_entries").upsert(
      {
        entity_type: "site",
        entity_id: "global",
        title: g.title,
        description: g.description,
        meta: { themeColor: g.themeColor },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "entity_type,entity_id" },
    );
    await supabase!.from("site_settings").upsert(
      { key: "seo", value: g, description: "SEO global CMS" },
      { onConflict: "key" },
    );
    await auditWrite("seo.update", "site", "global");
  }

  if (body.redirect) {
    const r = body.redirect;
    await supabase!.from("redirects").upsert({
      from_path: r.from_path,
      to_path: r.to_path,
      code: r.code ?? 301,
      enabled: r.enabled !== false,
    });
    await auditWrite("redirect.upsert", "redirect", r.from_path);
  }

  return NextResponse.json({ ok: true, message: "SEO guardado" });
}
