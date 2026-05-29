import { isPublicImageFetchUrl } from "@/lib/image-fetch-url";

/** Todas las URLs http(s) externas pasan por el proxy del sitio (CORS / hotlink). */
export function toClientLogoUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/api/") || trimmed.startsWith("/logos/")) return trimmed;
  if (isPublicImageFetchUrl(trimmed)) {
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
