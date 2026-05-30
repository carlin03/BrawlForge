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
  const exactScore =
    typeof body.exactScore === "string" && body.exactScore.trim()
      ? body.exactScore.trim()
      : null;

  if (!matchId || (pick !== "A" && pick !== "B")) {
    return NextResponse.json({ error: "Voto inválido" }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    match_id: matchId,
    pick,
    reward_points: rewardPoints,
    points_awarded: 0,
    updated_at: new Date().toISOString(),
  };
  if (exactScore !== null) row.exact_score = exactScore;

  const { error } = await supabase.from("prediction_votes").upsert(row, { onConflict: "user_id,match_id" });

  if (error) {
    const missingCol = error.message?.includes("exact_score");
    if (missingCol && exactScore) {
      const { error: retryErr } = await supabase.from("prediction_votes").upsert(
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
      if (retryErr) {
        return NextResponse.json(
          {
            error:
              "Ejecuta supabase/migrations/20260530100000_prediction_exact_score.sql en Supabase.",
          },
          { status: 400 },
        );
      }
    } else {
      const msg = error.message?.includes("does not exist")
        ? "Ejecuta ALL_IN_ONE_SETUP.sql en Supabase (tabla prediction_votes)."
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  await syncPredictorScores(supabase, user.id);
  return NextResponse.json({ ok: true, matchId, pick, exactScore });
}

/** Actualiza solo el resultado exacto (requiere voto previo). */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });

  const body = await request.json();
  const matchId = body.matchId as string;
  const exactScore =
    body.exactScore === null || body.exactScore === ""
      ? null
      : typeof body.exactScore === "string"
        ? body.exactScore.trim()
        : null;

  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

  const { data: existing } = await supabase
    .from("prediction_votes")
    .select("pick")
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .maybeSingle();

  if (!existing?.pick) {
    return NextResponse.json({ error: "Vota primero al ganador del partido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("prediction_votes")
    .update({ exact_score: exactScore, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("match_id", matchId);

  if (error) {
    if (error.message?.includes("exact_score")) {
      return NextResponse.json(
        {
          error:
            "Ejecuta supabase/migrations/20260530100000_prediction_exact_score.sql en Supabase.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, matchId, exactScore });
}
