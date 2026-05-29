import { buildTeamLogoSources } from "@/lib/data/png-logo-urls";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";
import { bundledLogoOverrides } from "@/lib/logo-config-merge";
import type { LogoRuntimeConfig } from "@/lib/data/png-logo-urls";
import { isPublicImageFetchUrl } from "@/lib/image-fetch-url";
const UA = {
  "User-Agent": "BrawlForge/1.0 (team logo CDN)",
  Accept: "image/png,image/webp,image/jpeg,image/*,*/*",
};

function decodeClientProxyUrl(url: string): string {
  if (!url.startsWith("/api/image?")) return url;
  try {
    const q = new URL(url, "https://local").searchParams.get("url");
    return q ? decodeURIComponent(q) : url;
  } catch {
    return url;
  }
}

/** URLs upstream para buscar el PNG (sin pasar por proxy cliente). */
export function teamLogoUpstreamSources(slug: string, cfg?: LogoRuntimeConfig): string[] {
  const clientSources = buildTeamLogoSources(slug, cfg);
  const raw: string[] = [];
  for (const u of clientSources) {
    if (u.startsWith("/logos/")) continue;
    const decoded = decodeClientProxyUrl(u);
    if (decoded.startsWith("http")) raw.push(decoded);
  }
  return [...new Set(raw)];
}

export function defaultTeamLogoConfig(): LogoRuntimeConfig {
  return {
    cacheVersion: LOGO_CACHE_VERSION,
    overrides: bundledLogoOverrides(),
  };
}

export async function fetchFirstTeamLogo(
  slug: string,
  cfg?: LogoRuntimeConfig,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const sources = teamLogoUpstreamSources(slug, cfg);
  for (const url of sources) {
    if (!isPublicImageFetchUrl(url)) continue;
    try {
      const res = await fetch(url, { headers: UA, next: { revalidate: 86400 } });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") ?? "image/png";
      if (!ct.includes("image")) continue;
      const body = await res.arrayBuffer();
      if (body.byteLength < 180) continue;
      return { body, contentType: ct };
    } catch {
      continue;
    }
  }
  return null;
}

export function teamLogoProxyUrl(slug: string, cacheVersion: string): string {
  return `/api/logos/team/${encodeURIComponent(slug)}?v=${encodeURIComponent(cacheVersion)}`;
}
