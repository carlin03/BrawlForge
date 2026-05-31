const UA = {
  "User-Agent": "BrawlForge/1.0 (image proxy)",
  Accept: "image/png,image/webp,image/jpeg,image/gif,image/svg+xml,image/*,*/*",
};

/** Algunos CDNs (Liquipedia, Escharts, TierMaker) bloquean fetch sin Referer → 403 en Vercel. */
export function buildImageFetchHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = { ...UA };
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("liquipedia")) headers.Referer = "https://liquipedia.net/";
    else if (host.includes("escharts")) headers.Referer = "https://escharts.com/";
    else if (host.includes("tiermaker")) headers.Referer = "https://tiermaker.com/";
    else if (host.includes("bspro.gg")) headers.Referer = "https://bspro.gg/";
  } catch {
    /* ignore */
  }
  return headers;
}
