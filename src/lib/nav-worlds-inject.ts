import type { NavAccent } from "@/lib/nav-config";

type NavLike = { label: string; href: string; accent?: NavAccent };

const WORLDS_ITEM: NavLike = {
  label: "Worlds 2026",
  href: "/worlds",
  accent: "worlds",
};

/** Garantiza Worlds 2026 en nav aunque el CMS tenga menú viejo. */
export function ensureWorldsNavItem<T extends NavLike>(items: readonly T[]): T[] {
  const list = [...items] as T[];
  if (list.some((i) => i.href === "/worlds")) return list;
  const insertAt = Math.min(1, list.length);
  list.splice(insertAt, 0, WORLDS_ITEM as T);
  return list;
}
