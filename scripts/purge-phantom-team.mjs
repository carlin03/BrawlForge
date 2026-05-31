/**
 * Elimina el equipo fantasma "." / "punto (.)" de Supabase.
 * Uso: node scripts/purge-phantom-team.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

function isPhantom(slug, name) {
  const s = String(slug ?? "").trim().toLowerCase();
  const n = String(name ?? "").trim().toLowerCase();
  if (!s || s === "." || /^\.+$/.test(s)) return true;
  if (n === "punto (.)" || n === "punto" || n === ".") return true;
  return false;
}

const { data: teams } = await supabase.from("teams_catalog").select("slug, name");
for (const row of teams ?? []) {
  if (!isPhantom(row.slug, row.name)) continue;
  console.log("Borrando equipo:", row.slug, row.name);
  await supabase.from("team_logo_overrides").delete().eq("slug", row.slug);
  await supabase.from("teams_catalog").delete().eq("slug", row.slug);
}

const { data: players } = await supabase
  .from("players_catalog")
  .select("slug, team_slug")
  .not("team_slug", "is", null);
for (const p of players ?? []) {
  if (!isPhantom(p.team_slug, null)) continue;
  await supabase.from("players_catalog").update({ team_slug: null }).eq("slug", p.slug);
  console.log("Jugador sin equipo:", p.slug);
}

console.log("Listo.");
