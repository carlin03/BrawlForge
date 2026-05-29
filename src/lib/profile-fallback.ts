import type { User } from "@supabase/supabase-js";
import type { PlayerProfile } from "@/contexts/AuthContext";

/** Perfil mínimo cuando Supabase aún no devolvió fila (evita pantalla en blanco). */
export function buildFallbackProfile(user: User): PlayerProfile {
  const meta = user.user_metadata as Record<string, string> | undefined;
  const displayName = meta?.display_name?.trim() || user.email?.split("@")[0] || "Jugador";
  const ign = meta?.ign?.trim() || displayName;
  return {
    id: user.id,
    displayName,
    ign,
    favoriteTeamSlug: null,
    avatarUrl: null,
    isAdmin: false,
    fantasyPoints: 0,
    fantasyRank: 0,
    predictPoints: 0,
    predictStreak: 0,
  };
}
