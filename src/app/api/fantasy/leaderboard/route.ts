import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchFantasyLeaderboard } from "@/lib/supabase/game-server";
import { DEFAULT_FANTASY_TOURNAMENT } from "@/lib/data/fantasy";

export async function GET(request: NextRequest) {
  const tournament = request.nextUrl.searchParams.get("tournament") ?? DEFAULT_FANTASY_TOURNAMENT;
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 100);

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ leaderboard: [], participants: 0 });
  }

  const [leaderboard, countRes] = await Promise.all([
    fetchFantasyLeaderboard(supabase, tournament, limit),
    supabase.rpc("registered_users_count"),
  ]);

  const total =
    countRes.data != null ? Number(countRes.data) : leaderboard.length;

  return NextResponse.json({
    leaderboard,
    participants: total,
    registeredUsers: total,
  });
}
