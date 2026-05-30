/** Re-export del servicio de partidos (API: /api/cms/admin/matches). */
export {
  buildCatalogUpsertBatch,
  getWebMatchesForCatalog,
  matchToCatalogRow,
} from "@/lib/cms/sync-matches-catalog";
