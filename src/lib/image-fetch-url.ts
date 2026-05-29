/** URLs de imagen en admin: https/http públicas o rutas locales `/…`. Bloquea SSRF básico. */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateIpv4(host: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const [a, b] = host.split(".").map(Number);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isAllowedRemoteHost(host: string): boolean {
  const h = host.toLowerCase();
  if (BLOCKED_HOSTS.has(h)) return false;
  if (h.endsWith(".localhost")) return false;
  if (isPrivateIpv4(h)) return false;
  return true;
}

/**
 * Normaliza URLs pegadas en admin: añade https si falta, acepta //cdn… y conserva query (?v=…).
 * Rutas locales `/logos/…` se devuelven tal cual.
 */
export function normalizeAdminMediaUrl(raw: string): string | null {
  let u = raw.trim();
  if (!u) return null;
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  if (u.startsWith("//")) u = `https:${u}`;
  else if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!isAllowedRemoteHost(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function isPublicImageFetchUrl(raw: string): boolean {
  return normalizeAdminMediaUrl(raw) !== null;
}
