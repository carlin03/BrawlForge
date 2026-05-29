import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "liquipedia.net",
  "upload.wikimedia.org",
  "taiyoro-prod-media.s3.amazonaws.com",
  "cdn.royaleapi.com",
  "mitiendanube.com",
  "dcdn-us.mitiendanube.com",
  "www.eternalesports.org",
  "eternalesports.org",
];

function hostAllowed(hostname: string): boolean {
  if (ALLOWED_HOSTS.includes(hostname)) return true;
  if (hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.in")) return true;
  if (hostname.endsWith(".mitiendanube.com")) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (
    !hostAllowed(parsed.hostname) ||
    (parsed.hostname === "liquipedia.net" && !parsed.pathname.startsWith("/commons/images/")) ||
    (parsed.hostname === "upload.wikimedia.org" && !parsed.pathname.startsWith("/wikipedia/"))
  ) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "BrawlForge/1.0 (Esports fan platform; contact: local-dev)",
        Accept: "image/png,image/webp,image/*,*/*",
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status === 429 ? 429 : 502 }
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
