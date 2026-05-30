import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  deletePlayer,
  listMergedPlayers,
  syncPlayersFromLocal,
  upsertPlayer,
} from "@/lib/services/catalog/players-catalog-svc";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  try {
    const result = await listMergedPlayers(supabase);
    return NextResponse.json({
      ok: true,
      ...result,
      hint:
        result.sync.pendingImport > 0
          ? "Hay jugadores del circuito BSC en código que aún no están en Supabase. Usa PUT para importarlos."
          : undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const body = await request.json();
  const row = body.row as Record<string, unknown>;
  if (!row?.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  try {
    const result = await upsertPlayer(supabase, row);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

/** Importa jugadores BSC locales → players_catalog */
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  let limit: number | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.limit === "number") limit = Math.min(500, Math.max(1, body.limit));
  } catch {
    /* sin body */
  }

  try {
    const result = await syncPlayersFromLocal(supabase, limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const slug = String(new URL(request.url).searchParams.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  try {
    const result = await deletePlayer(supabase, slug);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
