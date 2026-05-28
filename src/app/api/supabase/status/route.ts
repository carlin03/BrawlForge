import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({
      connected: false,
      auth: false,
      profilesTable: false,
      message: "Faltan variables en .env.local (URL y clave publishable/anon).",
    });
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  let auth = false;
  let profilesTable = false;
  let profilesError: string | null = null;

  try {
    const health = await fetch(`${url}/auth/v1/health`, { headers, cache: "no-store" });
    auth = health.ok;
  } catch {
    auth = false;
  }

  try {
    const profiles = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers,
      cache: "no-store",
    });
    if (profiles.ok) {
      profilesTable = true;
    } else {
      const body = await profiles.json().catch(() => ({}));
      profilesError = (body as { message?: string }).message ?? `HTTP ${profiles.status}`;
      if (profilesError.includes("Could not find the table")) {
        profilesError = "La tabla public.profiles no existe — ejecuta la migración SQL.";
      }
    }
  } catch (e) {
    profilesError = e instanceof Error ? e.message : "Error de red";
  }

  const projectRef = url.replace("https://", "").replace(".supabase.co", "");

  return NextResponse.json({
    connected: auth,
    auth,
    profilesTable,
    profilesError,
    projectRef,
    message: !auth
      ? "No se pudo conectar al Auth de Supabase. Revisa URL y clave del mismo proyecto."
      : profilesTable
        ? "Conectado. Los usuarios nuevos tendrán fila en profiles."
        : "Auth conectado, pero falta la tabla profiles (migración SQL). Sin ella el registro puede fallar.",
  });
}
