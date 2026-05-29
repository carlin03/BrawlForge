import { NextResponse } from "next/server";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/cms/defaults";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

/** Activa todos los feature flags CMS (super admin). */
export async function POST() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  for (const flag of Object.keys(DEFAULT_FEATURE_FLAGS)) {
    await supabase!
      .from("site_feature_flags")
      .upsert({ flag, enabled: true, updated_at: new Date().toISOString() }, { onConflict: "flag" });
  }

  await auditWrite("cms.activate_all", "cms", "flags");
  return NextResponse.json({ ok: true, message: "Todos los módulos CMS activados" });
}
