import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  emptyGameAssetsCatalog,
  GAME_ASSETS_SETTINGS_KEY,
  type GameAssetsCatalog,
} from "@/lib/data/game-assets-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ catalog: emptyGameAssetsCatalog() });
  }

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", GAME_ASSETS_SETTINGS_KEY)
    .maybeSingle();

  const catalog = (data?.value ?? emptyGameAssetsCatalog()) as GameAssetsCatalog;
  return NextResponse.json({ catalog });
}
