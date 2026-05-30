import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";
import { syncSupercellMatches } from "@/lib/services/sync/supercell-match-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Sincroniza partidos y marcadores desde Supercell (event + bracket). */
export async function POST(request: Request) {
  const cronOk = cronAuthorized(request);
  if (!cronOk) {
    const auth = await requireCmsAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  try {
    const result = await syncSupercellMatches(supabase!);
    await auditWrite("match.sync_supercell", "match", undefined, {
      inserted: result.inserted,
      updated: result.updated,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error de sincronización" },
      { status: 500 },
    );
  }
}
