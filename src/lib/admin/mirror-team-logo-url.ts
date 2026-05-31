import type { SupabaseClient } from "@supabase/supabase-js";
import { buildImageFetchHeaders } from "@/lib/image-fetch-headers";
import { isPublicImageFetchUrl, normalizeAdminMediaUrl } from "@/lib/image-fetch-url";

const BUCKET = "logos";
const MAX_BYTES = 4 * 1024 * 1024;

function extFromContentType(ct: string): string {
  const lower = ct.toLowerCase();
  if (lower.includes("webp")) return "webp";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  if (lower.includes("svg")) return "svg";
  return "png";
}

function isAlreadyHosted(url: string): boolean {
  return /supabase\.(co|in)\/storage\/v1\/object\/public\//i.test(url);
}

export async function downloadTeamLogoBytes(
  rawUrl: string,
): Promise<{ bytes: Buffer; contentType: string } | { error: string }> {
  const url = normalizeAdminMediaUrl(rawUrl);
  if (!url || url.startsWith("/") || !isPublicImageFetchUrl(url)) {
    return { error: "URL de imagen no válida" };
  }

  try {
    const res = await fetch(url, { headers: buildImageFetchHeaders(url) });
    if (!res.ok) {
      return { error: `El servidor de la imagen respondió ${res.status} (no se pudo descargar)` };
    }
    const contentType = res.headers.get("content-type") ?? "image/png";
    if (!contentType.includes("image")) {
      return { error: "La URL no devolvió una imagen (revisa que sea enlace directo PNG/JPG/WebP)" };
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.byteLength < 180) {
      return { error: "Imagen demasiado pequeña o vacía" };
    }
    if (bytes.byteLength > MAX_BYTES) {
      return { error: "Imagen demasiado grande (máx. 4 MB)" };
    }
    return { bytes, contentType };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red";
    return { error: `No se pudo descargar: ${msg}` };
  }
}

/**
 * Copia el logo a Supabase Storage (URL estable, sin proxy a CDNs que fallan en Vercel).
 * Requiere service role en el servidor.
 */
export async function mirrorTeamLogoToStorage(
  supabase: SupabaseClient,
  slug: string,
  sourceUrl: string,
): Promise<{ publicUrl: string } | { error: string }> {
  const clean = normalizeAdminMediaUrl(sourceUrl);
  if (!clean) return { error: "URL no válida" };
  if (isAlreadyHosted(clean)) {
    return { publicUrl: clean.split("?")[0] };
  }

  const downloaded = await downloadTeamLogoBytes(clean);
  if ("error" in downloaded) return downloaded;

  const key = slug.trim().toLowerCase();
  const ext = extFromContentType(downloaded.contentType);
  const objectPath = `teams/${key}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, downloaded.bytes, {
    contentType: downloaded.contentType,
    upsert: true,
  });
  if (error) {
    return {
      error: `Storage: ${error.message}. ¿Existe el bucket "logos"? Ejecuta npm run supabase:apply:storage`,
    };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const publicUrl = data.publicUrl?.split("?")[0];
  if (!publicUrl) return { error: "No se obtuvo URL pública de Storage" };
  return { publicUrl };
}
