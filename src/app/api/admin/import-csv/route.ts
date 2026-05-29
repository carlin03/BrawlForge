import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { csvToObjects, rowsToTeams, rowsToPlayers, rowsToNews } from "@/lib/admin/catalog-csv";

export const runtime = "nodejs";

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
    const text = await teamsFile.text();
    const rows = rowsToTeams(csvToObjects(text), syncedAt);
    const r = await upsertBatched(supabase, "teams_catalog", rows);
    summary.teams = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  const playersFile = form.get("players");
  if (playersFile && playersFile instanceof File && playersFile.size > 0) {
    const text = await playersFile.text();
    let rows = rowsToPlayers(csvToObjects(text), syncedAt);
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

  const newsFile = form.get("news");
  if (newsFile && newsFile instanceof File && newsFile.size > 0) {
    const text = await newsFile.text();
    const rows = rowsToNews(csvToObjects(text), syncedAt);
    const r = await upsertBatched(supabase, "news_catalog", rows);
    summary.news = { count: r.count, ...(r.error ? { error: r.error } : {}) };
  }

  if (!Object.keys(summary).length) {
    return NextResponse.json({ error: "Sube al menos un archivo CSV (teams, players o news)" }, { status: 400 });
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
