/** Navegación única — sin duplicar Torneos/Clubes/Noticias */
export const MAIN_NAV = [
  { label: "Inicio", href: "/" },
  { label: "Fantasy", href: "/fantasy", accent: "fantasy" as const },
  { label: "Predicciones", href: "/predictions", accent: "predict" as const },
  { label: "Partidos", href: "/matches" },
  { label: "Esports", href: "/esport" },
  { label: "Torneos", href: "/tournaments" },
  { label: "Clubes", href: "/teams" },
  { label: "Rankings", href: "/rankings" },
  { label: "Jugadores", href: "/players" },
  { label: "Noticias", href: "/news" },
] as const;

export type NavAccent = "fantasy" | "predict";
