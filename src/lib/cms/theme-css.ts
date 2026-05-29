import type { ResolvedThemeTokens } from "./types";

/** Convierte tokens CMS a variables CSS (--bp-*) compatibles con platform.css */
export function themeTokensToCssVars(theme: ResolvedThemeTokens): string {
  const c = theme.colors;
  const l = theme.layout;
  return `
:root {
  --bp-bg: ${c.bg};
  --bp-surface: ${c.surface};
  --bp-panel: ${c.panel};
  --bp-text: ${c.text};
  --bp-muted: ${c.muted};
  --bp-blue: ${c.primary};
  --bp-gold: ${c.secondary};
  --bp-green: ${c.success};
  --bp-red: ${c.error};
  --bp-max: ${l.maxWidth};
  --bp-nav-h: ${l.navHeight};
  --bp-r: ${l.radius};
}
`.trim();
}
