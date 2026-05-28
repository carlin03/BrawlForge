/** Emails con acceso admin (dueño del proyecto). Separados por coma. */

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
  return [...new Set([...server, ...pub])];
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
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
