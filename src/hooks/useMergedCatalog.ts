"use client";

import { useMemo } from "react";
import { useCatalog } from "@/contexts/CatalogContext";
import { mergeCatalogTeam, mergeCatalogPlayer } from "@/lib/catalog-merge";
import type { EsportsTeam } from "@/lib/data/teams";
import type { EsportsPlayer } from "@/lib/data/players";
import { getPlayersWithTeam } from "@/lib/data/players";
import { BSC_2026_CLUB_COUNT } from "@/lib/data/bsc-2026-circuit-teams";
import { isHiddenTeam } from "@/lib/data/blocked-team-slugs";
import {
  partitionCircuitTeams,
  sortCircuitTeams,
  countTeamRoster,
  isTeamRosterComplete,
  getTeamRosterTier,
  TEAM_INCOMPLETE_LABEL,
  PLAYER_UNASSIGNED_LABEL,
  MIN_CIRCUIT_ROSTER,
} from "@/lib/data/circuit-roster";

export {
  TEAM_INCOMPLETE_LABEL,
  PLAYER_UNASSIGNED_LABEL,
  MIN_CIRCUIT_ROSTER,
  countTeamRoster,
  isTeamRosterComplete,
  getTeamRosterTier,
};

/** Equipos del circuito + filas extra en Supabase (p. ej. el 51.º club). */
export function useMergedCircuitTeams(staticTeams: EsportsTeam[]): EsportsTeam[] {
  const { teamsBySlug, ready } = useCatalog();
  return useMemo(() => {
    const bySlug = new Map(staticTeams.map((t) => [t.slug, t]));
    for (const row of teamsBySlug.values()) {
      if (isHiddenTeam(row)) continue;
      const merged = mergeCatalogTeam(bySlug.get(row.slug), row);
      if (merged) bySlug.set(row.slug, merged);
    }
    if (!ready && !teamsBySlug.size) return staticTeams;
    return sortCircuitTeams([...bySlug.values()]);
  }, [staticTeams, teamsBySlug, ready]);
}

export function usePublicCircuitTeams(staticTeams: EsportsTeam[]) {
  const merged = useMergedCircuitTeams(staticTeams);
  const { teamsBySlug, playersBySlug } = useCatalog();
  return useMemo(
    () => partitionCircuitTeams(merged, teamsBySlug, playersBySlug),
    [merged, teamsBySlug, playersBySlug],
  );
}

export function useCatalogTeamCount(fallback = BSC_2026_CLUB_COUNT): number {
  const { teamCount, fromDb } = useCatalog();
  return fromDb && teamCount > 0 ? teamCount : fallback;
}

/** Pros con club primero; al final, jugadores solo en catálogo sin equipo (acceso a su ficha). */
export function usePublicPlayersList(): EsportsPlayer[] {
  const { playersBySlug, ready } = useCatalog();
  return useMemo(() => {
    const withTeam = getPlayersWithTeam();
    const seen = new Set(withTeam.map((p) => p.slug));
    const unassigned: EsportsPlayer[] = [];

    for (const row of playersBySlug.values()) {
      if (row.team_slug?.trim()) continue;
      const merged = mergeCatalogPlayer(undefined, row);
      if (merged && !seen.has(merged.slug)) {
        seen.add(merged.slug);
        unassigned.push(merged);
      }
    }

    unassigned.sort(
      (a, b) => b.fantasyPoints - a.fantasyPoints || a.ign.localeCompare(b.ign),
    );

    if (!ready && !playersBySlug.size) return withTeam;
    return [...withTeam, ...unassigned];
  }, [playersBySlug, ready]);
}
