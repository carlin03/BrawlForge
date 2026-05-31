/** Evita que Liquipedia aparezca en la web pública (texto, URLs o claves de datos). */

const LIQUIPEDIA_WORD = /\bliquipedia\b/i;
const LIQUIPEDIA_HOST = /liquipedia\.net/i;

export function isLiquipediaReference(value: string | null | undefined): boolean {
  if (!value) return false;
  const s = String(value);
  return LIQUIPEDIA_WORD.test(s) || LIQUIPEDIA_HOST.test(s);
}

/** Limpia texto visible: quita menciones, URLs y restos HTML de sync antiguo. */
export function sanitizePublicText(value: string | null | undefined): string | null {
  if (value == null) return null;
  let s = String(value)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/https?:\/\/[^\s]*liquipedia\.net[^\s]*/gi, "")
    .replace(/\bLiquipedia\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s || null;
}

export function sanitizeSocialRecord(
  social: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!social || typeof social !== "object") return out;
  for (const [key, raw] of Object.entries(social)) {
    if (isLiquipediaReference(key)) continue;
    const v = sanitizePublicText(String(raw ?? ""));
    if (v && !isLiquipediaReference(v)) out[key] = v;
  }
  return out;
}

export function sanitizePublicWebsite(url: string | null | undefined): string | undefined {
  const v = sanitizePublicText(url);
  if (!v || isLiquipediaReference(v)) return undefined;
  return v;
}

export function stripLiquipediaFields<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const key of Object.keys(out)) {
    if (isLiquipediaReference(key)) {
      delete out[key];
      continue;
    }
    const val = out[key];
    if (typeof val === "string" && isLiquipediaReference(val)) {
      delete out[key];
    }
  }
  if (out.social && typeof out.social === "object") {
    out.social = sanitizeSocialRecord(out.social as Record<string, unknown>);
  }
  if (typeof out.bio === "string") out.bio = sanitizePublicText(out.bio);
  if (typeof out.description === "string") {
    out.description = sanitizePublicText(out.description);
  }
  if (typeof out.website === "string") {
    const w = sanitizePublicWebsite(out.website);
    if (w) out.website = w;
    else delete out.website;
  }
  return out as T;
}
