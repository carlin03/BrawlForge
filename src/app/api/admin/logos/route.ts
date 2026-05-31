import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { canWriteLocalProjectFiles, tryWriteFile } from "@/lib/admin/project-fs";
import { writeLogoOverrides } from "@/lib/admin/save-team-logo";
import { normalizeAdminMediaUrl } from "@/lib/image-fetch-url";
import { BSC_TOURNAMENT_ALIASES } from "@/lib/data/bsc-tournaments";
import { TOURNAMENT_SLUG_ALIASES } from "@/lib/data/catalog";

export const runtime = "nodejs";

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

function tournamentSlugVariants(slug: string): string[] {
  const set = new Set([slug]);
  const alias = BSC_TOURNAMENT_ALIASES[slug];
  if (alias) set.add(alias);
  const canon = TOURNAMENT_SLUG_ALIASES[slug];
  if (canon) set.add(canon);
  for (const [a, c] of Object.entries(BSC_TOURNAMENT_ALIASES)) {
    if (c === slug) set.add(a);
  }
  for (const [a, c] of Object.entries(TOURNAMENT_SLUG_ALIASES)) {
    if (c === slug) set.add(a);
  }
  return [...set];
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
  const slug = String(body.slug || "").trim().toLowerCase();
  const imageUrl = String(body.imageUrl || "").trim();
  const kind = body.kind === "tournament" ? "tournament" : "team";

  if (!slug) return NextResponse.json({ error: "Slug requerido" }, { status: 400 });

  const root = process.cwd();
  const warnings: string[] = [];
  const cacheVersion = String(Date.now());

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
          { error: "Pega una URL de imagen (enlace directo PNG/JPG/SVG/WebP)." },
          { status: 400 },
        );
      }
      const persistedUrl = normalizeAdminMediaUrl(imageUrl);
      if (!persistedUrl) {
        return NextResponse.json(
          { error: "URL no válida. Usa https://… o pega el enlace directo (también vale sin https://)." },
          { status: 400 },
        );
      }
      const savedAt = new Date().toISOString();
      const { error: logoErr } = await supabase.from("team_logo_overrides").upsert({
        slug,
        public_url: persistedUrl,
        treatment: "raw",
        updated_at: savedAt,
      });
      if (logoErr) {
        return NextResponse.json({ error: `Supabase logos: ${logoErr.message}` }, { status: 500 });
      }

      const { data: catRows, error: teamErr } = await supabase
        .from("teams_catalog")
        .update({ logo_url: persistedUrl, synced_at: savedAt })
        .eq("slug", slug)
        .select("slug");
      if (teamErr) warnings.push(`Catálogo equipos: ${teamErr.message}`);
      else if (!catRows?.length) {
        warnings.push(
          `No hay fila en teams_catalog para "${slug}"; el logo quedó en overrides. Crea el equipo en Admin o importa CSV.`,
        );
      }

      const { data: verify } = await supabase
        .from("team_logo_overrides")
        .select("public_url")
        .eq("slug", slug)
        .maybeSingle();
      const stored = verify?.public_url?.split("?")[0];
      if (stored !== persistedUrl) {
        return NextResponse.json(
          {
            error: `No se guardó el logo en Supabase (slug: ${slug}). Comprueba permisos admin.`,
          },
          { status: 500 },
        );
      }

      if (canWriteLocalProjectFiles()) {
        const overrides = readLocalOverrides(root);
        overrides.teams[slug] = { url: persistedUrl, treatment: "raw", customOnly: true };
        if (!writeLogoOverrides(root, overrides)) warnings.push("Overrides locales no escritos");
      }

      const logoUrl = `${persistedUrl}?v=${cacheVersion}`;
      return NextResponse.json({
        message: `Logo guardado: ${slug}.${warnings.length ? ` (${warnings.join("; ")})` : ""}`,
        logoUrl,
        cacheVersion,
        warnings,
        ok: true,
        persistedInCloud: true,
      });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Pega la URL del logo del torneo." }, { status: 400 });
    }
    const persistedUrl = normalizeAdminMediaUrl(imageUrl);
    if (!persistedUrl) {
      return NextResponse.json(
        { error: "URL no válida. Usa https://… o pega el enlace directo (también vale sin https://)." },
        { status: 400 },
      );
    }
    const slugs = tournamentSlugVariants(slug);
    const rows = slugs.map((s) => ({
      slug: s,
      public_url: persistedUrl,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("tournament_logo_overrides").upsert(rows);
    if (error) {
      return NextResponse.json({ error: `Supabase torneo: ${error.message}` }, { status: 500 });
    }

    if (canWriteLocalProjectFiles()) {
      const overrides = readLocalOverrides(root);
      for (const s of slugs) overrides.tournaments[s] = { url: persistedUrl };
      if (!writeLogoOverrides(root, overrides)) warnings.push("Overrides locales no escritos");
    }

    const logoUrl = `${persistedUrl}?v=${cacheVersion}`;
    return NextResponse.json({
      message: `Logo de torneo guardado: ${slug}.${warnings.length ? ` (${warnings.join("; ")})` : ""}`,
      logoUrl,
      cacheVersion,
      warnings,
      ok: true,
      persistedInCloud: true,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Error al guardar el logo";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
