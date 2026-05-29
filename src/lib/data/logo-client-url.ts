/** URLs seguras para <img> en el cliente (Liquipedia bloquea hotlinking directo). */

const DIRECT_HOSTS = [
  "taiyoro-prod-media.s3.amazonaws.com",
  "cdn.royaleapi.com",
  "upload.wikimedia.org",
  "supabase.co",
  "supabase.in",
  "mitiendanube.com",
  "eternalesports.org",
];

function needsImageProxy(url: string): boolean {
  if (url.startsWith("/")) return false;
  try {
    const host = new URL(url).hostname;
    if (host === "liquipedia.net" || host.endsWith(".liquipedia.net")) return true;
    if (DIRECT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return false;
    return false;
  } catch {
    return false;
  }
}

export function toClientLogoUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/api/image") || trimmed.startsWith("/api/logos/team/")) return trimmed;
  if (needsImageProxy(trimmed)) {
    return `/api/image?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

export function toClientLogoSources(urls: string[]): string[] {
  const out: string[] = [];
  for (const u of urls) {
    const mapped = toClientLogoUrl(u);
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

export function isRemoteLogoSrc(src: string | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/logos/")) return false;
  return src.startsWith("/api/") || src.startsWith("http");
}
