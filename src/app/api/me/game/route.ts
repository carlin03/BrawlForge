import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FANTASY_TOURNAMENT } from "@/lib/data/fantasy";
import { ensureFantasyEntry, fetchUserGameState, syncPredictorScores } from "@/lib/supabase/game-server";

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

  try {
    await syncPredictorScores(supabase, user.id);
    await ensureFantasyEntry(supabase, user.id, DEFAULT_FANTASY_TOURNAMENT);
    const state = await fetchUserGameState(supabase, user.id, DEFAULT_FANTASY_TOURNAMENT);
    return NextResponse.json(state);
  } catch {
    return NextResponse.json({
      votes: {},
      fantasy: {},
      predictPoints: 0,
      predictStreak: 0,
      predictCorrect: 0,
      predictAttempts: 0,
      fantasyPoints: 0,
      fantasyRank: null,
      setupRequired: true,
    });
  }
}
