import { NextResponse } from "next/server";
import { requireCmsAdmin } from "@/lib/cms/admin-api";
import { loadMatchesFromDb, mergeMatchPools } from "@/lib/cms/resolve/matches";
import { auditMatchPool } from "@/lib/data/match-schedule-audit";
import { getMatchPool } from "@/lib/data/match-pool";
import { matches as legacyMatches } from "@/lib/data/matches";

export const dynamic = "force-dynamic";

/** GET ?view=site|catalog|merged — informe de calidad del calendario */
export async function GET(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const view = new URL(request.url).searchParams.get("view") ?? "merged";
  const db = await loadMatchesFromDb();

  let pool = getMatchPool();
  if (view === "catalog") {
    pool = db ?? [];
  } else if (view === "merged" && db?.length) {
    pool = mergeMatchPools(db, legacyMatches);
  } else if (view === "legacy") {
    pool = legacyMatches;
  }

  const report = auditMatchPool(pool);

  return NextResponse.json({
    ok: true,
    view,
    catalogRowCount: db?.length ?? 0,
    report,
  });
}
