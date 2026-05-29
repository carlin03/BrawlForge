import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrollUserInDefaultFantasy } from "@/lib/supabase/enroll";

export async function POST() {
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

  try {
    await enrollUserInDefaultFantasy(supabase, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al inscribir";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
