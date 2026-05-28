import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const REQUIRED_TABLES = [
  "profiles",
  "prediction_votes",
  "fantasy_entries",
  "fantasy_squad_slots",
] as const;

async function tableOk(
  url: string,
  headers: Record<string, string>,
  table: string,
): Promise<{ ok: boolean; missing: boolean; message?: string }> {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) return { ok: true, missing: false };
    const body = await res.json().catch(() => ({}));
    const msg = (body as { message?: string; code?: string }).message ?? "";
    const missing =
      (body as { code?: string }).code === "42P01" ||
      msg.includes("Could not find the table") ||
      msg.includes("does not exist");
    return { ok: false, missing, message: msg || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, missing: false, message: e instanceof Error ? e.message : "Error de red" };
  }
}

export async function GET() {
  const env = getSupabaseEnv();

  if (!env) {
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
    const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
    return NextResponse.json({
      connected: false,
      auth: false,
      profilesTable: false,
      tablesOk: false,
      missingTables: REQUIRED_TABLES,
      message: hasUrl || hasKey ? "Configuración de base de datos incorrecta." : "Servicio no configurado.",
    });
  }

  const { url, anonKey: key } = env;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  let auth = false;
  try {
    const health = await fetch(`${url}/auth/v1/health`, { headers, cache: "no-store" });
    auth = health.ok;
  } catch {
    auth = false;
  }

  const missingTables: string[] = [];
  for (const table of REQUIRED_TABLES) {
    const t = await tableOk(url, headers, table);
    if (!t.ok) {
      if (t.missing) missingTables.push(table);
    }
  }

  const profilesTable = !missingTables.includes("profiles");
  const tablesOk = missingTables.length === 0;
  const projectRef = url.replace("https://", "").replace(".supabase.co", "");

  let message: string;
  if (!auth) {
    message = "No se pudo conectar al Auth. Revisa URL y clave anon del mismo proyecto.";
  } else if (!profilesTable) {
    message = "Base de datos incompleta.";
  } else if (!tablesOk) {
    message = "Base de datos incompleta. Contacta al administrador.";
  } else {
    message = "Servicio listo.";
  }

  return NextResponse.json({
    connected: auth,
    auth,
    profilesTable,
    tablesOk,
    missingTables,
    projectRef,
    message,
  });
}
