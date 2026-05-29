import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logCmsAudit } from "@/lib/cms/audit";
import { resolveCmsConfig } from "@/lib/cms/resolve";
import { loadAuditLog } from "@/lib/cms/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const config = await resolveCmsConfig();
  const audit = await loadAuditLog(40);

  const supabase = await createClient();
  let dbReady = false;
  if (supabase) {
    const { error } = await supabase.from("site_feature_flags").select("flag").limit(1);
    dbReady = !error || error.code !== "42P01";
  }

  return NextResponse.json({
    ok: true,
    cmsReady: dbReady,
    config,
    audit,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as {
    flags?: Record<string, boolean>;
    settings?: {
      branding?: Record<string, unknown>;
      seo?: Record<string, unknown>;
      card_watermark?: Record<string, unknown>;
    };
  };

  const updated: string[] = [];

  if (body.flags) {
    for (const [flag, enabled] of Object.entries(body.flags)) {
      const { error } = await supabase
        .from("site_feature_flags")
        .upsert({ flag, enabled: Boolean(enabled), updated_at: new Date().toISOString() }, { onConflict: "flag" });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      updated.push(`flag:${flag}`);
    }
  }

  if (body.settings?.branding) {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "branding",
        value: body.settings.branding,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    updated.push("settings:branding");
  }

  if (body.settings?.seo) {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "seo",
        value: body.settings.seo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    updated.push("settings:seo");
  }

  if (body.settings?.card_watermark) {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "card_watermark",
        value: body.settings.card_watermark,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    updated.push("settings:card_watermark");
  }

  await logCmsAudit({
    action: "platform.update",
    entityType: "site_settings",
    diff: { updated },
    meta: body,
  });

  const config = await resolveCmsConfig();
  return NextResponse.json({ ok: true, message: "Plataforma actualizada", updated, config });
}
