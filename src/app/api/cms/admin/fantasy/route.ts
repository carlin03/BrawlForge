import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const [{ data: seasons }, { data: rules }, { data: gameweeks }, { data: market }] = await Promise.all([
    supabase!.from("fantasy_seasons").select("*"),
    supabase!.from("fantasy_rulesets").select("*"),
    supabase!.from("fantasy_gameweeks").select("*"),
    supabase!.from("fantasy_market_catalog").select("*").limit(50),
  ]);

  return NextResponse.json({
    ok: true,
    seasons: seasons ?? [],
    rules: rules ?? [],
    gameweeks: gameweeks ?? [],
    market: market ?? [],
  });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  if (body.ruleset) {
    const r = body.ruleset;
    await supabase!.from("fantasy_rulesets").upsert({
      id: r.id ?? "bsc-2026-default",
      season_id: r.season_id ?? "bsc-2026",
      budget: r.budget ?? 50000000,
      squad_size: r.squad_size ?? 5,
      captain_multiplier: r.captain_multiplier ?? 2,
      transfers_per_gameweek: r.transfers_per_gameweek ?? 2,
      rules: r.rules ?? {},
      is_active: true,
    });
    await auditWrite("fantasy.ruleset", "fantasy_ruleset", r.id);
  }

  return NextResponse.json({ ok: true, message: "Fantasy config guardada" });
}
