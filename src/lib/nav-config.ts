/** Navegación pública — solo World Finals 2026 */
export const MAIN_NAV = [
  { label: "Mundial", href: "/", accent: "worlds" as const },
  { label: "Pick'ems", href: "/pickems", accent: "predict" as const },
  { label: "Equipos", href: "/teams" },
  { label: "Jugadores", href: "/players" },
  { label: "Partidos", href: "/matches" },
] as const;

/** fantasy se mantiene en el tipo por shells legacy/admin; nav pública es solo Mundial. */
export type NavAccent = "fantasy" | "predict" | "worlds";
