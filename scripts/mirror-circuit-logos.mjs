/**
 * Copia logos de Ninguém Segura y Big Talents a Supabase Storage.
 * Uso (con .env.local): node scripts/mirror-circuit-logos.mjs
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

const TEAMS = {
  "ninguem-segura":
    "https://cdn.escharts.com/uploads/public/67b/b3c/0d6/67bb3c0d612ea264136572.png",
  "big-talents":
    "https://liquipedia.net/commons/images/thumb/6/6c/Big_Talents_allmode.png/600px-Big_Talents_allmode.png",
};

const UA = {
  "User-Agent": "BrawlForge/1.0 (mirror-circuit-logos)",
  Accept: "image/*",
};

function headersFor(imageUrl) {
  const h = { ...UA };
  const host = new URL(imageUrl).hostname;
  if (host.includes("liquipedia")) h.Referer = "https://liquipedia.net/";
  if (host.includes("escharts")) h.Referer = "https://escharts.com/";
  return h;
}

const supabase = createClient(url, key);

for (const [slug, sourceUrl] of Object.entries(TEAMS)) {
  console.log(`\n${slug} ← ${sourceUrl}`);
  const res = await fetch(sourceUrl, { headers: headersFor(sourceUrl) });
  if (!res.ok) {
    console.error(`  download failed ${res.status}`);
    continue;
  }
  const ct = res.headers.get("content-type") ?? "image/png";
  const bytes = Buffer.from(await res.arrayBuffer());
  const ext = ct.includes("webp") ? "webp" : "png";
  const path = `teams/${slug}.${ext}`;
  const { error: upErr } = await supabase.storage.from("logos").upload(path, bytes, {
    contentType: ct,
    upsert: true,
  });
  if (upErr) {
    console.error(`  storage: ${upErr.message}`);
    continue;
  }
  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  const publicUrl = data.publicUrl.split("?")[0];
  const savedAt = new Date().toISOString();
  await supabase.from("team_logo_overrides").upsert({
    slug,
    public_url: publicUrl,
    treatment: "raw",
    updated_at: savedAt,
  });
  await supabase.from("teams_catalog").upsert({
    slug,
    name: slug === "ninguem-segura" ? "Ninguém Segura" : "Big Talents",
    tag: slug === "ninguem-segura" ? "NS" : "BT",
    region: slug === "ninguem-segura" ? "SA" : "EMEA",
    logo_url: publicUrl,
    synced_at: savedAt,
  });
  console.log(`  OK → ${publicUrl}`);
}

console.log("\nListo.");
