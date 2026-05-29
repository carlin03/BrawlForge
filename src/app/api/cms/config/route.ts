import { NextResponse } from "next/server";
import { resolveCmsConfig } from "@/lib/cms/resolve";

export const dynamic = "force-dynamic";

/** Configuración pública resuelta (legacy por defecto). */
export async function GET() {
  try {
    const config = await resolveCmsConfig();
    return NextResponse.json({ ok: true, config });
  } catch (e) {
    const message = e instanceof Error ? e.message : "cms_config_error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
