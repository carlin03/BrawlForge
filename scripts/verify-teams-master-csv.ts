/**
 * Verificación Teams Master CSV — node --import tsx scripts/verify-teams-master-csv.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { parseAchievements, parseTeamMeta } from "../src/lib/data/profile-wiki";
import {
  TEAM_MASTER_V2_HEADER,
  buildTeamsMasterCsv,
  parseTeamsMasterCsvObjects,
  validateTeamsMasterCsvRows,
  masterCsvObjectToPartialRecord,
  mergeMasterCsvWithExisting,
} from "../src/lib/admin/teams-master-csv";
import type { AdminTeamCatalogRow } from "../src/lib/data/admin-catalog-fields";

const root = join(import.meta.dirname ?? __dirname, "..");

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function main() {
  const exampleText = readFileSync(join(root, "public/plantillas/teams-master-example.csv"), "utf8");
  const { headers, rows } = parseTeamsMasterCsvObjects(exampleText);

  assert(headers[0] === "slug", `Primera columna debe ser slug, fue: ${headers[0]}`);
  assert(headers.includes("manager"), "Cabecera v2 debe incluir manager");

  const validation = validateTeamsMasterCsvRows(rows, headers, {});
  const errors = validation.issues.filter((i) => i.errors.length);
  assert(errors.length === 0, `Ejemplo con errores: ${JSON.stringify(errors, null, 2)}`);
  assert(
    validation.valid.some((r) => r.raw.slug === "sk-gaming"),
    "Falta fila sk-gaming válida",
  );

  const sampleTeam: AdminTeamCatalogRow = {
    slug: "test-roundtrip",
    name: 'Test "Club"',
    tag: "TC",
    region: "EMEA",
    country: "ES",
    rank: 5,
    rank_change: 2,
    earnings: 1000,
    form: ["W", "L", "W"],
    roster_slugs: ["player-a", "player-b"],
    logo_url: null,
    description: "Intro",
    coach: "Coach",
    manager: "Mgr",
    captain_slug: "player-a",
    peak_rank: 3,
    founded_year: 2020,
    headquarters: "Madrid",
    website: "https://test.com",
    circuit_status: "active",
    bsc_qualified_2026: true,
    circuit_summary: "Sum",
    achievements: [{ place: "1º", tournament: 'Cup "X"', prize: "$1", date: "2025" }],
    sponsors_json: [{ name: "Spo|nsor", category: "A" }],
    social: { twitter: "https://x.com/t" },
    meta: {
      tagline: "Tag",
      motto: "Motto",
      wiki_sections: [
        {
          id: "s1",
          title: "Hist",
          paragraphs: ["Linea 1", 'Dice "hola"', "Segunda"],
        },
      ],
      fun_facts: ["f1|f2", "f3"],
      rivals: ["r1|r2"],
      gallery_urls: ["https://a.jpg", "https://b.jpg"],
      card_theme: { primary: "#111111", secondary: "#222222", glow: "rgba(0,0,0,0.5)" },
    },
  };

  const exported = buildTeamsMasterCsv([sampleTeam]);
  const rt = parseTeamsMasterCsvObjects(exported);
  assert(rt.rows.length === 1, "Roundtrip: una fila de datos");
  const raw = rt.rows[0]!.raw;

  assert(raw.history_content.includes('Dice "hola"'), "history_content corrupto");
  assert(JSON.parse(raw.trophies_json)[0].tournament === 'Cup "X"', "trophies_json corrupto");
  assert(JSON.parse(raw.sponsors_json)[0].name === "Spo|nsor", "sponsors_json corrupto");
  assert(JSON.parse(raw.card_theme_json).primary === "#111111", "card_theme_json corrupto");
  assert(raw.roster_slugs === "player-a|player-b", `roster_slugs: ${raw.roster_slugs}`);
  assert(raw.fun_facts.includes("f1|f2"), "fun_facts pipes");
  assert(raw.gallery_urls.includes("|") === false || raw.gallery_urls.split("|").length === 2, "gallery_urls");

  const exported2 = buildTeamsMasterCsv([sampleTeam]);
  assert(exported2.includes(TEAM_MASTER_V2_HEADER), "Export incluye cabecera v2");

  const existing: Record<string, unknown> = {
    slug: "legacy-team",
    name: "Legacy",
    tag: "LG",
    region: "EMEA",
    country: "ES",
    rank: 10,
    rank_change: 3,
    form: ["W", "W"],
    roster_slugs: ["p1", "p2"],
    manager: "Old Manager",
    peak_rank: 5,
    description: "Old desc",
    meta: {
      tagline: "Old tagline",
      wiki_sections: [{ id: "w1", title: "H", paragraphs: ["p"] }],
    },
    achievements: [{ place: "1", tournament: "T", prize: "0", date: "2024" }],
    sponsors_json: [{ name: "OldSponsor" }],
  };

  const v1raw: Record<string, string> = {
    slug: "legacy-team",
    name: "Legacy Updated",
    tag: "LG",
    region: "EMEA",
    country: "",
    global_rank: "",
    earnings: "",
    phase_tagline: "",
    circuit_summary: "",
    coach: "",
    founded_year: "",
    city: "",
    status: "active",
    main_description: "",
    club_slogan: "",
    history_content: "",
    fun_facts: "",
    historic_rivals: "",
    roster_slugs: "",
    trophies_json: "",
    twitter_url: "",
    youtube_url: "",
    twitch_url: "",
    discord_url: "",
    instagram_url: "",
    tiktok_url: "",
    website_url: "",
    logo_url: "",
    banner_url: "",
    gallery_urls: "",
  };

  const merged = mergeMasterCsvWithExisting(
    existing,
    masterCsvObjectToPartialRecord(v1raw),
    v1raw,
  );
  assert(merged.name === "Legacy Updated", "v1: name");
  assert(merged.manager === "Old Manager", "v1: manager preservado");
  assert(parseTeamMeta(merged.meta).tagline === "Old tagline", "v1: tagline");
  assert(parseAchievements(merged.achievements).length === 1, "v1: achievements");

  const v2raw: Record<string, string> = {
    ...v1raw,
    manager: "",
    rank_change: "",
    form: "",
    sponsors_json: "",
    history_content: "",
    trophies_json: "",
    roster_slugs: "",
    captain_slug: "",
    peak_rank: "",
  };
  Object.assign(v2raw, {
    slug: "legacy-team",
    name: "Legacy",
    global_rank: "10",
    manager: "",
    rank_change: "",
    form: "",
    sponsors_json: "",
    trophies_json: "",
    history_content: "",
    roster_slugs: "",
    captain_slug: "",
    peak_rank: "",
    card_theme_json: "",
    gallery_urls: "",
    fun_facts: "",
    historic_rivals: "",
  });
  for (const col of [
    "manager",
    "rank_change",
    "form",
    "sponsors_json",
    "trophies_json",
    "history_content",
    "roster_slugs",
    "captain_slug",
    "peak_rank",
    "card_theme_json",
    "gallery_urls",
    "fun_facts",
    "historic_rivals",
  ]) {
    v2raw[col] = "";
  }

  const mergedV2 = mergeMasterCsvWithExisting(
    existing,
    masterCsvObjectToPartialRecord(v2raw),
    v2raw,
  );
  assert(mergedV2.manager === "Old Manager", "v2 vacío: manager");
  assert(Number(mergedV2.rank_change) === 3, "v2 vacío: rank_change");
  assert((mergedV2.form as string[]).join("|") === "W|W", "v2 vacío: form");

  console.log("✓ teams-master-csv: ejemplo, roundtrip, v1 y v2 vacío OK");
}

main();
