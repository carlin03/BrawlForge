import type { TeamCardTheme } from "./team-card-theme";
import { normalizeAdminMediaUrl } from "@/lib/image-fetch-url";

export type CardWatermarkSize = "sm" | "md" | "lg";

export type CardWatermarkConfig = {
  /** PNG/JPG del escudo o marca (capa entre fondo y foto del jugador) */
  image_url?: string;
  /** 0–100. Si no hay imagen custom, aplica al logo del club. */
  opacity?: number;
  /** @deprecated Usar scale. Se mantiene por datos antiguos. */
  size?: CardWatermarkSize;
  /** 0–300 (%). 0 = oculto; 100 = normal; >100 = más grande. */
  scale?: number;
  /** Si hay image_url, mantener logo del club muy suave detrás */
  show_team_logo_behind?: boolean;
};

export const DEFAULT_WATERMARK_SCALE = 100;
export const DEFAULT_WATERMARK_OPACITY = 8;

export type GlobalWatermarkDefaults = {
  opacity: number;
  scale: number;
};

export const DEFAULT_GLOBAL_WATERMARK: GlobalWatermarkDefaults = {
  opacity: DEFAULT_WATERMARK_OPACITY,
  scale: DEFAULT_WATERMARK_SCALE,
};

export function parseGlobalWatermarkDefaults(raw: unknown): GlobalWatermarkDefaults {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_GLOBAL_WATERMARK };
  const o = raw as Record<string, unknown>;
  const opacity =
    typeof o.opacity === "number"
      ? Math.min(100, Math.max(0, Math.round(o.opacity)))
      : DEFAULT_WATERMARK_OPACITY;
  const scale =
    typeof o.scale === "number" ? clampWatermarkScale(o.scale) : DEFAULT_WATERMARK_SCALE;
  return { opacity, scale };
}

export function getWatermarkOpacity(wm?: CardWatermarkConfig | null): number {
  if (!wm || typeof wm.opacity !== "number") return DEFAULT_WATERMARK_OPACITY;
  return Math.min(100, Math.max(0, Math.round(wm.opacity)));
}

export function watermarkScaleFromLegacy(size?: CardWatermarkSize): number {
  if (size === "sm") return 75;
  if (size === "lg") return 130;
  return DEFAULT_WATERMARK_SCALE;
}

export function clampWatermarkScale(scale: number): number {
  return Math.min(300, Math.max(0, Math.round(scale)));
}

export function getWatermarkScale(wm?: CardWatermarkConfig | null): number {
  if (!wm) return DEFAULT_WATERMARK_SCALE;
  if (typeof wm.scale === "number") {
    return clampWatermarkScale(wm.scale);
  }
  return watermarkScaleFromLegacy(wm.size);
}

export type CardThemeMeta = {
  primary: string;
  secondary: string;
  glow: string;
  watermark?: CardWatermarkConfig;
};

function defaultWatermark(global?: GlobalWatermarkDefaults | null): CardWatermarkConfig {
  const g = global ?? DEFAULT_GLOBAL_WATERMARK;
  return {
    opacity: g.opacity,
    scale: g.scale,
    show_team_logo_behind: true,
  };
}

export function parseCardWatermark(
  raw: unknown,
  global?: GlobalWatermarkDefaults | null,
): CardWatermarkConfig {
  const g = global ?? DEFAULT_GLOBAL_WATERMARK;
  if (!raw || typeof raw !== "object") return defaultWatermark(g);
  const o = raw as Record<string, unknown>;
  const size = o.size === "sm" || o.size === "lg" ? o.size : "md";
  const opacity =
    typeof o.opacity === "number"
      ? Math.min(100, Math.max(0, Math.round(o.opacity)))
      : g.opacity;
  const scale =
    typeof o.scale === "number"
      ? clampWatermarkScale(o.scale)
      : watermarkScaleFromLegacy(size);
  return {
    image_url: o.image_url ? String(o.image_url).trim() : undefined,
    opacity,
    scale,
    show_team_logo_behind: o.show_team_logo_behind !== false,
  };
}

/** Marca para guardar en jugadores al sincronizar desde el club. */
export function watermarkForPlayerSync(
  teamWm: CardWatermarkConfig | undefined,
  opts: { includeImage: boolean; includeStyle: boolean },
): CardWatermarkConfig | null {
  if (!teamWm && !opts.includeImage && !opts.includeStyle) return null;
  const w = parseCardWatermark(teamWm ?? null);
  if (!opts.includeStyle && !opts.includeImage) return null;
  if (!opts.includeImage) {
    return {
      opacity: w.opacity,
      scale: w.scale,
      show_team_logo_behind: w.show_team_logo_behind,
    };
  }
  if (!opts.includeStyle) {
    return { image_url: w.image_url };
  }
  return w;
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

/** Lee watermark de card_theme o card_watermark (jugadores). */
export function getCardWatermarkFromMeta(
  meta?: Record<string, unknown> | null,
  global?: GlobalWatermarkDefaults | null,
): CardWatermarkConfig | undefined {
  if (!meta) return undefined;
  const fromTheme = parseCardThemeMeta(meta)?.watermark;
  if (fromTheme) return parseCardWatermark(fromTheme, global);
  if (meta.card_watermark) return parseCardWatermark(meta.card_watermark, global);
  return undefined;
}

/** Jugador sobreescribe imagen/opacidad/tamaño; si no hay override, usa el club. */
export function mergeCardWatermarks(
  team?: CardWatermarkConfig,
  player?: CardWatermarkConfig,
): CardWatermarkConfig | undefined {
  const base = parseCardWatermark(team ?? null);
  const over = player ? parseCardWatermark(player) : null;
  const image_url = over?.image_url?.trim() || base.image_url;
  if (!image_url && !over?.image_url) {
    if (!team && !player) return undefined;
    return { ...base, ...over, image_url: undefined };
  }
  return {
    image_url: image_url || undefined,
    opacity: over?.opacity ?? base.opacity,
    scale: over?.scale ?? base.scale,
    show_team_logo_behind: over?.show_team_logo_behind ?? base.show_team_logo_behind,
  };
}

export function mergeCardWatermarkIntoMeta(
  meta: Record<string, unknown>,
  watermark: CardWatermarkConfig | null | undefined,
): Record<string, unknown> {
  const next = { ...meta };
  const hasCustom =
    watermark?.image_url?.trim() ||
    (watermark?.opacity != null && watermark.opacity !== DEFAULT_WATERMARK_OPACITY) ||
    (watermark?.scale != null && watermark.scale !== DEFAULT_WATERMARK_SCALE);
  if (hasCustom && watermark) {
    next.card_watermark = watermark;
  } else {
    delete next.card_watermark;
  }
  return next;
}

/** Orden: directo primero (mejor en admin/CDN), proxy como respaldo. */
export function cardImageSrcCandidates(url: string): string[] {
  const u = normalizeAdminMediaUrl(url.trim()) ?? url.trim();
  if (!u) return [];
  if (u.startsWith("/")) return [u];
  if (u.startsWith("http://") || u.startsWith("https://")) {
    const proxy = `/api/image?url=${encodeURIComponent(u)}`;
    return [u, proxy];
  }
  return [u];
}

/** @deprecated Usar cardImageSrcCandidates */
export function resolveCardImageSrc(url: string): string {
  return cardImageSrcCandidates(url)[0] ?? "";
}
