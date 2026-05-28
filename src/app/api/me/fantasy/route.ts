import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FANTASY_SQUAD_SIZE } from "@/lib/data/fantasy";

export async function GET(request: NextRequest) {
  const tournament = request.nextUrl.searchParams.get("tournament");
  if (!tournament) {
    return NextResponse.json({ error: "Falta tournament" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: entry } = await supabase
    .from("fantasy_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("tournament_slug", tournament)
    .maybeSingle();

  if (!entry) {
    return NextResponse.json({ entry: null, squad: [] });
  }

  const { data: squad } = await supabase
    .from("fantasy_squad_slots")
    .select("player_slug, is_captain, event_points")
    .eq("entry_id", entry.id);

  return NextResponse.json({ entry, squad: squad ?? [] });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const tournament = body.tournamentSlug as string;
  const teamName = (body.teamName as string) || "Mi Equipo";
  const squad = body.squad as { playerSlug: string; isCaptain: boolean }[];

  if (!tournament || !Array.isArray(squad) || squad.length > FANTASY_SQUAD_SIZE) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const totalPoints = 0;

  let { data: entry } = await supabase
    .from("fantasy_entries")
    .select("id, transfers_used")
    .eq("user_id", user.id)
    .eq("tournament_slug", tournament)
    .maybeSingle();

  if (!entry) {
    const { data: created, error } = await supabase
      .from("fantasy_entries")
      .insert({
        user_id: user.id,
        tournament_slug: tournament,
        team_name: teamName,
        total_points: totalPoints,
      })
      .select("id, transfers_used")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    entry = created;
  } else {
    await supabase
      .from("fantasy_entries")
      .update({ team_name: teamName, total_points: totalPoints, updated_at: new Date().toISOString() })
      .eq("id", entry.id);
  }

  await supabase.from("fantasy_squad_slots").delete().eq("entry_id", entry.id);

  if (squad.length > 0) {
    const { error: slotErr } = await supabase.from("fantasy_squad_slots").insert(
      squad.map((s) => ({
        entry_id: entry!.id,
        player_slug: s.playerSlug,
        is_captain: s.isCaptain,
        event_points: 0,
      })),
    );
    if (slotErr) return NextResponse.json({ error: slotErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, entryId: entry.id });
}
