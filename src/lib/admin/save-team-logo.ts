import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { canWriteLocalProjectFiles, tryWriteFile } from "@/lib/admin/project-fs";
import { TAIYORO_LOGOS } from "@/lib/data/team-logo-urls";
import type { LogoTreatment } from "@/lib/data/logo-branding";

const UA = { "User-Agent": "BrawlForge/1.0" };

async function loadLogoProcessor() {
  const modPath = pathToFileURL(path.join(process.cwd(), "scripts", "logo-process.mjs")).href;
  return import(modPath) as Promise<{
    applyLogoTreatment: (buf: Buffer, slug: string, override?: string) => Promise<Buffer>;
  }>;
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`No se pudo descargar la imagen (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function fetchTeamLogoSource(
  root: string,
  slug: string,
  imageUrl?: string,
): Promise<Buffer> {
  if (imageUrl?.trim()) return downloadImage(imageUrl.trim());

  if (TAIYORO_LOGOS[slug]) return downloadImage(TAIYORO_LOGOS[slug]);

  const local = path.join(root, "public", "logos", "teams", `${slug}.png`);
  if (fs.existsSync(local)) return fs.readFileSync(local);

  throw new Error("Pega una URL de imagen o elige un club con logo en el servidor.");
}

async function processBuffer(
  raw: Buffer,
  slug: string,
  treatment: LogoTreatment,
): Promise<Buffer> {
  try {
    const { applyLogoTreatment } = await loadLogoProcessor();
    return await applyLogoTreatment(raw, slug, treatment);
  } catch {
    return raw;
  }
}

export async function processTeamLogoPng(
  root: string,
  slug: string,
  treatment: LogoTreatment,
  imageUrl?: string,
): Promise<{ png: Buffer; publicPath: string; processed: boolean }> {
  const raw = await fetchTeamLogoSource(root, slug, imageUrl);
  const png = await processBuffer(raw, slug, treatment);
  return {
    png,
    publicPath: `/logos/teams/${slug}.png`,
    processed: png.length !== raw.length,
  };
}

export async function writeProcessedTeamLogo(
  root: string,
  slug: string,
  treatment: LogoTreatment,
  imageUrl?: string,
): Promise<{ bytes: number; publicPath: string; processed: boolean; wroteLocal: boolean }> {
  const { png, publicPath, processed } = await processTeamLogoPng(root, slug, treatment, imageUrl);
  const dest = path.join(root, "public", "logos", "teams", `${slug}.png`);
  const wroteLocal = tryWriteFile(dest, png);
  return { bytes: png.length, publicPath, processed, wroteLocal };
}

export function bumpTeamLogoManifest(root: string, slug: string): string | null {
  if (!canWriteLocalProjectFiles()) return null;
  const manifestPath = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    processedTeamLogos?: string[];
    taiyoroLocal?: string[];
    logoCacheVersion?: number;
  };
  const set = new Set(manifest.processedTeamLogos ?? manifest.taiyoroLocal ?? []);
  set.add(slug);
  manifest.processedTeamLogos = [...set].sort();
  manifest.taiyoroLocal = manifest.processedTeamLogos;
  manifest.logoCacheVersion = Date.now();
  if (!tryWriteFile(manifestPath, JSON.stringify(manifest, null, 2))) return null;
  return String(manifest.logoCacheVersion);
}

export function writeLogoOverrides(
  root: string,
  overrides: {
    teams: Record<string, { url?: string; treatment?: string }>;
    tournaments: Record<string, { url?: string }>;
  },
): boolean {
  const overridesPath = path.join(root, "src", "lib", "data", "generated", "logo-overrides.json");
  return tryWriteFile(overridesPath, JSON.stringify(overrides, null, 2));
}
