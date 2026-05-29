import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerAdminEmails, isBuiltinOwnerEmail } from "@/lib/admin-access";

/** Guarda is_admin=true en Supabase para emails dueño (builtin + ADMIN_EMAILS). */
export async function POST() {
  const allowed = getServerAdminEmails();

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Inicia sesión primero" }, { status: 401 });
  }

  const email = user.email.trim().toLowerCase();
  if (!allowed.includes(email)) {
    return NextResponse.json(
      {
        error: "Este email no tiene permiso de dueño",
        email,
        hint: isBuiltinOwnerEmail(email)
          ? "Contacta soporte del proyecto"
          : "Añade tu email en Vercel → ADMIN_EMAILS y NEXT_PUBLIC_ADMIN_EMAILS, luego Redeploy",
      },
      { status: 403 },
    );
  }

  const { error: upsertErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: user.user_metadata?.display_name ?? email.split("@")[0],
      ign: user.user_metadata?.ign ?? email.split("@")[0],
      is_admin: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, isAdmin: true, email });
}
