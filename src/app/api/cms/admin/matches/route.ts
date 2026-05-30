import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";
import {
  buildCatalogUpsertBatch,
  getWebMatchesForCatalog,
} from "@/lib/services/catalog/matches-catalog-svc";

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
    .limit(500);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  const catalog = data ?? [];
  const existingIds = new Set(catalog.map((m) => m.id));
  const { pool, toImport, total } = getWebMatchesForCatalog(existingIds);

  return NextResponse.json({
    ok: true,
    matches: catalog,
    web: {
      totalOnSite: total,
      inCatalog: catalog.length,
      pendingImport: toImport.length,
    },
    hint:
      toImport.length > 0
        ? "La web muestra partidos del calendario BSC en código. Pulsa «Importar partidos de la web» para editarlos aquí."
        : undefined,
  });
}

/** Copia el calendario visible en la web → matches_catalog (editable en admin). */
export async function PUT(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  let limit: number | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.limit === "number") limit = Math.min(500, Math.max(1, body.limit));
  } catch {
    /* sin body */
  }

  const { data: existing } = await supabase!
    .from("matches_catalog")
    .select("id")
    .limit(1000);
  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const { toImport, total } = getWebMatchesForCatalog(existingIds);
  const batch = buildCatalogUpsertBatch(toImport, limit);

  if (!batch.length) {
    return NextResponse.json({
      ok: true,
      imported: 0,
      message: "Todos los partidos de la web ya están en el catálogo.",
      webTotal: total,
      catalogCount: existingIds.size,
    });
  }

  const { error: dbErr } = await supabase!.from("matches_catalog").upsert(batch, { onConflict: "id" });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  await supabase!
    .from("site_feature_flags")
    .upsert(
      [
        { flag: "cms.matches.enabled", enabled: true, description: "Partidos desde matches_catalog" },
        { flag: "cms.catalog.primary", enabled: true, description: "Catálogo CMS prioritario" },
      ],
      { onConflict: "flag" },
    );

  await auditWrite("match.sync_from_web", "match", undefined, {
    imported: batch.length,
    pending: toImport.length - batch.length,
  });

  return NextResponse.json({
    ok: true,
    imported: batch.length,
    message: `Importados ${batch.length} partidos. Ya puedes editarlos y poner en vivo.`,
    webTotal: total,
    catalogCount: existingIds.size + batch.length,
  });
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
  await supabase!.from("match_sync_state").upsert(
    {
      match_id: payload.id,
      source: "manual",
      last_sync_at: new Date().toISOString(),
      meta: { editor: "admin" },
    },
    { onConflict: "match_id" },
  );
  await auditWrite("match.upsert", "match", payload.id);
  return NextResponse.json({ ok: true, message: `Partido ${payload.id} guardado` });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  const id = body.id ?? body.match?.id;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { data: existing } = await supabase!
    .from("matches_catalog")
    .select("meta")
    .eq("id", id)
    .maybeSingle();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.stage !== undefined) patch.stage = body.stage ? String(body.stage) : null;
  if (body.format !== undefined) patch.format = String(body.format);
  if (body.status !== undefined) patch.status = String(body.status);
  if (body.score_a !== undefined) patch.score_a = Number(body.score_a);
  if (body.score_b !== undefined) patch.score_b = Number(body.score_b);
  if (body.meta !== undefined) {
    const prev =
      existing?.meta && typeof existing.meta === "object"
        ? (existing.meta as Record<string, unknown>)
        : {};
    patch.meta = { ...prev, ...(body.meta as Record<string, unknown>) };
  }

  const { error: dbErr } = await supabase!.from("matches_catalog").update(patch).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  await auditWrite("match.patch", "match", String(id));
  return NextResponse.json({ ok: true, message: `Partido ${id} actualizado` });
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
