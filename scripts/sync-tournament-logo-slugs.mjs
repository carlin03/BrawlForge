/**
 * Sincroniza slugs con logo manual (Supabase) → tournament-logos-user.json
 *   node scripts/sync-tournament-logo-slugs.mjs --write
 */
import { syncUserLogoSlugsToCache, loadUserLogoTournamentSlugs } from "./lib/tournament-logo-slugs.mjs";

const WRITE = process.argv.includes("--write");

if (!WRITE) {
  const slugs = loadUserLogoTournamentSlugs();
  console.log(`Torneos con logo (cache): ${slugs.size}`);
  console.log([...slugs].join("\n"));
  console.log("\nUsa --write para sincronizar desde Supabase.");
  process.exit(0);
}

const slugs = await syncUserLogoSlugsToCache();
console.log(`Sincronizados ${slugs.length} torneos con logo de usuario.`);
