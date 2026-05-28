import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchVoteAggregates } from "@/lib/supabase/game-server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ aggregates: {} });
  }
  const aggregates = await fetchVoteAggregates(supabase);
  return NextResponse.json({ aggregates });
}
