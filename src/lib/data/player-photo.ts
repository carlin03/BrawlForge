import type { PlayerExtras } from "@/lib/catalog-merge";
import type { EsportsPlayer } from "@/lib/data/players";

export function getPlayerPhotoUrl(
  player: (EsportsPlayer & Partial<PlayerExtras>) | null | undefined,
): string | null {
  if (!player) return null;
  const direct = (player as { photoUrl?: string | null }).photoUrl;
  if (direct?.trim()) return direct.trim();
  const fromMeta = player.meta?.photo_url;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  return null;
}
