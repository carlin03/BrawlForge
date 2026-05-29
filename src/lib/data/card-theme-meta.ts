import type { TeamCardTheme } from "./team-card-theme";

export type CardWatermarkSize = "sm" | "md" | "lg";

export type CardWatermarkConfig = {
  /** PNG/JPG del escudo o marca (capa entre fondo y foto del jugador) */
  image_url?: string;
  /** 0–100. Si no hay imagen custom, aplica al logo del club. */
  opacity?: number;
  size?: CardWatermarkSize;
  /** Si hay image_url, mantener logo del club muy suave detrás */
  show_team_logo_behind?: boolean;
};

export type CardThemeMeta = {
  primary: string;
  secondary: string;
  glow: string;
  watermark?: CardWatermarkConfig;
};

const DEFAULT_WATERMARK: CardWatermarkConfig = {
  opacity: 48,
  size: "md",
  show_team_logo_behind: true,
};

export function parseCardWatermark(raw: unknown): CardWatermarkConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_WATERMARK };
  const o = raw as Record<string, unknown>;
  const size = o.size === "sm" || o.size === "lg" ? o.size : "md";
  const opacity =
    typeof o.opacity === "number"
      ? Math.min(100, Math.max(0, Math.round(o.opacity)))
      : DEFAULT_WATERMARK.opacity!;
  return {
    image_url: o.image_url ? String(o.image_url).trim() : undefined,
    opacity,
    size,
    show_team_logo_behind: o.show_team_logo_behind !== false,
  };
}

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
  const watermark = c.watermark ? parseCardWatermark(c.watermark) : undefined;
  return { primary, secondary, glow, watermark };
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
