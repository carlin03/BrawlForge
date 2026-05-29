import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPredictionLeaderboard } from "@/lib/supabase/game-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 12);
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ leaderboard: [], myRank: null });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const leaderboard = await fetchPredictionLeaderboard(supabase, Math.min(50, Math.max(5, limit)));

  let myRank: number | null = null;
  let myPoints = 0;
  let gapToNext: number | null = null;
  let aboveRank: number | null = null;

  if (user) {
    const hit = leaderboard.find((r) => r.user_id === user.id);
    if (hit) {
      myRank = hit.rank;
      myPoints = hit.predict_points;
    } else {
      const { data: me } = await supabase
        .from("profiles")
        .select("predict_points")
        .eq("id", user.id)
        .maybeSingle();
      myPoints = Number(me?.predict_points ?? 0);
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("predict_points", myPoints);
      myRank = (count ?? 0) + 1;
    }

    if (myRank != null && myRank > 1) {
      const rank = myRank;
      const above = leaderboard.find((r) => r.rank === rank - 1);
      if (above) {
        aboveRank = above.rank;
        gapToNext = Math.max(1, above.predict_points - myPoints + 1);
      }
    }
  }

  return NextResponse.json({ leaderboard, myRank, myPoints, gapToNext, aboveRank });
}
