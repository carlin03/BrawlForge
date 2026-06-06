import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Rutas que necesitan refresco de sesión Supabase (no bloquear la home pública). */
const SESSION_PATHS = [
  "/admin",
  "/profile",
  "/login",
  "/registro",
  "/auth",
  "/fantasy",
  "/predictions",
  "/pickems",
  "/api/me",
  "/api/admin",
];

function needsSessionRefresh(pathname: string): boolean {
  return SESSION_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  if (!needsSessionRefresh(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
