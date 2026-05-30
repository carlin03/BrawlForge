/** País/bandera del jugador en cartas (independiente del país del club). */

export type PlayerNationalitySource = {
  nationality?: string | null;
  country?: string | null;
  meta?: Record<string, unknown> | null;
};

export function playerNationalityFlagUrl(meta?: Record<string, unknown> | null): string | null {
  if (!meta) return null;
  const raw = meta.nationality_flag_url ?? meta.nationality_logo_url;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/** Texto para flagcdn: nationality > country del jugador (nunca el país del club en cartas). */
export function resolvePlayerNationalityCountry(player: PlayerNationalitySource): string | null {
  const n = player.nationality?.trim();
  if (n) return n;
  return player.country?.trim() || null;
}
