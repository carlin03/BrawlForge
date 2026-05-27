import { NextResponse } from "next/server";

const API = "https://event.supercell.com/brawlstars/v1";

/** Proxy público a la API oficial BSC de Supercell (solo endpoints abiertos). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const segment = path?.join("/") ?? "";
  const allowed = ["event", "bracket"];
  if (!allowed.includes(segment)) {
    return NextResponse.json({ error: "Endpoint no permitido" }, { status: 403 });
  }

  const res = await fetch(`${API}/${segment}`, {
    headers: { Accept: "application/json", "User-Agent": "BrawlForge/1.0" },
    next: { revalidate: 120 },
  });

  const text = await res.text();
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
    return NextResponse.json({ error: "Respuesta no JSON de Supercell" }, { status: 502 });
  }

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
