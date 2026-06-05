import type { PlayoffBracketConfig, PlayoffBracketsStore } from "@/lib/data/bracket-config";
import {
  fetchSupercellBracket,
  fetchSupercellEvents,
  slugFromSupercellContestantId,
  type SupercellBracket,
  type SupercellBracketMatch,
  type SupercellEvent,
} from "@/lib/data/supercell-bsc";
import {
  findMatchByDedup,
  matchDedupDay,
  type CatalogMatchRow,
} from "./match-dedup";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { hasPremiumManualMeta, mergeMetaForSync } from "./merge-sync-match";

const SETTINGS_KEY = "playoff_brackets";

/** eventId Supercell → slug torneo BrawlForge */
export const SUPERCELL_EVENT_TOURNAMENT: Record<string, string> = {
  /** Brawl Cup 2026 (global, mayo) — no World Finals Tokyo. */
  w4Lu1Ua9yIKv2ZBABn6oP: "bsc-2026-brawl-cup",
};

export type SupercellSyncResult = {
  ok: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  bracketSlotsUpdated: number;
  unmappedContestants: number[];
  message: string;
};

// Cliente service-role de Supabase (admin).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

function stageFromRange(rangeId: number, totalRanges: number): string {
  if (totalRanges <= 1) return "Grand Final";
  if (rangeId >= totalRanges) return "Grand Final";
  if (rangeId === totalRanges - 1) return "Semifinal";
  if (rangeId === 1 && totalRanges >= 3) return "Group Stage";
  if (rangeId === 2) return "Quarterfinal";
  return "Swiss Stage";
}

function deriveMatchStatus(
  m: SupercellBracketMatch,
  eventStatus: string,
): "upcoming" | "live" | "finished" {
  if (m.completed) return "finished";
  const totalScore = (m.contestant ?? []).reduce((s, c) => s + (c.score ?? 0), 0);
  if (totalScore > 0) return "live";
  if (eventStatus === "live" || eventStatus === "ongoing") return "upcoming";
  return "upcoming";
}

function contestantSlugs(m: SupercellBracketMatch): { teamA: string | null; teamB: string | null } {
  const c0 = m.contestant?.[0]?.id;
  const c1 = m.contestant?.[1]?.id;
  const teamA = c0 != null ? slugFromSupercellContestantId(c0) ?? null : null;
  const teamB = c1 != null ? slugFromSupercellContestantId(c1) ?? null : null;
  return { teamA, teamB };
}

function scoresFromMatch(m: SupercellBracketMatch): { scoreA: number; scoreB: number } {
  return {
    scoreA: m.contestant?.[0]?.score ?? 0,
    scoreB: m.contestant?.[1]?.score ?? 0,
  };
}

function tournamentForEvent(eventId: string): string {
  return SUPERCELL_EVENT_TOURNAMENT[eventId] ?? `supercell-${eventId.slice(0, 8)}`;
}

function defaultFormat(event: SupercellEvent): string {
  const bt = (event.bracketType ?? "").toLowerCase();
  if (bt.includes("bo5") || event.totalRanges === 3) return "Bo5";
  return "Bo5";
}

async function loadCatalogMatches(supabase: SupabaseAdmin): Promise<CatalogMatchRow[]> {
  const { data, error } = await supabase.from("matches_catalog").select("*").limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as CatalogMatchRow[];
}

async function upsertSyncState(
  supabase: SupabaseAdmin,
  matchId: string,
  source: string,
  cursor: string,
) {
  await supabase.from("match_sync_state").upsert(
    {
      match_id: matchId,
      source,
      cursor,
      last_sync_at: new Date().toISOString(),
      meta: { provider: "supercell" },
    },
    { onConflict: "match_id" },
  );
}

async function loadBracketStore(supabase: SupabaseAdmin): Promise<PlayoffBracketsStore> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();
  if (!data?.value || typeof data.value !== "object") return {};
  return data.value as PlayoffBracketsStore;
}

function applyBracketScores(
  config: PlayoffBracketConfig,
  pairScores: Map<string, { scoreA: number; scoreB: number; status: string }>,
): { config: PlayoffBracketConfig; updated: number } {
  let updated = 0;
  const touch = (slot: { team_a_slug: string; team_b_slug: string; match_id?: string }) => {
    if (!slot.team_a_slug || !slot.team_b_slug) return;
    const key = `${slot.team_a_slug}|${slot.team_b_slug}`;
    const rev = `${slot.team_b_slug}|${slot.team_a_slug}`;
    if (pairScores.has(key) || pairScores.has(rev)) updated += 1;
  };
  for (const s of config.slots.quarters) touch(s);
  for (const s of config.slots.semis) touch(s);
  if (config.slots.final) touch(config.slots.final);
  if (config.slots.third_place) touch(config.slots.third_place);
  return { config, updated };
}

