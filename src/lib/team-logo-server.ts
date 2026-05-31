import { buildTeamLogoSources } from "@/lib/data/png-logo-urls";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";
import { bundledLogoOverrides } from "@/lib/logo-config-merge";
import type { LogoRuntimeConfig } from "@/lib/data/png-logo-urls";
import { buildImageFetchHeaders } from "@/lib/image-fetch-headers";
import { isPublicImageFetchUrl } from "@/lib/image-fetch-url";

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

function teamOverrideUpstream(slug: string, cfg?: LogoRuntimeConfig): string | undefined {
  const key = slug.trim().toLowerCase();
  const url = cfg?.overrides?.teams[key]?.url?.trim();
  return url && isPublicImageFetchUrl(url) ? url : undefined;
}

export async function fetchFirstTeamLogo(
  slug: string,
  cfg?: LogoRuntimeConfig,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const overrideFirst = teamOverrideUpstream(slug, cfg);
  const sources = overrideFirst
    ? [overrideFirst, ...teamLogoUpstreamSources(slug, cfg).filter((u) => u !== overrideFirst)]
    : teamLogoUpstreamSources(slug, cfg);
  for (const url of sources) {
    if (!isPublicImageFetchUrl(url)) continue;
    try {
      const res = await fetch(url, { headers: buildImageFetchHeaders(url), next: { revalidate: 86400 } });
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
