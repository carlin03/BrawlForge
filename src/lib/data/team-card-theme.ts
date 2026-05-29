import type { Region } from "../types";

export interface TeamCardTheme {
  primary: string;
  secondary: string;
  glow: string;
}

/** Colores aproximados al branding del club (fondo de carta + watermark) */
const TEAM_COLORS: Record<string, TeamCardTheme> = {
  "crazy-raccoon": { primary: "#e85d04", secondary: "#1a1a2e", glow: "#ff6b35" },
  "sk-gaming": { primary: "#ff1744", secondary: "#1a0a12", glow: "#ff5252" },
  hmble: { primary: "#ffc82e", secondary: "#2a2200", glow: "#ffd54f" },
  "tribe-gaming": { primary: "#e53935", secondary: "#1a0808", glow: "#ff5252" },
  "fut-esports": { primary: "#00bcd4", secondary: "#0a1820", glow: "#4dd0e1" },
  "fut-esports-academy": { primary: "#00acc1", secondary: "#0a1820", glow: "#26c6da" },
  "totem-esports": { primary: "#7c4dff", secondary: "#150a28", glow: "#b388ff" },
  loud: { primary: "#00e676", secondary: "#0a2018", glow: "#00ff88" },
  "team-heretics": { primary: "#ffeb3b", secondary: "#2a2800", glow: "#fff176" },
  "zeta-division": { primary: "#536dfe", secondary: "#0a1028", glow: "#8c9eff" },
  "natus-vincere": { primary: "#ffeb3b", secondary: "#1a1800", glow: "#fdd835" },
  "novo-esports": { primary: "#ab47bc", secondary: "#180a20", glow: "#ce93d8" },
  reject: { primary: "#f44336", secondary: "#1a0808", glow: "#ef5350" },
  big: { primary: "#ffeb3b", secondary: "#1a1800", glow: "#fff59d" },
  "big-talents": { primary: "#ffeb3b", secondary: "#1a1800", glow: "#fff59d" },
  cmm: { primary: "#ff6f00", secondary: "#1a1008", glow: "#ffb74d" },
  skcalalas: { primary: "#e91e63", secondary: "#1a0812", glow: "#f06292" },
  "skcalalas-ea": { primary: "#7c4dff", secondary: "#140a28", glow: "#b388ff" },
  "rival-esports": { primary: "#d32f2f", secondary: "#1a0808", glow: "#ef5350" },
  "effort-result": { primary: "#ff9800", secondary: "#1a1008", glow: "#ffb74d" },
  "abc-ea-team": { primary: "#ec407a", secondary: "#180a14", glow: "#f48fb1" },
  "wwl-esports": { primary: "#eceff1", secondary: "#1a1a1a", glow: "#b0bec5" },
  "feasible-gaming": { primary: "#ff7043", secondary: "#1a1008", glow: "#ff8a65" },
  "frenzy-esports": { primary: "#e040fb", secondary: "#180a1a", glow: "#ea80fc" },
  "kds-esports": { primary: "#ffd740", secondary: "#1a1600", glow: "#ffee58" },
  "stmn-esports": { primary: "#26c6da", secondary: "#0a1820", glow: "#4dd0e1" },
  "team-elektros": { primary: "#26a69a", secondary: "#0a1818", glow: "#4db6ac" },
  "vatic-esports": { primary: "#29b6f6", secondary: "#0a1420", glow: "#4fc3f7" },
  "only-realm": { primary: "#7e57c2", secondary: "#120a20", glow: "#9575cd" },
  elevate: { primary: "#5c6bc0", secondary: "#0a1020", glow: "#7986cb" },
  "new-heights-gaming": { primary: "#ffd54f", secondary: "#1a1400", glow: "#ffe082" },
  kaioperro: { primary: "#ff5252", secondary: "#1a0808", glow: "#ff867c" },
  "alguem-segura": { primary: "#42a5f5", secondary: "#0a1420", glow: "#64b5f6" },
  "eternal-esports": { primary: "#5c6bc0", secondary: "#0a1020", glow: "#7986cb" },
  "olimpo-squad": { primary: "#00bcd4", secondary: "#0a1820", glow: "#4dd0e1" },
  "bounty-hunters-esports": { primary: "#8d6e63", secondary: "#141008", glow: "#a1887f" },
  "zurita-gang": { primary: "#8bc34a", secondary: "#101808", glow: "#aed581" },
  "f-a-zurita-gaming": { primary: "#8bc34a", secondary: "#101808", glow: "#aed581" },
  madridmira: { primary: "#e53935", secondary: "#1a0808", glow: "#ef5350" },
  fennel: { primary: "#7b1fa2", secondary: "#140818", glow: "#ab47bc" },
  insomnia: { primary: "#3949ab", secondary: "#0a0c18", glow: "#5c6bc0" },
  "f-a-homeless": { primary: "#78909c", secondary: "#101418", glow: "#b0bec5" },
  "vic-day": { primary: "#00897b", secondary: "#081210", glow: "#26a69a" },
  "legacy-esports": { primary: "#f57c00", secondary: "#181008", glow: "#ffb74d" },
  "enosis-esports": { primary: "#5c6bc0", secondary: "#0a1020", glow: "#7986cb" },
  "bc-gaming-sa": { primary: "#ffd740", secondary: "#201a00", glow: "#ffee58" },
  "level-esports": { primary: "#26a69a", secondary: "#0a1818", glow: "#4db6ac" },
  kebap: { primary: "#ff6f00", secondary: "#1a1008", glow: "#ffb74d" },
  metizport: { primary: "#1e88e5", secondary: "#0a1420", glow: "#42a5f5" },
  "zoos-esports": { primary: "#00897b", secondary: "#0a1818", glow: "#26a69a" },
  "ace-xero": { primary: "#e53935", secondary: "#1a0808", glow: "#ef5350" },
  "toxic-lotus": { primary: "#8e24aa", secondary: "#140a1a", glow: "#ab47bc" },
  "revenant-xspark": { primary: "#5e35b1", secondary: "#120a20", glow: "#7e57c2" },
  "papara-supermassive": { primary: "#ffc82e", secondary: "#1a1600", glow: "#ffd54f" },
  "spacestation-gaming": { primary: "#1e88e5", secondary: "#0a1420", glow: "#42a5f5" },
  "alpha7-esports": { primary: "#7b1fa2", secondary: "#140a1a", glow: "#ab47bc" },
  "cream-esports": { primary: "#ff7043", secondary: "#1a1008", glow: "#ff8a65" },
  "enterprise-esports": { primary: "#78909c", secondary: "#101418", glow: "#b0bec5" },
  "geng-esports": { primary: "#ff9800", secondary: "#1a1008", glow: "#ffb74d" },
  "nova-esports": { primary: "#29b6f6", secondary: "#0a1420", glow: "#4fc3f7" },
  "qlash": { primary: "#7c4dff", secondary: "#150a28", glow: "#b388ff" },
  "acre-lovers": { primary: "#66bb6a", secondary: "#0a1810", glow: "#81c784" },
  intz: { primary: "#ff1744", secondary: "#1a0808", glow: "#ff5252" },
  oddyssey: { primary: "#00acc1", secondary: "#0a1820", glow: "#26c6da" },
  "chasmac-gaming-br": { primary: "#8bc34a", secondary: "#101808", glow: "#aed581" },
};