export async function syncSupercellMatches(
  supabase: SupabaseAdmin,
): Promise<SupercellSyncResult> {
  const [events, brackets, catalog] = await Promise.all([
    fetchSupercellEvents(true),
    fetchSupercellBracket(true),
    loadCatalogMatches(supabase),
  ]);

  if (!brackets.length) {
    return {
      ok: true,
      inserted: 0,
      updated: 0,
      skipped: 0,
      bracketSlotsUpdated: 0,
      unmappedContestants: [],
      message: "Supercell no devolvió brackets activos.",
    };
  }

  const eventById = new Map(events.map((e) => [e.eventId, e]));
  const unmapped = new Set<number>();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();
  const day = matchDedupDay(now);
  const pairScores = new Map<string, { scoreA: number; scoreB: number; status: string }>();

  for (const bracket of brackets) {
    const event = eventById.get(bracket.eventId);
    const tournamentSlug = tournamentForEvent(bracket.eventId);
    const totalRanges = event?.totalRanges ?? bracket.ranges?.length ?? 1;
    const eventStatus = event?.status ?? "upcoming";
    const format = event ? defaultFormat(event) : "Bo5";
    const region = event?.region ?? "GLOBAL";

    for (const range of bracket.ranges ?? []) {
      const stage = stageFromRange(range.rangeId, totalRanges);

      for (const sm of range.matches ?? []) {
        if (sm.isSkipped || sm.isFantasy) {
          skipped += 1;
          continue;
        }

        const { teamA, teamB } = contestantSlugs(sm);
        if (!teamA || !teamB) {
          if (sm.contestant?.[0]?.id) unmapped.add(sm.contestant[0].id);
          if (sm.contestant?.[1]?.id) unmapped.add(sm.contestant[1].id);
          skipped += 1;
          continue;
        }

        const status = deriveMatchStatus(sm, eventStatus);
        const { scoreA, scoreB } = scoresFromMatch(sm);
        const existing = findMatchByDedup(catalog, tournamentSlug, teamA, teamB, day);

        const syncMeta = {
          sync: {
            provider: "supercell",
            event_id: bracket.eventId,
            supercell_match_id: sm.id,
            range_id: range.rangeId,
            completed: sm.completed,
            winner_index: sm.winner,
          },
          display_status: status,
        };

        pairScores.set(`${teamA}|${teamB}`, { scoreA, scoreB, status });

        if (existing) {
          const mergedMeta = mergeMetaForSync(existing.meta, syncMeta);
          const patch = {
            status,
            score_a: scoreA,
            score_b: scoreB,
            stage: existing.stage || stage,
            format: existing.format || format,
            region: existing.region || region,
            meta: mergedMeta,
            synced_at: now,
            updated_at: now,
          };
          const { error } = await supabase
            .from("matches_catalog")
            .update(patch)
            .eq("id", existing.id);
          if (error) throw new Error(error.message);
          await upsertSyncState(supabase, existing.id, "supercell", `${bracket.eventId}:${sm.id}`);
          const idx = catalog.findIndex((r) => r.id === existing.id);
          if (idx >= 0) {
            catalog[idx] = { ...existing, ...patch, meta: mergedMeta as Record<string, unknown> };
          }
          updated += 1;
        } else {
          const id = `sc-${bracket.eventId}-${sm.id}`;
          const payload = {
            id,
            tournament_slug: tournamentSlug,
            team_a_slug: teamA,
            team_b_slug: teamB,
            scheduled_at: now,
            status,
            stage,
            region,
            format,
            score_a: scoreA,
            score_b: scoreB,
            published: true,
            meta: mergeMetaForSync({}, {
              ...syncMeta,
              predictions: { winner: true, exact_score: true, advanced: true },
            }),
            synced_at: now,
            updated_at: now,
          };
          const { error } = await supabase.from("matches_catalog").upsert(payload);
          if (error) throw new Error(error.message);
          await upsertSyncState(supabase, id, "supercell", `${bracket.eventId}:${sm.id}`);
          catalog.push(payload as CatalogMatchRow);
          inserted += 1;
        }
      }
    }
  }

  let bracketSlotsUpdated = 0;
  const store = await loadBracketStore(supabase);
  for (const [tournamentSlug, config] of Object.entries(store)) {
    const { config: next, updated: n } = applyBracketScores(config, pairScores);
    if (n > 0) {
      store[tournamentSlug] = { ...next, updated_at: now };
      bracketSlotsUpdated += n;
    }
  }
  if (bracketSlotsUpdated > 0) {
    await supabase.from("site_settings").upsert(
      { key: SETTINGS_KEY, value: store, updated_at: now },
      { onConflict: "key" },
    );
  }

  const parts: string[] = [];
  if (inserted) parts.push(`${inserted} nuevos`);
  if (updated) parts.push(`${updated} actualizados`);
  if (skipped) parts.push(`${skipped} omitidos`);

  return {
    ok: true,
    inserted,
    updated,
    skipped,
    bracketSlotsUpdated,
    unmappedContestants: [...unmapped],
    message: parts.length
      ? `Supercell: ${parts.join(", ")}.`
      : "Supercell: sin cambios en partidos.",
  };
}

/** Marca partido como editado manualmente (admin). */
export async function markMatchManualSource(supabase: SupabaseAdmin, matchId: string) {
  await upsertSyncState(supabase, matchId, "manual", "admin");
}

export function isManualProtectedRow(row: CatalogMatchRow, syncSource?: string): boolean {
  if (syncSource === "manual") return true;
  return hasPremiumManualMeta(parseMatchMeta(row.meta));
}
