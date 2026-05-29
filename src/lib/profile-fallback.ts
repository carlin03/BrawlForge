import type { User } from "@supabase/supabase-js";
import type { PlayerProfile } from "@/contexts/AuthContext";
import { getCachedFavoriteTeamSlug } from "@/lib/profile-club-storage";

/** Perfil mínimo cuando Supabase aún no devolvió fila (evita pantalla en blanco). */
export function buildFallbackProfile(user: User): PlayerProfile {
  const meta = user.user_metadata as Record<string, string> | undefined;
  const displayName = meta?.display_name?.trim() || user.email?.split("@")[0] || "Jugador";
  const ign = meta?.ign?.trim() || displayName;
  const cachedClub = getCachedFavoriteTeamSlug();
  const metaClub = (meta?.favorite_team_slug as string | undefined)?.trim() || null;
  return {
    id: user.id,
    displayName,
    ign,
    favoriteTeamSlug: metaClub || cachedClub,
    avatarUrl: (meta?.avatar_url as string | undefined)?.trim() || null,
    isAdmin: false,
    fantasyPoints: 0,
    fantasyRank: 0,
    predictPoints: 0,
    predictStreak: 0,
  };
}