const REGION_FALLBACK: Record<Region, TeamCardTheme> = {
  EMEA: { primary: "#ffc82e", secondary: "#1a1608", glow: "#ffd54f" },
  NA: { primary: "#42a5f5", secondary: "#0a1420", glow: "#64b5f6" },
  SA: { primary: "#00e676", secondary: "#0a2018", glow: "#69f0ae" },
  EA: { primary: "#ff5252", secondary: "#1a0808", glow: "#ff8a80" },
  SEA: { primary: "#26c6da", secondary: "#0a1820", glow: "#4dd0e1" },
  GLOBAL: { primary: "#b388ff", secondary: "#140a20", glow: "#d1c4e9" },
};

function hashHue(slug: string): number {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
}

function themeFromHue(slug: string): TeamCardTheme {
  const hue = hashHue(slug);
  return {
    primary: `hsl(${hue} 72% 48%)`,
    secondary: `hsl(${hue} 40% 12%)`,
    glow: `hsl(${hue} 80% 58%)`,
  };
}

/** Colores del club; no usa región (evita EA=rojo en logos azules, etc.). */
export function getTeamCardTheme(teamSlug: string, _region?: Region): TeamCardTheme {
  if (TEAM_COLORS[teamSlug]) return TEAM_COLORS[teamSlug];
  return themeFromHue(teamSlug);
}

const WATERMARK_OPACITY: Record<string, string> = {
  hero: "0.58",
  xl: "0.54",
  lg: "0.5",
  md: "0.48",
  sm: "0.44",
  mini: "0.4",
};

export function teamCardThemeVars(theme: TeamCardTheme, size?: "hero" | "xl" | "lg" | "md" | "sm" | "mini"): Record<string, string> {
  return {
    "--bf-team-primary": theme.primary,
    "--bf-team-secondary": theme.secondary,
    "--bf-team-glow": theme.glow,
    "--bf-card-watermark-opacity": WATERMARK_OPACITY[size ?? "md"] ?? "0.48",
  };
}
