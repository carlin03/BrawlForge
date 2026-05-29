/**
 * Tratamiento por equipo — mismo PNG en toda la web.
 * border-only: solo borde exterior blanco
 * strip-white: fondo blanco → transparente, conserva colores (NaVi, Papara, SKC…)
 * mono-white: logo oscuro → blanco (SK, Zeta, HMBLE…)
 */
export type LogoTreatment = "border-only" | "strip-white" | "mono-white" | "raw";

export const TEAM_LOGO_TREATMENT: Record<string, LogoTreatment> = {
  "crazy-raccoon": "border-only",
  "tribe-gaming": "border-only",
  "tribe-gaming-eu": "border-only",
  "team-heretics": "border-only",

  "sk-gaming": "mono-white",
  hmble: "mono-white",
  "fut-esports": "border-only",
  "fut-esports-academy": "border-only",
  "zeta-division": "mono-white",
  "zeta-division-one": "mono-white",
  "zeta-division-zero": "mono-white",
  reject: "mono-white",
  "revenant-xspark": "mono-white",
  qlash: "mono-white",
  "qlash-latam": "mono-white",
  "qlash-spain": "mono-white",
  skcalalas: "strip-white",

  "natus-vincere": "strip-white",
  "papara-supermassive": "strip-white",
  "totem-esports": "strip-white",
  loud: "strip-white",
  "spacestation-gaming": "strip-white",
  "stmn-esports": "strip-white",
  "novo-esports": "strip-white",
  "toxic-lotus": "strip-white",
  "bc-gaming": "strip-white",
  "bc-gaming-sa": "strip-white",
  "bounty-hunters-esports": "strip-white",
  "only-realm": "strip-white",
  "only-realm-na": "strip-white",
  "eternal-esports": "strip-white",

  "ace-xero": "strip-white",
  "big-talents": "strip-white",
  fennel: "strip-white",
  fenice: "strip-white",
};

export function getLogoTreatment(slug: string): LogoTreatment {
  return TEAM_LOGO_TREATMENT[slug] ?? "border-only";
}

/** Sin filtros CSS: la imagen se muestra tal como está en la URL. */
export function resolveLogoTreatment(
  _slug: string,
  _override?: { treatment?: string; customOnly?: boolean; url?: string },
): LogoTreatment {
  return "raw";
}

export function shouldInvertLogo(_slug: string): boolean {
  return false;
}

export const PRESERVE_LOGO_RAW = new Set<string>();
export const INVERT_LOGO_SLUGS = new Set<string>();
