"use client";

import { useMemo } from "react";
import { useCatalog } from "@/contexts/CatalogContext";
import { mergeCatalogTeam, mergeCatalogPlayer } from "@/lib/catalog-merge";
import type { EsportsTeam } from "@/lib/data/teams";
import type { EsportsPlayer } from "@/lib/data/players";
import { BSC_2026_ACTIVE_TEAM_SLUGS } from "@/lib/data/bsc-2026-active-teams";
import { getPlayersWithTeam } from "@/lib/data/players";

const TEAM_ORDER = new Map(BSC_2026_ACTIVE_TEAM_SLUGS.map((s, i) => [s, i]));

function sortTeams(list: EsportsTeam[]): EsportsTeam[] {
  return [...list].sort(
    (a, b) =>
      (TEAM_ORDER.get(a.slug) ?? 999) - (TEAM_ORDER.get(b.slug) ?? 999) ||
      a.name.localeCompare(b.name),
  );
}

/** Equipos del circuito + filas extra en Supabase (p. ej. el 51.º club). */
export function useMergedCircuitTeams(staticTeams: EsportsTeam[]): EsportsTeam[] {
  const { teamsBySlug, ready } = useCatalog();
  return useMemo(() => {
    const bySlug = new Map(staticTeams.map((t) => [t.slug, t]));
    for (const row of teamsBySlug.values()) {
      const merged = mergeCatalogTeam(bySlug.get(row.slug), row);
      if (merged) bySlug.set(row.slug, merged);
    }
    if (!ready && !teamsBySlug.size) return staticTeams;
    return sortTeams([...bySlug.values()]);
  }, [staticTeams, teamsBySlug, ready]);
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

export function useCatalogTeamCount(fallback: number): number {
  const { teamsBySlug, ready } = useCatalog();
  return useMemo(() => {
    if (ready && teamsBySlug.size > 0) return teamsBySlug.size;
    return fallback;
  }, [teamsBySlug.size, ready, fallback]);
}
