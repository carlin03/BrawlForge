import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncPredictorScores } from "@/lib/supabase/game-server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para votar" }, { status: 401 });

  const body = await request.json();
  const matchId = body.matchId as string;
  const pick = body.pick as "A" | "B";
  const rewardPoints = Number(body.rewardPoints) || 35;

  if (!matchId || (pick !== "A" && pick !== "B")) {
    return NextResponse.json({ error: "Voto inválido" }, { status: 400 });
  }

  const { error } = await supabase.from("prediction_votes").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      pick,
      reward_points: rewardPoints,
      points_awarded: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await syncPredictorScores(supabase, user.id);
  return NextResponse.json({ ok: true, matchId, pick });
}
