import { isHiddenTeamSlug } from "./blocked-team-slugs";

export function isValidLogoSlug(slug: string | undefined | null): slug is string {
  return !!slug && !isHiddenTeamSlug(slug);
}
