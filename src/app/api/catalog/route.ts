import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  CatalogSnapshot,
  CatalogTeamRow,
  CatalogPlayerRow,
  CatalogTournamentRow,
} from "@/lib/supabase/catalog-types";
import { isCuratedPublicTournamentSlug } from "@/lib/data/curated-tournaments";
import { purgePhantomTeamsFromDb } from "@/lib/admin/purge-phantom-teams";
import { filterVisibleTeams, isHiddenTeamSlug } from "@/lib/data/blocked-team-slugs";
import { stripLiquipediaFields } from "@/lib/sanitize-liquipedia";
import { fetchAllRows } from "@/lib/supabase/fetch-all-rows";

export const dynamic = "force-dynamic";

/** Catálogo público desde Supabase (equipos tier B+, jugadores, torneos, mercado fantasy). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tournament = searchParams.get("tournament");
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const [teamsRes, playersRes, toursRes, marketRes] = await Promise.all([
    fetchAllRows<Record<string, unknown>>(supabase, "teams_catalog", {
      order: { column: "rank", ascending: true, nullsFirst: false },
    }),
    fetchAllRows<Record<string, unknown>>(supabase, "players_catalog", {
      order: { column: "fantasy_points", ascending: false },
    }),
    fetchAllRows<Record<string, unknown>>(supabase, "tournaments_catalog"),
    tournament
      ? supabase.from("fantasy_market_catalog").select("*").eq("tournament_slug", tournament)
      : supabase.from("fantasy_market_catalog").select("*").limit(500),
  ]);

  if (teamsRes.error?.code === "42P01" || playersRes.error?.code === "42P01") {
    return NextResponse.json(
      {
        ok: false,
        error: "catalog_tables_missing",
        message: "Ejecuta la migración 20260529200000_catalog.sql en Supabase",
      },
      { status: 503 },
    );
  }

  const err = teamsRes.error ?? playersRes.error ?? toursRes.error ?? marketRes.error;
  if (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }

  await purgePhantomTeamsFromDb(supabase);

  const syncedAt =
    (teamsRes.data[0]?.synced_at as string | undefined) ??
    (playersRes.data[0]?.synced_at as string | undefined) ??
    null;

  const teams = filterVisibleTeams(
    teamsRes.data.map((r) => stripLiquipediaFields(r) as unknown as CatalogTeamRow),
  );
  const teamSlugSet = new Set(teams.map((t) => t.slug));

  const body: CatalogSnapshot & { ok: true } = {
    ok: true,
    teams,
    players: playersRes.data
      .map((r) => stripLiquipediaFields(r) as unknown as CatalogPlayerRow)
      .filter((p) => !p.team_slug?.trim() || teamSlugSet.has(p.team_slug.trim().toLowerCase()))
      .map((p) =>
        p.team_slug && isHiddenTeamSlug(p.team_slug) ? { ...p, team_slug: null } : p,
      ),
    tournaments: toursRes.data
      .filter((t) => isCuratedPublicTournamentSlug(String(t.slug ?? "")))
      .map((r) => stripLiquipediaFields(r) as unknown as CatalogTournamentRow),
    market: marketRes.data ?? [],
    syncedAt,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
    },
  });
}
