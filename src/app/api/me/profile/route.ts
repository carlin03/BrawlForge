import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, string | null> = {};

  if (typeof body.displayName === "string") {
    const v = body.displayName.trim().slice(0, 48);
    if (v.length >= 2) updates.display_name = v;
  }
  if (typeof body.ign === "string") {
    const v = body.ign.trim().slice(0, 32);
    if (v.length >= 2) updates.ign = v;
  }
  if (body.favoriteTeamSlug === null) {
    updates.favorite_team_slug = null;
  } else if (typeof body.favoriteTeamSlug === "string") {
    const v = body.favoriteTeamSlug.trim().toLowerCase();
    if (v.length >= 2 && v.length <= 64) updates.favorite_team_slug = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("display_name, ign, favorite_team_slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    displayName: data.display_name,
    ign: data.ign,
    favoriteTeamSlug: data.favorite_team_slug,
  });
}
