import { NextResponse } from "next/server";
import { loadMatchesFromDb } from "@/lib/cms/resolve/matches";
import { buildEsportAnalytics } from "@/lib/data/esport-analytics";
import { getLegacyMatchList } from "@/lib/data/legacy-matches";
import { mergeMatchPools } from "@/lib/data/merge-match-pools";
import { buildPublicCalendarPool } from "@/lib/data/match-schedule-trust";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
};

/** Analytics esport pre-calculados en servidor (evita bloquear el móvil). */
export async function GET() {
  try {
    const db = await loadMatchesFromDb();
    const legacy = getLegacyMatchList();
    const base = db?.length ? mergeMatchPools(db, legacy) : legacy;
    const overview = buildEsportAnalytics(buildPublicCalendarPool(base));
    return NextResponse.json({ ok: true, overview }, { headers: CACHE_HEADERS });
  } catch (e) {
    const message = e instanceof Error ? e.message : "esport_error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
