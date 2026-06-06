import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EsportsMatch } from "@/lib/data/esports-match-types";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { enrichMatchForPool } from "@/lib/data/match-pool-enrich";
import { fixMislabeledWorldFinalsSlug } from "@/lib/data/tournament-slug-sanitize";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const MATCH_COLS =
  "id, tournament_slug, team_a_slug, team_b_slug, scheduled_at, status, stage, region, format, score_a, score_b, meta";

function rowToMatch(row: {
  id: string;
  tournament_slug: string;
  team_a_slug: string;
  team_b_slug: string;
  scheduled_at: string;
  status: string;
  stage: string | null;
  region: string | null;
  format: string | null;
  score_a: number;
  score_b: number;
  meta?: unknown;
}): EsportsMatch {
  return fixMislabeledWorldFinalsSlug(
    enrichMatchForPool({
      id: row.id,
      teamASlug: row.team_a_slug,
      teamBSlug: row.team_b_slug,
      scoreA: row.score_a,
      scoreB: row.score_b,
      tournamentSlug: row.tournament_slug,
      stage: row.stage ?? "",
      date: row.scheduled_at,
      status: row.status as EsportsMatch["status"],
      region: (row.region ?? "GLOBAL") as EsportsMatch["region"],
      format: row.format ?? "Bo3",
      meta: parseMatchMeta(row.meta),
    }),
  );
}

async function fetchTab(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  tab: "live" | "upcoming" | "results",
  limit: number,
): Promise<EsportsMatch[]> {
  let query = supabase.from("matches_catalog").select(MATCH_COLS).eq("published", true);

  if (tab === "live") {
    query = query.eq("status", "live").order("scheduled_at", { ascending: false });
  } else if (tab === "upcoming") {
    query = query.eq("status", "upcoming").order("scheduled_at", { ascending: true });
  } else {
    query = query.in("status", ["finished", "cancelled"]).order("scheduled_at", { ascending: false });
  }

  const { data, error } = await query.limit(limit);
  if (error || !data?.length) return [];
  return data.map(rowToMatch);
}

/** Partidos para home — consultas acotadas, sin pool completo. */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, live: [], upcoming: [], results: [], liveCount: 0 });
  }

  const [live, upcoming, results, liveCountRes] = await Promise.all([
    fetchTab(supabase, "live", 6),
    fetchTab(supabase, "upcoming", 6),
    fetchTab(supabase, "results", 6),
    supabase
      .from("matches_catalog")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .eq("status", "live"),
  ]);

  return NextResponse.json({
    ok: true,
    live,
    upcoming,
    results,
    liveCount: liveCountRes.count ?? live.length,
  });
}
