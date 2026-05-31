import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logCmsAudit } from "@/lib/cms/audit";
import {
  emptyGameAssetsCatalog,
  GAME_ASSETS_SETTINGS_KEY,
  type GameAssetsCatalog,
} from "@/lib/data/game-assets-catalog";
import {
  fetchBrawlApiBrawlers,
  fetchBrawlApiMaps,
  mergeBrawlerImport,
  mergeMapImport,
} from "@/lib/services/brawlapi-import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    brawlers?: boolean;
    maps?: boolean;
  };
  const importBrawlers = body.brawlers !== false;
  const importMaps = body.maps !== false;

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", GAME_ASSETS_SETTINGS_KEY)
    .maybeSingle();

  const prev = (data?.value ?? emptyGameAssetsCatalog()) as GameAssetsCatalog;
  let brawlers = prev.brawlers;
  let maps = prev.maps;
  let brawlersAdded = 0;
  let mapsAdded = 0;

  try {
    if (importBrawlers) {
      const imported = await fetchBrawlApiBrawlers();
      const before = new Set(brawlers.map((b) => b.name.toLowerCase()));
      brawlers = mergeBrawlerImport(brawlers, imported);
      brawlersAdded = brawlers.filter((b) => !before.has(b.name.toLowerCase())).length;
    }
    if (importMaps) {
      const imported = await fetchBrawlApiMaps();
      const before = new Set(maps.map((m) => m.name.toLowerCase()));
      maps = mergeMapImport(maps, imported);
      mapsAdded = maps.filter((m) => !before.has(m.name.toLowerCase())).length;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "import_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const catalog: GameAssetsCatalog = {
    brawlers,
    maps,
    updated_at: new Date().toISOString(),
    brawlapi_synced_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("site_settings").upsert(
    { key: GAME_ASSETS_SETTINGS_KEY, value: catalog, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logCmsAudit({
    action: "assets_catalog.import_brawlify",
    entityType: "site_settings",
    entityId: GAME_ASSETS_SETTINGS_KEY,
    meta: { brawlersAdded, mapsAdded },
  });

  return NextResponse.json({
    ok: true,
    catalog,
    stats: {
      brawlers: brawlers.length,
      maps: maps.length,
      brawlersAdded,
      mapsAdded,
    },
  });
}
