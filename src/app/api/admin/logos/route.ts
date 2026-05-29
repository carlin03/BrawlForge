import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { canWriteLocalProjectFiles, tryWriteFile } from "@/lib/admin/project-fs";
import {
  bumpTeamLogoManifest,
  processTeamLogoPng,
  writeLogoOverrides,
  writeProcessedTeamLogo,
} from "@/lib/admin/save-team-logo";
import { uploadTeamLogoPng, uploadTournamentLogoPng } from "@/lib/admin/upload-logo-storage";
import type { LogoTreatment } from "@/lib/data/logo-branding";

export const runtime = "nodejs";

const UA = { "User-Agent": "BrawlForge/1.0" };

function readLocalOverrides(root: string) {
  const overridesPath = path.join(root, "src", "lib", "data", "generated", "logo-overrides.json");
  if (!fs.existsSync(overridesPath)) {
    return {
      teams: {} as Record<string, { url?: string; treatment?: string; customOnly?: boolean }>,
      tournaments: {} as Record<string, { url?: string }>,
    };
  }
  return JSON.parse(fs.readFileSync(overridesPath, "utf8")) as {
    teams: Record<string, { url?: string; treatment?: string; customOnly?: boolean }>;
    tournaments: Record<string, { url?: string }>;
  };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      { error: `${auth.error}. Inicia sesión en /login y pon is_admin = true en tu perfil.` },
      { status: auth.status },
    );
  }

  const body = await request.json();
  const slug = String(body.slug || "").trim();
  const treatment = (String(body.treatment || "strip-white").trim() || "strip-white") as LogoTreatment;
  const imageUrl = String(body.imageUrl || "").trim();
  const kind = body.kind === "tournament" ? "tournament" : "team";

  if (!slug) return NextResponse.json({ error: "Slug requerido" }, { status: 400 });

  const root = process.cwd();
  const warnings: string[] = [];
  let cacheVersion = String(Date.now());
  let publicPath = kind === "team" ? `/logos/teams/${slug}.png` : `/logos/tournaments/${slug}.png`;
  let persistedUrl = imageUrl;

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase no configurado. Los logos en producción se guardan en la base de datos." },
        { status: 503 },
      );
    }

    if (kind === "team") {
      if (!imageUrl) {
        return NextResponse.json(
          { error: "Para equipos debes pegar una URL de imagen (enlace directo PNG/JPG/SVG)." },
          { status: 400 },
        );
      }

      let processedPng: Buffer | null = null;
      try {
        const result = await processTeamLogoPng(root, slug, treatment, imageUrl);
        processedPng = result.png;
        publicPath = result.publicPath;
        if (!result.processed) warnings.push("Guardado sin reprocesar Sharp (imagen original).");
      } catch (e) {
        warnings.push(e instanceof Error ? e.message : "No se pudo procesar la imagen");
      }

      if (processedPng) {
        const uploaded = await uploadTeamLogoPng(supabase, slug, processedPng);
        if ("publicUrl" in uploaded) {
          persistedUrl = uploaded.publicUrl;
        } else {
          warnings.push(`Storage: ${uploaded.error} — se usa la URL pegada`);
          persistedUrl = imageUrl;
        }
      } else {
        persistedUrl = imageUrl;
      }

      const primaryUrl = `${persistedUrl}${persistedUrl.includes("?") ? "&" : "?"}v=${cacheVersion}`;
      const { error: logoErr } = await supabase.from("team_logo_overrides").upsert({
        slug,
        public_url: persistedUrl.split("?")[0],
        treatment,
        updated_at: new Date().toISOString(),
      });
      if (logoErr) {
        return NextResponse.json({ error: `Supabase logos: ${logoErr.message}` }, { status: 500 });
      }

      const { error: teamErr } = await supabase
        .from("teams_catalog")
        .update({ logo_url: persistedUrl.split("?")[0], synced_at: new Date().toISOString() })
        .eq("slug", slug);
      if (teamErr) warnings.push(`Catálogo equipos: ${teamErr.message}`);

      if (canWriteLocalProjectFiles()) {
        const overrides = readLocalOverrides(root);
        overrides.teams[slug] = { url: persistedUrl.split("?")[0], treatment, customOnly: true };
        if (!writeLogoOverrides(root, overrides)) warnings.push("Overrides locales no escritos");
        try {
          const local = await writeProcessedTeamLogo(root, slug, treatment, imageUrl);
          publicPath = local.publicPath;
          if (!local.wroteLocal) warnings.push("PNG local no escrito");
        } catch (e) {
          warnings.push(e instanceof Error ? e.message : "PNG local no escrito");
        }
        const bumped = bumpTeamLogoManifest(root, slug);
        if (bumped) cacheVersion = bumped;
      }
    } else {
      const tourUrl = imageUrl || "/images/bsc-2026.png";
      let tourPersisted = tourUrl;

      if (imageUrl) {
        const res = await fetch(imageUrl, { headers: UA });
        if (!res.ok) {
          return NextResponse.json(
            { error: `No se pudo descargar la imagen del torneo (${res.status})` },
            { status: 400 },
          );
        }
        const png = Buffer.from(await res.arrayBuffer());
        const uploaded = await uploadTournamentLogoPng(supabase, slug, png);
        if ("publicUrl" in uploaded) {
          tourPersisted = uploaded.publicUrl;
          publicPath = tourPersisted;
        } else {
          warnings.push(`Storage torneo: ${uploaded.error}`);
          if (canWriteLocalProjectFiles()) {
            const dest = path.join(root, "public", "logos", "tournaments", `${slug}.png`);
            if (tryWriteFile(dest, png)) publicPath = `/logos/tournaments/${slug}.png`;
            else warnings.push("PNG torneo no escrito en disco");
          }
        }
      }

      const { error } = await supabase.from("tournament_logo_overrides").upsert({
        slug,
        public_url: tourPersisted.split("?")[0],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        return NextResponse.json({ error: `Supabase torneo: ${error.message}` }, { status: 500 });
      }

      if (canWriteLocalProjectFiles()) {
        const overrides = readLocalOverrides(root);
        overrides.tournaments[slug] = { url: tourUrl };
        if (!writeLogoOverrides(root, overrides)) warnings.push("Overrides locales no escritos");

        const manifestPath = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
            const set = new Set<string>(manifest.tournamentLocal ?? []);
            set.add(slug);
            manifest.tournamentLocal = [...set].sort();
            manifest.logoCacheVersion = Date.now();
            cacheVersion = String(manifest.logoCacheVersion);
            if (!tryWriteFile(manifestPath, JSON.stringify(manifest, null, 2))) {
              warnings.push("Manifest torneos no actualizado");
            }
          } catch {
            warnings.push("Manifest torneos no actualizado");
          }
        }
      }

      persistedUrl = tourPersisted;
    }

    const logoUrl =
      kind === "team"
        ? `${persistedUrl}${persistedUrl.includes("?") ? "&" : "?"}v=${cacheVersion}`
        : `${publicPath}?v=${encodeURIComponent(cacheVersion)}`;

    return NextResponse.json({
      message: `Logo guardado: ${slug}.${warnings.length ? ` (${warnings.join("; ")})` : ""}`,
      logoUrl,
      cacheVersion,
      warnings,
      ok: true,
      persistedInCloud: true,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Error al procesar el logo";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
