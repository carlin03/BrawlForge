function isBrowserLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

/**
 * Solo en dev local existen public/logos/ (.vercelignore en producción).
 * En el navegador VERCEL no existe: hay que mirar el hostname.
 */
export function canServeLocalLogoFiles(): boolean {
  if (process.env.NEXT_PUBLIC_USE_LOCAL_LOGOS === "0") return false;
  if (process.env.NEXT_PUBLIC_LOGO_PROXY === "1") return false;
  if (typeof window !== "undefined") return isBrowserLocalhost();
  if (process.env.VERCEL === "1") return false;
  return process.env.NODE_ENV === "development";
}

/** Sitio desplegado (Vercel, preview, dominio custom): endpoint /api/logos/team/[slug]. */
export function usesRemoteLogoPipeline(): boolean {
  return !canServeLocalLogoFiles();
}
