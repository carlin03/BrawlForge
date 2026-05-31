import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  CatalogSnapshot,
  CatalogTeamRow,
  CatalogPlayerRow,
  CatalogTournamentRow,
} from "@/lib/supabase/catalog-types";
import { isBscCircuitSlug } from "@/lib/data/bsc-tournaments";
import { stripLiquipediaFields } from "@/lib/sanitize-liquipedia";

export const dynamic = "force-dynamic";

/** Catálogo público desde Supabase (equipos, jugadores, torneos, mercado fantasy). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tournament = searchParams.get("tournament");
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const [teamsRes, playersRes, toursRes, marketRes] = await Promise.all([
    supabase.from("teams_catalog").select("*").order("rank", { ascending: true, nullsFirst: false }),
    supabase.from("players_catalog").select("*").order("fantasy_points", { ascending: false }),
    supabase.from("tournaments_catalog").select("*"),
    tournament
      ? supabase.from("fantasy_market_catalog").select("*").eq("tournament_slug", tournament)
      : supabase.from("fantasy_market_catalog").select("*").limit(500),
  ]);

  if (teamsRes.error?.code === "42P01" || playersRes.error?.code === "42P01") {
    return NextResponse.json(
      { ok: false, error: "catalog_tables_missing", message: "Ejecuta la migración 20260529200000_catalog.sql en Supabase" },
      { status: 503 },
    );
  }

  const err = teamsRes.error ?? playersRes.error ?? toursRes.error ?? marketRes.error;
  if (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }

  const syncedAt =
    teamsRes.data?.[0]?.synced_at ??
    playersRes.data?.[0]?.synced_at ??
    null;

  const body: CatalogSnapshot & { ok: true } = {
    ok: true,
    teams: (teamsRes.data ?? []).map((r) =>
      stripLiquipediaFields(r as Record<string, unknown>),
    ) as unknown as CatalogTeamRow[],
    players: (playersRes.data ?? []).map((r) =>
      stripLiquipediaFields(r as Record<string, unknown>),
    ) as unknown as CatalogPlayerRow[],
    tournaments: (toursRes.data ?? [])
      .filter((t) => isBscCircuitSlug(t.slug))
      .map((r) => stripLiquipediaFields(r as Record<string, unknown>)) as unknown as CatalogTournamentRow[],
    market: marketRes.data ?? [],
    syncedAt,
  };

  return NextResponse.json(body);
}
