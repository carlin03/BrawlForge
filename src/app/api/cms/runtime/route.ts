import { NextResponse } from "next/server";
import { loadCmsRuntime } from "@/lib/cms/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const runtime = await loadCmsRuntime();
    return NextResponse.json(runtime);
  } catch (e) {
    const message = e instanceof Error ? e.message : "runtime_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
