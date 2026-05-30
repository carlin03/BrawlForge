import { NextResponse } from "next/server";
import { loadPlayoffBracketsFromDb } from "@/lib/cms/load-playoff-brackets";

export const dynamic = "force-dynamic";

/** Brackets de playoff guardados en CMS (lectura pública). */
export async function GET() {
  try {
    const brackets = await loadPlayoffBracketsFromDb();
    return NextResponse.json({ ok: true, brackets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "brackets_error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
