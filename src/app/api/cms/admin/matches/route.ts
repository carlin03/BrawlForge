import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const { data, error: dbErr } = await supabase!
    .from("matches_catalog")
    .select("*")
    .order("scheduled_at", { ascending: false })
    .limit(200);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, matches: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  const row = body.match ?? body;
  if (!row?.id || !row?.team_a_slug || !row?.team_b_slug) {
    return NextResponse.json({ error: "id, team_a_slug, team_b_slug requeridos" }, { status: 400 });
  }

  const payload = {
    id: String(row.id),
    tournament_slug: String(row.tournament_slug ?? ""),
    team_a_slug: String(row.team_a_slug),
    team_b_slug: String(row.team_b_slug),
    scheduled_at: String(row.scheduled_at ?? new Date().toISOString()),
    status: String(row.status ?? "upcoming"),
    stage: row.stage ? String(row.stage) : null,
    region: row.region ? String(row.region) : null,
    format: String(row.format ?? "Bo3"),
    score_a: Number(row.score_a ?? 0),
    score_b: Number(row.score_b ?? 0),
    published: row.published !== false,
    meta: row.meta ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error: dbErr } = await supabase!.from("matches_catalog").upsert(payload);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  await auditWrite("match.upsert", "match", payload.id);
  return NextResponse.json({ ok: true, message: `Partido ${payload.id} guardado` });
}

export async function DELETE(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { error: dbErr } = await supabase!.from("matches_catalog").delete().eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  await auditWrite("match.delete", "match", id);
  return NextResponse.json({ ok: true });
}
