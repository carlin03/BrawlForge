import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { buildUiRemoteLogoChain } from "@/lib/data/team-logo-urls";

export const runtime = "nodejs";

/** Devuelve la mejor URL CDN para pegar en admin (sin Liquipedia directo). */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug requerido" }, { status: 400 });
  }

  const chain = buildUiRemoteLogoChain(slug);
  const url = chain[0];
  if (!url) {
    return NextResponse.json({ error: "Sin URL automática para este club" }, { status: 404 });
  }

  return NextResponse.json({ slug, url, chain: chain.slice(0, 5) });
}
