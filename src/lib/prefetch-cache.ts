/** Prefetch en segundo plano — fetch() sigue aunque la pestaña no esté activa. */

declare global {
  interface Window {
    __bfPrefetchData?: Record<string, unknown>;
    __bfPrefetchInflight?: Record<string, Promise<unknown>>;
  }
}

export const PREFETCH_URLS = [
  "/api/home/matches",
  "/api/catalog",
  "/api/cms/runtime",
  "/api/news",
  "/api/logos/config",
  "/api/predictions/aggregates",
] as const;

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function hydrateFromEarlyBoot(url: string): unknown | undefined {
  if (typeof window === "undefined") return undefined;
  const early = window.__bfPrefetchData?.[url];
  if (early !== undefined) {
    cache.set(url, early);
    return early;
  }
  return undefined;
}

export function prefetchJson(url: string): Promise<unknown> {
  const hit = cache.get(url);
  if (hit !== undefined) return Promise.resolve(hit);

  const early = hydrateFromEarlyBoot(url);
  if (early !== undefined) return Promise.resolve(early);

  const running = inflight.get(url);
  if (running) return running;

  const earlyInflight =
    typeof window !== "undefined" ? window.__bfPrefetchInflight?.[url] : undefined;
  if (earlyInflight) {
    const bridged = earlyInflight.then((data) => {
      if (data != null) cache.set(url, data);
      return data;
    });
    inflight.set(url, bridged);
    return bridged;
  }

  const job = fetch(url, { cache: "no-store", credentials: "same-origin" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data != null) cache.set(url, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, job);
  return job;
}

export function getPrefetched<T>(url: string): T | null {
  const hit = cache.get(url);
  return hit != null ? (hit as T) : null;
}

export function startBackgroundPrefetch(): void {
  for (const url of PREFETCH_URLS) {
    void prefetchJson(url);
  }
}
