import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  csvToObjects,
  rowsToTeams,
  rowsToPlayers,
  rowsToNews,
  rowsToTournaments,
  rowsToTournamentRosters,
  rowsToMatches,
  rowsToFantasyMarket,
} from "@/lib/admin/catalog-csv";
import { mergeTeamRowsWithCatalog, mergePlayerRowsWithCatalog } from "@/lib/admin/catalog-csv-import-merge";

export const runtime = "nodejs";

const IMPORT_KEYS = [
  "teams",
  "players",
  "tournaments",
  "tournament_rosters",
  "matches",
  "news",
  "fantasy_market",
] as const;

async function upsertBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  rows: Record<string, unknown>[],
) {
  if (!supabase || !rows.length) return { count: 0, error: null as string | null };
  const chunk = 80;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = rows.slice(i, i + chunk);
    const { error } = await supabase.from(table).upsert(batch);
    if (error) return { count: i, error: error.message };
  }
  return { count: rows.length, error: null };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const form = await request.formData();
  const syncedAt = new Date().toISOString();
  const summary: Record<string, { count: number; error?: string }> = {};

  const teamsFile = form.get("teams");
  if (teamsFile && teamsFile instanceof File && teamsFile.size > 0) {
    let rows = rowsToTeams(csvToObjects(await teamsFile.text()), syncedAt);
    rows = (await mergeTeamRowsWithCatalog(supabase, rows)) as typeof rows;
    const r = await upsertBatched(supabase, "teams_catalog", rows);
    summary.teams = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  const playersFile = form.get("players");
  if (playersFile && playersFile instanceof File && playersFile.size > 0) {
    let rows = rowsToPlayers(csvToObjects(await playersFile.text()), syncedAt);
    rows = (await mergePlayerRowsWithCatalog(supabase, rows)) as typeof rows;
    let r = await upsertBatched(supabase, "players_catalog", rows);
    if (r.error?.includes("photo_url")) {
      rows = rows.map(({ photo_url, ...rest }) => ({
        ...rest,
        meta: photo_url ? { photo_url } : {},
      })) as typeof rows;
      r = await upsertBatched(supabase, "players_catalog", rows);
    }
    summary.players = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  const tournamentsFile = form.get("tournaments");
  if (tournamentsFile && tournamentsFile instanceof File && tournamentsFile.size > 0) {
    const rows = rowsToTournaments(csvToObjects(await tournamentsFile.text()), syncedAt);
    const r = await upsertBatched(supabase, "tournaments_catalog", rows);
    summary.tournaments = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  const rostersFile = form.get("tournament_rosters");
  if (rostersFile && rostersFile instanceof File && rostersFile.size > 0) {
    const rows = rowsToTournamentRosters(csvToObjects(await rostersFile.text()));
    const r = await upsertBatched(supabase, "tournament_team_rosters", rows);
    summary.tournament_rosters = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  const matchesFile = form.get("matches");
  if (matchesFile && matchesFile instanceof File && matchesFile.size > 0) {
    const rows = rowsToMatches(csvToObjects(await matchesFile.text()), syncedAt);
    const r = await upsertBatched(supabase, "matches_catalog", rows);
    summary.matches = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  const newsFile = form.get("news");
  if (newsFile && newsFile instanceof File && newsFile.size > 0) {
    const rows = rowsToNews(csvToObjects(await newsFile.text()), syncedAt);
    const r = await upsertBatched(supabase, "news_catalog", rows);
    summary.news = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  const fantasyFile = form.get("fantasy_market");
  if (fantasyFile && fantasyFile instanceof File && fantasyFile.size > 0) {
    const rows = rowsToFantasyMarket(csvToObjects(await fantasyFile.text()));
    const r = await upsertBatched(supabase, "fantasy_market_catalog", rows);
    summary.fantasy_market = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  if (!Object.keys(summary).length) {
    return NextResponse.json(
      {
        error: `Sube al menos un CSV (${IMPORT_KEYS.join(", ")})`,
      },
      { status: 400 },
    );
  }

  const anyError = Object.values(summary).some((s) => s.error);
  return NextResponse.json({
    ok: !anyError,
    message: anyError
      ? "Importación parcial — revisa errores"
      : "CSV importado en Supabase. Ya lo verás en Table Editor y en la web.",
    summary,
  });
}
