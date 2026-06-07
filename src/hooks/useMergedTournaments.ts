"use client";

import { useMemo } from "react";
import { useCatalog } from "@/contexts/CatalogContext";
import { mergeCatalogTournament } from "@/lib/catalog-merge";
import { getTierBPlusTournaments, type EsportsTournament } from "@/lib/data/matches";
import { TIER_BPLUS_TOURNAMENT_COUNT } from "@/lib/data/tier-bplus-pool";
import { isTierBPlus } from "@/lib/data/catalog";

const STATUS_ORDER: Record<EsportsTournament["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function sortTournaments(list: EsportsTournament[]): EsportsTournament[] {
  return [...list].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (sa !== 0) return sa;
    if (a.status === "finished") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
}

/** Torneos tier B+ — JSON local + catálogo Supabase. */
export function useMergedTournaments(limit?: number): EsportsTournament[] {
  const { tournamentsBySlug, fromDb } = useCatalog();
  return useMemo(() => {
    const bySlug = new Map<string, EsportsTournament>();
    for (const t of getTierBPlusTournaments()) bySlug.set(t.slug, t);
    for (const row of tournamentsBySlug.values()) {
      if (!isTierBPlus({ tier: row.tier ?? undefined })) continue;
      const merged = mergeCatalogTournament(bySlug.get(row.slug), row);
      if (merged) bySlug.set(row.slug, merged);
    }
    if (!fromDb && !tournamentsBySlug.size) {
      const local = getTierBPlusTournaments(limit);
      return limit ? local.slice(0, limit) : local;
    }
    const list = sortTournaments([...bySlug.values()]);
    return limit ? list.slice(0, limit) : list;
  }, [tournamentsBySlug, fromDb, limit]);
}

export function useCatalogTournamentCount(fallback = TIER_BPLUS_TOURNAMENT_COUNT): number {
  const { tournamentCount, fromDb } = useCatalog();
  return fromDb && tournamentCount > 0 ? tournamentCount : fallback;
}
