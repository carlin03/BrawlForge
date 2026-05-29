import { NextRequest, NextResponse } from "next/server";
import { isPublicImageFetchUrl } from "@/lib/image-fetch-url";

export const dynamic = "force-dynamic";

/** Proxy de imágenes: acepta cualquier URL pública (logos manuales, CDNs, Storage, etc.). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isPublicImageFetchUrl(url)) {
    return NextResponse.json({ error: "URL no permitida" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "BrawlForge/1.0 (image proxy)",
        Accept: "image/png,image/webp,image/jpeg,image/gif,image/svg+xml,image/*,*/*",
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status === 429 ? 429 : 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
