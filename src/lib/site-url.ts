/** Dominio de producción (Vercel). Override con NEXT_PUBLIC_SITE_URL si cambia el alias. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://brawl-forge-delta.vercel.app";

export function siteHost(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "brawl-forge-delta.vercel.app";
  }
}
