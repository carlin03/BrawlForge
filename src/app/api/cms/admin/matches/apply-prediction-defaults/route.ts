import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";
import { applyDefaultPredictionsToMeta, isPendingTeamSlug, parseMatchMeta } from "@/lib/data/match-meta";

export const dynamic = "force-dynamic";

/** Activa todas las categorías de predicción en partidos con equipos reales (persiste en meta). */
export async function POST() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const { data: rows, error: dbErr } = await supabase!
    .from("matches_catalog")
    .select("id, meta, team_a_slug, team_b_slug, status")
    .limit(1000);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  let updated = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    const a = String(row.team_a_slug ?? "");
    const b = String(row.team_b_slug ?? "");
    if (isPendingTeamSlug(a) || isPendingTeamSlug(b)) {
      skipped += 1;
      continue;
    }
    if (String(row.status) === "cancelled") {
      skipped += 1;
      continue;
    }

    const meta = applyDefaultPredictionsToMeta(parseMatchMeta(row.meta));
    const { error: upErr } = await supabase!
      .from("matches_catalog")
      .update({ meta, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (!upErr) updated += 1;
  }

  await auditWrite("match.apply_prediction_defaults", "match", undefined, { updated, skipped });

  return NextResponse.json({
    ok: true,
    updated,
    skipped,
    message: `Predicciones completas aplicadas en ${updated} partido(s).`,
  });
}
