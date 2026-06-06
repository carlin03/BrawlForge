import { NextResponse } from "next/server";
import { loadCmsRuntimeLite } from "@/lib/cms/runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Config + home en <5s — sin pool de partidos (evita 504 en Vercel). */
export async function GET() {
  try {
    const runtime = await loadCmsRuntimeLite();
    return NextResponse.json(runtime);
  } catch (e) {
    const message = e instanceof Error ? e.message : "runtime_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
