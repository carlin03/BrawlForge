const INVALID = new Set(["", "tbd", "team"]);

export function isValidLogoSlug(slug: string | undefined | null): slug is string {
  return !!slug && !INVALID.has(slug.toLowerCase());
}
