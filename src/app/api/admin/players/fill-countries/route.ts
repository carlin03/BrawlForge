import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { fillPlayerCountriesFromSeed } from "@/lib/services/catalog/fill-player-countries";
import { playerCountrySeedStats } from "@/lib/data/bsc-player-countries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  let regions = ["EMEA", "EA"];
  let overwrite = false;
  try {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body?.regions) && body.regions.length) {
      regions = body.regions.map((r: unknown) => String(r).trim().toUpperCase()).filter(Boolean);
    }
    if (body?.overwrite === true) overwrite = true;
  } catch {
    /* defaults */
  }

  try {
    const result = await fillPlayerCountriesFromSeed(supabase, { regions, overwrite });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al rellenar países" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    regions: ["EMEA", "EA"],
    seed: playerCountrySeedStats(),
    hint: "POST con { regions: [\"EMEA\",\"EA\"], overwrite: false } para rellenar solo vacíos.",
  });
}
