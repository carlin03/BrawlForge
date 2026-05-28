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
  "tribe-gaming": { primary: "#00c853", secondary: "#0a1a10", glow: "#69f0ae" },
  "fut-esports": { primary: "#00bcd4", secondary: "#0a1820", glow: "#4dd0e1" },
  "totem-esports": { primary: "#7c4dff", secondary: "#150a28", glow: "#b388ff" },
  loud: { primary: "#00e676", secondary: "#0a2018", glow: "#00ff88" },
  "team-heretics": { primary: "#ffeb3b", secondary: "#2a2800", glow: "#fff176" },
  "zeta-division": { primary: "#536dfe", secondary: "#0a1028", glow: "#8c9eff" },
  "revenant-xspark": { primary: "#ff5722", secondary: "#1a1008", glow: "#ff8a65" },
  "natus-vincere": { primary: "#ffeb3b", secondary: "#1a1800", glow: "#fdd835" },
  "spacestation-gaming": { primary: "#42a5f5", secondary: "#0a1420", glow: "#64b5f6" },
  "novo-esports": { primary: "#ab47bc", secondary: "#180a20", glow: "#ce93d8" },
  reject: { primary: "#f44336", secondary: "#1a0808", glow: "#ef5350" },
  "stmn-esports": { primary: "#26c6da", secondary: "#0a1820", glow: "#4dd0e1" },
  "papara-supermassive": { primary: "#ff9800", secondary: "#201008", glow: "#ffb74d" },
  "toxic-lotus": { primary: "#66bb6a", secondary: "#0a180a", glow: "#81c784" },
  qlash: { primary: "#ec407a", secondary: "#1a0810", glow: "#f48fb1" },
  "qlash-spain": { primary: "#ec407a", secondary: "#1a0810", glow: "#f48fb1" },
  "qlash-latam": { primary: "#ec407a", secondary: "#1a0810", glow: "#f48fb1" },
  skcalalas: { primary: "#ff4081", secondary: "#180810", glow: "#ff80ab" },
  "skcalalas-na": { primary: "#ff4081", secondary: "#180810", glow: "#ff80ab" },
  "bc-gaming-sa": { primary: "#ffd740", secondary: "#201a00", glow: "#ffee58" },
  "bc-gaming": { primary: "#ffd740", secondary: "#201a00", glow: "#ffee58" },
  "bounty-hunters-esports": { primary: "#8d6e63", secondary: "#141008", glow: "#a1887f" },
  "eternal-esports": { primary: "#5c6bc0", secondary: "#0a1020", glow: "#7986cb" },
  "ace-xero": { primary: "#ef5350", secondary: "#1a0808", glow: "#e57373" },
  "only-realm": { primary: "#7e57c2", secondary: "#120a20", glow: "#9575cd" },
  "only-realm-na": { primary: "#7e57c2", secondary: "#120a20", glow: "#9575cd" },
  "vatic-esports": { primary: "#29b6f6", secondary: "#0a1420", glow: "#4fc3f7" },
  "zoos-esports": { primary: "#ffa726", secondary: "#201008", glow: "#ffb74d" },
  "team-elektros": { primary: "#26a69a", secondary: "#0a1818", glow: "#4db6ac" },
  "fut-esports-academy": { primary: "#00acc1", secondary: "#0a1820", glow: "#26c6da" },
  big: { primary: "#ffeb3b", secondary: "#1a1800", glow: "#fff59d" },
  "big-talents": { primary: "#ffeb3b", secondary: "#1a1800", glow: "#fff59d" },
  kebap: { primary: "#ff7043", secondary: "#1a1008", glow: "#ff8a65" },
  metizport: { primary: "#78909c", secondary: "#101418", glow: "#90a4ae" },
  oddyssey: { primary: "#ba68c8", secondary: "#140a18", glow: "#ce93d8" },
  elevate: { primary: "#5c6bc0", secondary: "#0a1020", glow: "#7986cb" },
  "geng-esports": { primary: "#ff9800", secondary: "#201008", glow: "#ffb74d" },
  intz: { primary: "#ff1744", secondary: "#1a0810", glow: "#ff5252" },
  "zurita-gang": { primary: "#8bc34a", secondary: "#101808", glow: "#aed581" },
  "olimpo-squad": { primary: "#00bcd4", secondary: "#0a1820", glow: "#4dd0e1" },
  "acre-lovers": { primary: "#4caf50", secondary: "#0a180a", glow: "#81c784" },
  "nova-esports": { primary: "#7e57c2", secondary: "#120a20", glow: "#b39ddb" },
  "nova-esports-china": { primary: "#7e57c2", secondary: "#120a20", glow: "#b39ddb" },
  cmm: { primary: "#42a5f5", secondary: "#0a1420", glow: "#64b5f6" },
  "eternal-fire": { primary: "#ff5722", secondary: "#1a1008", glow: "#ff7043" },
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

export function getTeamCardTheme(teamSlug: string, region?: Region): TeamCardTheme {
  if (TEAM_COLORS[teamSlug]) return TEAM_COLORS[teamSlug];
  if (region && REGION_FALLBACK[region]) return REGION_FALLBACK[region];
  return themeFromHue(teamSlug);
}

export function teamCardThemeVars(theme: TeamCardTheme): Record<string, string> {
  return {
    "--bf-team-primary": theme.primary,
    "--bf-team-secondary": theme.secondary,
    "--bf-team-glow": theme.glow,
  };
}
