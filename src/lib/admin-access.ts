/** Emails con acceso admin (dueño del proyecto). Separados por coma. */

/** Siempre admin en app (además de Vercel env y Supabase is_admin). */
export const BUILTIN_OWNER_EMAILS = ["carlinperez022@gmail.com"] as const;

function parseList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export function getPublicAdminEmails(): string[] {
  return parseList(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
}

export function getServerAdminEmails(): string[] {
  const server = parseList(process.env.ADMIN_EMAILS);
  const pub = parseList(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
  return [...new Set([...BUILTIN_OWNER_EMAILS, ...server, ...pub])];
}

export function isBuiltinOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (BUILTIN_OWNER_EMAILS as readonly string[]).includes(email.trim().toLowerCase());
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (isBuiltinOwnerEmail(email)) return true;
  const norm = email.trim().toLowerCase();
  return getServerAdminEmails().includes(norm) || getPublicAdminEmails().includes(norm);
}

export function resolveIsAdmin(
  email: string | null | undefined,
  profileIsAdmin: boolean,
): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_ADMIN === "true") return true;
  if (profileIsAdmin) return true;
  return isOwnerEmail(email);
}
