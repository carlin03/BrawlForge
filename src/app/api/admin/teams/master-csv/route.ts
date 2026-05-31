import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { logCmsAudit } from "@/lib/cms/audit";
import { buildTeamsMasterCsv, parseTeamsMasterCsv } from "@/lib/admin/teams-master-csv";
import {
  buildTeamPayloadFromAdminRow,
  listMergedTeams,
} from "@/lib/services/catalog/teams-catalog-svc";
import { isHiddenTeamSlug } from "@/lib/data/blocked-team-slugs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/** Exporta CSV maestro con todas las columnas del editor de equipos. */
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

/** Importa CSV maestro: upsert por slug (actualiza equipos existentes). */
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
    const records = parseTeamsMasterCsv(await file.text()).filter(
      (r) => r.slug && !isHiddenTeamSlug(String(r.slug)),
    );
    if (!records.length) {
      return NextResponse.json({ error: "No hay filas válidas en el CSV" }, { status: 400 });
    }

    const syncedAt = new Date().toISOString();
    const payloads = records.map((r) => buildTeamPayloadFromAdminRow(r, syncedAt));
    await upsertBatched(supabase, payloads);

    await logCmsAudit({
      action: "teams_catalog.import_master_csv",
      entityType: "team",
      entityId: "batch",
      diff: { count: payloads.length },
    });

    return NextResponse.json({
      ok: true,
      imported: payloads.length,
      message: `${payloads.length} equipo(s) importados desde CSV maestro.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al importar" },
      { status: 500 },
    );
  }
}
