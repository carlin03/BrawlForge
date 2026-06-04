import type { EsportsMatch } from "@/lib/data/matches";
import { normalizePlayoffPool } from "@/lib/data/playoff-pool-normalize";
import { matches as legacyMatches } from "@/lib/data/matches";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { matchDedupeKey, pickBetterMatch } from "@/lib/data/playoff-pool-normalize";
import { createClient } from "@/lib/supabase/server";
import { isCmsResolverActive, isFlagEnabled, mergeFlags } from "../flags";
import { loadFlagsFromDb } from "../db";

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
  return {
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
  };
}

export async function loadMatchesFromDb(): Promise<EsportsMatch[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("matches_catalog")
    .select(
      "id, tournament_slug, team_a_slug, team_b_slug, scheduled_at, status, stage, region, format, score_a, score_b, meta",
    )
    .eq("published", true)
    .order("scheduled_at", { ascending: true });
  if (error) {
    if (error.code === "42P01") return null;
    return null;
  }
  if (!data?.length) return null;
  return data.map(rowToMatch);
}

/** Fusiona DB + legacy: una fila por cruce (torneo+ronda+equipos+día); gana CMS sobre seed. */
export function mergeMatchPools(db: EsportsMatch[], legacy: EsportsMatch[]): EsportsMatch[] {
  const dbIds = new Set(db.map((m) => m.id));
  const byKey = new Map<string, EsportsMatch>();

  function upsert(incoming: EsportsMatch) {
    const key = matchDedupeKey(incoming);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, incoming);
      return;
    }
    const prevDb = dbIds.has(prev.id);
    const nextDb = dbIds.has(incoming.id);
    if (prevDb && !nextDb) return;
    if (!prevDb && nextDb) {
      byKey.set(key, incoming);
      return;
    }
    byKey.set(key, pickBetterMatch(prev, incoming));
  }

  for (const m of legacy) upsert(m);
  for (const m of db) upsert(m);

  return normalizePlayoffPool([...byKey.values()]).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export async function resolveMatchList(): Promise<{
  pool: EsportsMatch[];
  source: "legacy" | "hybrid" | "supabase";
}> {
  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  if (!isCmsResolverActive(flags) || !isFlagEnabled(flags, "cms.matches.enabled")) {
    return { pool: legacyMatches, source: "legacy" };
  }
  const db = await loadMatchesFromDb();
  if (!db?.length) return { pool: legacyMatches, source: "legacy" };
  return { pool: mergeMatchPools(db, legacyMatches), source: "hybrid" };
}
