import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FANTASY_TOURNAMENT } from "@/lib/data/fantasy";
import { fetchUserGameState, syncPredictorScores } from "@/lib/supabase/game-server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await syncPredictorScores(supabase, user.id);
  const state = await fetchUserGameState(supabase, user.id, DEFAULT_FANTASY_TOURNAMENT);
  return NextResponse.json(state);
}
