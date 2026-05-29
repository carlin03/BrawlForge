import type { TeamCardTheme } from "./team-card-theme";

export type CardThemeMeta = {
  primary: string;
  secondary: string;
  glow: string;
};

export function parseCardThemeMeta(meta: unknown): CardThemeMeta | null {
  if (!meta || typeof meta !== "object") return null;
  const o = meta as Record<string, unknown>;
  const t = o.card_theme;
  if (!t || typeof t !== "object") return null;
  const c = t as Record<string, unknown>;
  const primary = String(c.primary ?? "").trim();
  const secondary = String(c.secondary ?? "").trim();
  const glow = String(c.glow ?? "").trim();
  if (!primary || !secondary || !glow) return null;
  return { primary, secondary, glow };
}

export function mergeCardThemeIntoMeta(
  meta: Record<string, unknown>,
  theme: CardThemeMeta | null,
): Record<string, unknown> {
  const next = { ...meta };
  if (theme) next.card_theme = theme;
  else delete next.card_theme;
  return next;
}

export function cardThemeToTeamTheme(theme: CardThemeMeta): TeamCardTheme {
  return { primary: theme.primary, secondary: theme.secondary, glow: theme.glow };
}
