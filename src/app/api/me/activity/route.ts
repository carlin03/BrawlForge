import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_PATH_LEN = 120;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const path =
    typeof body.path === "string" ? body.path.trim().slice(0, MAX_PATH_LEN) : "/";
  const safePath = path.startsWith("/") ? path : `/${path}`;

  const { data: row } = await supabase
    .from("profiles")
    .select("page_views")
    .eq("id", user.id)
    .maybeSingle();

  const views =
    row?.page_views && typeof row.page_views === "object" && !Array.isArray(row.page_views)
      ? { ...(row.page_views as Record<string, number>) }
      : {};
  views[safePath] = (Number(views[safePath]) || 0) + 1;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      last_seen_at: now,
      last_path: safePath,
      page_views: views,
      updated_at: now,
    })
    .eq("id", user.id);

  if (error?.message?.includes("last_seen_at") || error?.message?.includes("page_views")) {
    await supabase.from("profiles").update({ updated_at: now }).eq("id", user.id);
    return NextResponse.json({ ok: true, degraded: true });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
