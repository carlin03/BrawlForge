import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/cms/admin-api";
import { syncSupercellMatches } from "@/lib/services/sync/supercell-match-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cron Vercel: GET con Authorization Bearer CRON_SECRET */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  try {
    const result = await syncSupercellMatches(supabase!);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
