"use client";

import { useMemo } from "react";
import { useCatalog } from "@/contexts/CatalogContext";
import { resolvePlayer, resolveTeam } from "@/lib/catalog-merge";

export function useResolvedPlayer(slug: string) {
  const { playersBySlug } = useCatalog();
  return useMemo(() => resolvePlayer(slug, playersBySlug.get(slug)), [slug, playersBySlug]);
}

export function useResolvedTeam(slug: string) {
  const { teamsBySlug } = useCatalog();
  return useMemo(() => resolveTeam(slug, teamsBySlug.get(slug)), [slug, teamsBySlug]);
}
