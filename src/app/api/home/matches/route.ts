import { NextResponse } from "next/server";
import { getHomeMatchesSnapshot } from "@/lib/data/home-matches-server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** Partidos para home — consultas acotadas, sin pool completo. */
export async function GET() {
  const snapshot = await getHomeMatchesSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=45, stale-while-revalidate=300",
    },
  });
}
