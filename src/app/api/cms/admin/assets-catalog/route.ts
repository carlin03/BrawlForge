import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logCmsAudit } from "@/lib/cms/audit";
import {
  emptyGameAssetsCatalog,
  GAME_ASSETS_SETTINGS_KEY,
  type GameAssetsCatalog,
} from "@/lib/data/game-assets-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", GAME_ASSETS_SETTINGS_KEY)
    .maybeSingle();

  const catalog = (data?.value ?? emptyGameAssetsCatalog()) as GameAssetsCatalog;
  return NextResponse.json({ ok: true, catalog });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const body = (await request.json()) as { catalog?: GameAssetsCatalog };
  const catalog: GameAssetsCatalog = {
    ...emptyGameAssetsCatalog(),
    ...body.catalog,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("site_settings").upsert(
    { key: GAME_ASSETS_SETTINGS_KEY, value: catalog, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logCmsAudit({
    action: "assets_catalog.update",
    entityType: "site_settings",
    entityId: GAME_ASSETS_SETTINGS_KEY,
  });
  return NextResponse.json({ ok: true, catalog });
}
