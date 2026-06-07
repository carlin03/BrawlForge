/**
 * Verifica partidos publicados vs parser Liquipedia (mismo wikitext).
 *
 *   node scripts/audit-liquipedia-vs.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  sleep,
  fetchWikitextBatch,
  parseMatchesFromWikitext,
  buildTeamResolver,
} from "./liquipedia-api.mjs";
import { shouldPublishMatch } from "./lib/match-publish-filter.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");

function pairKey(m) {
  const a = m.teamASlug;
  const b = m.teamBSlug;
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  return `${m.tournamentSlug}|${pair}|${(m.date || "").slice(0, 10)}`;
}

function normPublished(m) {
  return {
    key: pairKey(m),
    teamASlug: m.teamASlug,
    teamBSlug: m.teamBSlug,
    scoreA: m.scoreA ?? 0,
    scoreB: m.scoreB ?? 0,
    status: m.status,
    date: m.date,
    stage: m.stage,
    format: m.format,
    teamA: m.meta?.team_display?.a,
    teamB: m.meta?.team_display?.b,
  };
}

async function main() {
  const teams = JSON.parse(readFileSync(resolve(gen, "teams.json"), "utf8"));
  const tours = JSON.parse(readFileSync(resolve(gen, "tournaments-2026.json"), "utf8"));
  const allMatches = JSON.parse(readFileSync(resolve(gen, "matches-2026.json"), "utf8"));
  const published = allMatches.filter(shouldPublishMatch);
  const resolveTeam = buildTeamResolver(teams);

  const tourBySlug = new Map(tours.map((t) => [t.slug, t]));
  const byTour = new Map();
  for (const m of published) {
    const list = byTour.get(m.tournamentSlug) ?? [];
    list.push(m);
    byTour.set(m.tournamentSlug, list);
  }

  const slugs = [...byTour.keys()].filter((s) => tourBySlug.get(s)?.liquipediaPage);
  console.log(`Auditando ${published.length} partidos en ${slugs.length} torneos…\n`);

  const mismatches = [];
  const missingOnWiki = [];
  const extraOnWiki = [];
  let verified = 0;

  for (let i = 0; i < slugs.length; i += 20) {
    const batch = slugs.slice(i, i + 20);
    const titles = batch.map((s) => tourBySlug.get(s).liquipediaPage);
    const texts = await fetchWikitextBatch(titles);
    process.stdout.write(`  batch ${Math.floor(i / 20) + 1}/${Math.ceil(slugs.length / 20)}… `);

    for (const slug of batch) {
      const tour = tourBySlug.get(slug);
      const page = tour.liquipediaPage;
      const wikitext = texts[page] ?? texts[page.replace(/_/g, " ")] ?? "";
      if (!wikitext) continue;

      const parsed = parseMatchesFromWikitext(
        wikitext,
        slug,
        tour.region,
        resolveTeam,
        page.replace(/ /g, "_"),
      ).filter(shouldPublishMatch);

      const pubMap = new Map(byTour.get(slug).map((m) => [pairKey(m), normPublished(m)]));
      const wikiMap = new Map(parsed.map((m) => [pairKey(m), normPublished(m)]));

      for (const [key, pub] of pubMap) {
        const wiki = wikiMap.get(key);
        if (!wiki) {
          missingOnWiki.push({ slug, key, pub });
          continue;
        }
        const scoreOk =
          pub.status !== "finished" ||
          (pub.scoreA === wiki.scoreA && pub.scoreB === wiki.scoreB);
        const teamsOk = pub.teamASlug === wiki.teamASlug && pub.teamBSlug === wiki.teamBSlug;
        if (scoreOk && teamsOk) {
          verified++;
        } else {
          mismatches.push({ slug, key, pub, wiki });
        }
      }

      for (const [key, wiki] of wikiMap) {
        if (!pubMap.has(key)) extraOnWiki.push({ slug, key, wiki });
      }
    }
    console.log("ok");
    if (i + 20 < slugs.length) await sleep(700);
  }

  const report = {
    auditedAt: new Date().toISOString(),
    published: published.length,
    tournaments: slugs.length,
    verified,
    mismatches: mismatches.length,
    missingOnWiki: missingOnWiki.length,
    extraOnWiki: extraOnWiki.length,
    mismatchSamples: mismatches.slice(0, 20),
    missingSamples: missingOnWiki.slice(0, 15),
  };

  const outPath = resolve(gen, "liquipedia-vs-audit.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n── Resultado ──");
  console.log(`  Verificados OK:     ${verified}`);
  console.log(`  Desajustes:         ${mismatches.length}`);
  console.log(`  En web, no en wiki: ${missingOnWiki.length}`);
  console.log(`  En wiki, no public.: ${extraOnWiki.length}`);
  console.log(`  → ${outPath}`);

  if (mismatches.length > 0) {
    console.log("\nMuestras desajuste:");
    mismatches.slice(0, 5).forEach((x) => {
      console.log(`  ${x.slug} ${x.key}`);
      console.log(`    web: ${x.pub.scoreA}-${x.pub.scoreB} ${x.pub.teamASlug} vs ${x.pub.teamBSlug}`);
      console.log(`    lp:  ${x.wiki.scoreA}-${x.wiki.scoreB} ${x.wiki.teamASlug} vs ${x.wiki.teamBSlug}`);
    });
  }

  process.exit(mismatches.length > 0 || missingOnWiki.length > published.length * 0.05 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
