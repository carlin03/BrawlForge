import { parseMatchMeta, type MatchMeta } from "@/lib/data/match-meta";

/** Meta que nunca debe sobrescribir la automatización. */
const PROTECTED_META_KEYS = new Set([
  "maps",
  "bans",
  "brawlers",
  "predictions",
  "importance",
  "featured_label",
  "notes",
  "advanced_predictions",
  "round_type",
  "allow_exact_score",
]);

export function hasPremiumManualMeta(meta: MatchMeta): boolean {
  if (meta.maps?.possible?.length || meta.maps?.order?.length || meta.maps?.played?.length) return true;
  if (meta.bans?.maps_a?.length || meta.bans?.maps_b?.length) return true;
  if (meta.bans?.brawlers_a?.length || meta.bans?.brawlers_b?.length) return true;
  if (meta.brawlers?.meta?.length || meta.brawlers?.recommended?.length) return true;
  if (meta.notes?.trim()) return true;
  return false;
}

export function mergeMetaForSync(
  existingMeta: unknown,
  syncMeta: Record<string, unknown>,
): Record<string, unknown> {
  const prev = parseMatchMeta(existingMeta);
  const out: Record<string, unknown> = { ...prev };

  for (const [key, value] of Object.entries(syncMeta)) {
    if (PROTECTED_META_KEYS.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }

  const prevSync =
    prev && typeof (prev as MatchMeta & { sync?: unknown }).sync === "object"
      ? ((prev as MatchMeta & { sync?: Record<string, unknown> }).sync ?? {})
      : {};
  out.sync = {
    ...prevSync,
    ...(typeof syncMeta.sync === "object" && syncMeta.sync ? syncMeta.sync : {}),
    last_sync_at: new Date().toISOString(),
  };

  return out;
}
