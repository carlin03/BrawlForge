/**
 * En Vercel no se despliega public/logos/ (.vercelignore).
 * Evita intentar /logos/teams/*.png antes que CDNs remotos.
 */
export function canServeLocalLogoFiles(): boolean {
  if (process.env.VERCEL === "1") return false;
  if (process.env.NEXT_PUBLIC_USE_LOCAL_LOGOS === "0") return false;
  return true;
}
