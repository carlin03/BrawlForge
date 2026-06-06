import { NextResponse } from "next/server";
import { loadMatchesFromDb } from "@/lib/cms/resolve/matches";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Solo partidos DB — el cliente fusiona con legacy local. */
export async function GET() {
  try {
    const db = await loadMatchesFromDb();
    return NextResponse.json({
      matchPool: db ?? [],
      matchSource: db?.length ? "supabase" : "legacy",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "matches_error";
    return NextResponse.json({ error: message, matchPool: [], matchSource: "legacy" }, { status: 500 });
  }
}
