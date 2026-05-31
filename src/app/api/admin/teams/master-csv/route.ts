import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { logCmsAudit } from "@/lib/cms/audit";
import {
  buildTeamsMasterCsv,
  masterCsvObjectToPartialRecord,
  mergeMasterCsvWithExisting,
  parseTeamsMasterCsvObjects,
  validateTeamsMasterCsvRows,
} from "@/lib/admin/teams-master-csv";
import {
  buildTeamPayloadFromAdminRow,
  listMergedTeams,
} from "@/lib/services/catalog/teams-catalog-svc";
import { isHiddenTeamSlug } from "@/lib/data/blocked-team-slugs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Importación masiva (100+ equipos) en lotes */
export const maxDuration = 120;

async function upsertBatched(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  rows: Record<string, unknown>[],
) {
  const chunk = 80;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = rows.slice(i, i + chunk);
    const { error } = await supabase.from("teams_catalog").upsert(batch);
    if (error) throw new Error(error.message);
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  try {
    const { teams } = await listMergedTeams(supabase);
    const csv = buildTeamsMasterCsv(teams);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="teams-master.csv"',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al exportar" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Falta archivo CSV (campo file)" }, { status: 400 });
  }

  try {
    const text = await file.text();
    const { headers, rows } = parseTeamsMasterCsvObjects(text);

    const { data: players } = await supabase.from("players_catalog").select("slug").limit(2000);
    const knownPlayerSlugs = new Set((players ?? []).map((p) => String(p.slug)));

    const validation = validateTeamsMasterCsvRows(rows, headers, { knownPlayerSlugs });

    const slugsToMerge = validation.valid
      .map((r) => String(r.raw.slug ?? "").trim().toLowerCase())
      .filter((s) => s && !isHiddenTeamSlug(s));

    const existingBySlug = new Map<string, Record<string, unknown>>();
    const slugChunk = 100;
    for (let i = 0; i < slugsToMerge.length; i += slugChunk) {
      const slice = slugsToMerge.slice(i, i + slugChunk);
      const { data: existing, error: fetchErr } = await supabase
        .from("teams_catalog")
        .select("*")
        .in("slug", slice);
      if (fetchErr) throw new Error(fetchErr.message);
      for (const row of existing ?? []) {
        existingBySlug.set(String(row.slug), row as Record<string, unknown>);
      }
    }

    const syncedAt = new Date().toISOString();
    const payloads: Record<string, unknown>[] = [];

    for (const { raw } of validation.valid) {
      const slug = String(raw.slug ?? "")
        .trim()
        .toLowerCase();
      if (!slug || isHiddenTeamSlug(slug)) continue;

      const partial = masterCsvObjectToPartialRecord(raw);
      const merged = mergeMasterCsvWithExisting(existingBySlug.get(slug), partial, raw);
      payloads.push(buildTeamPayloadFromAdminRow(merged, syncedAt));
    }

    if (!payloads.length && validation.issues.some((i) => i.errors.length)) {
      return NextResponse.json(
        {
          error: "Ninguna fila válida para importar",
          schema: validation.schema,
          issues: validation.issues.filter((i) => i.errors.length),
        },
        { status: 400 },
      );
    }

    if (payloads.length) {
      await upsertBatched(supabase, payloads);
      await logCmsAudit({
        action: "teams_catalog.import_master_csv",
        entityType: "team",
        entityId: "batch",
        diff: { count: payloads.length, schema: validation.schema },
      });
    }

    const errorRows = validation.issues.filter((i) => i.errors.length);
    const warnRows = validation.issues.filter((i) => !i.errors.length && i.warnings.length);

    return NextResponse.json({
      ok: true,
      schema: validation.schema,
      imported: payloads.length,
      skipped: errorRows.length,
      message:
        errorRows.length > 0
          ? `Importados ${payloads.length} equipo(s). ${errorRows.length} fila(s) con error (no importadas).`
          : `${payloads.length} equipo(s) importados desde CSV maestro.`,
      issues: validation.issues,
      errors: errorRows,
      warnings: warnRows,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al importar" },
      { status: 500 },
    );
  }
}
