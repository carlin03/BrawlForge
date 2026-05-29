import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const [{ data: scoring }, { data: markets }, { data: events }] = await Promise.all([
    supabase!.from("prediction_scoring").select("*"),
    supabase!.from("prediction_markets").select("*").limit(100),
    supabase!.from("prediction_events").select("*"),
  ]);

  return NextResponse.json({
    ok: true,
    scoring: scoring ?? [],
    markets: markets ?? [],
    events: events ?? [],
  });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  if (body.scoring) {
    const s = body.scoring;
    const { data: existing } = await supabase!
      .from("prediction_scoring")
      .select("rules, streak_bonus")
      .eq("id", "default")
      .maybeSingle();

    await supabase!.from("prediction_scoring").upsert({
      id: "default",
      base_points: s.base_points ?? 10,
      streak_bonus: s.streak_bonus ?? existing?.streak_bonus ?? {},
      rules: { ...(existing?.rules as object), ...(s.rules ?? {}) },
      is_active: true,
    });
    await auditWrite("predictions.scoring", "prediction_scoring", "default");
  }

  return NextResponse.json({ ok: true, message: "Predicciones guardadas" });
}
