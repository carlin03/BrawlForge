import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  bumpTeamLogoManifest,
  writeLogoOverrides,
  writeProcessedTeamLogo,
} from "@/lib/admin/save-team-logo";
import type { LogoTreatment } from "@/lib/data/logo-branding";

export const runtime = "nodejs";

const UA = { "User-Agent": "BrawlForge/1.0" };

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
  const overridesPath = path.join(root, "src", "lib", "data", "generated", "logo-overrides.json");
  let overrides: {
    teams: Record<string, { url?: string; treatment?: string }>;
    tournaments: Record<string, { url?: string }>;
  } = { teams: {}, tournaments: {} };

  if (fs.existsSync(overridesPath)) {
    overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
  }

  let cacheVersion = String(Date.now());
  let publicPath = kind === "team" ? `/logos/teams/${slug}.png` : `/logos/tournaments/${slug}.png`;
  const warnings: string[] = [];

  try {
    if (kind === "team") {
      if (!imageUrl) {
        return NextResponse.json(
          { error: "Para equipos debes pegar una URL de imagen (enlace directo PNG/JPG/SVG)." },
          { status: 400 },
        );
      }

      overrides.teams[slug] = { url: imageUrl, treatment };
      writeLogoOverrides(root, overrides);

      try {
        const result = await writeProcessedTeamLogo(root, slug, treatment, imageUrl);
        publicPath = result.publicPath;
        if (!result.processed) warnings.push("Guardado sin reprocesar Sharp (imagen original).");
      } catch (e) {
        warnings.push(e instanceof Error ? e.message : "No se pudo escribir PNG local");
      }

      try {
        cacheVersion = bumpTeamLogoManifest(root, slug);
      } catch {
        warnings.push("Manifest local no actualizado");
      }
    } else {
      overrides.tournaments[slug] = { url: imageUrl || "/images/bsc-2026.png" };
      writeLogoOverrides(root, overrides);

      if (imageUrl) {
        const res = await fetch(imageUrl, { headers: UA });
        if (!res.ok) {
          return NextResponse.json(
            { error: `No se pudo descargar la imagen del torneo (${res.status})` },
            { status: 400 },
          );
        }
        try {
          const dest = path.join(root, "public", "logos", "tournaments", `${slug}.png`);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
          publicPath = `/logos/tournaments/${slug}.png`;
        } catch (e) {
          warnings.push(e instanceof Error ? e.message : "PNG torneo no escrito en disco");
        }
      }

      const manifestPath = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
          const set = new Set<string>(manifest.tournamentLocal ?? []);
          set.add(slug);
          manifest.tournamentLocal = [...set].sort();
          manifest.logoCacheVersion = Date.now();
          cacheVersion = String(manifest.logoCacheVersion);
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        } catch {
          warnings.push("Manifest torneos no actualizado");
        }
      }
    }

    const primaryUrl = kind === "team" && imageUrl ? imageUrl : `${publicPath}?v=${cacheVersion}`;
    const logoUrl =
      kind === "team" && imageUrl
        ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${cacheVersion}`
        : `${publicPath}?v=${encodeURIComponent(cacheVersion)}`;

    const supabase = await createClient();
    if (supabase) {
      if (kind === "team") {
        const { error: logoErr } = await supabase.from("team_logo_overrides").upsert({
          slug,
          public_url: primaryUrl,
          treatment,
          updated_at: new Date().toISOString(),
        });
        if (logoErr) warnings.push(`Supabase logos: ${logoErr.message}`);

        const { error: teamErr } = await supabase
          .from("teams_catalog")
          .update({ logo_url: imageUrl, synced_at: new Date().toISOString() })
          .eq("slug", slug);
        if (teamErr) warnings.push(`Catálogo equipos: ${teamErr.message}`);
      } else {
        const { error } = await supabase.from("tournament_logo_overrides").upsert({
          slug,
          public_url: imageUrl || publicPath,
          updated_at: new Date().toISOString(),
        });
        if (error) warnings.push(`Supabase torneo: ${error.message}`);
      }
    } else {
      warnings.push("Supabase no configurado — solo guardado local");
    }

    return NextResponse.json({
      message: `Logo guardado: ${slug}.${warnings.length ? ` (${warnings.join("; ")})` : ""}`,
      logoUrl,
      cacheVersion,
      warnings,
      ok: true,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Error al procesar el logo";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
