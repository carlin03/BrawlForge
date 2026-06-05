/**
 * Cuenta partidos visibles en calendario (misma lógica que la web).
 * node scripts/count-public-matches.mjs
 */
const run = async () => {
  const { matches } = await import("../src/lib/data/legacy-matches.ts");
  const { getMatchPool } = await import("../src/lib/data/match-pool.ts");
  const { buildPublicCalendarPool, isPublicScheduleMatch } = await import(
    "../src/lib/data/match-schedule-trust.ts"
  );
  const { getEffectiveMatchStatus } = await import("../src/lib/data/match-effective-status.ts");

  const pool = getMatchPool();
  const cal = buildPublicCalendarPool(pool);
  const pub = pool.filter(isPublicScheduleMatch);
  const byStatus = { live: 0, upcoming: 0, finished: 0, other: 0 };
  for (const m of cal) {
    const s = getEffectiveMatchStatus(m);
    if (s in byStatus) byStatus[s]++;
    else byStatus.other++;
  }

  console.log("legacy raw:", matches.length);
  console.log("pool:", pool.length);
  console.log("calendar (buildPublicCalendarPool):", cal.length);
  console.log("public finished (isPublicScheduleMatch):", pub.length);
  console.log("calendar by effective status:", byStatus);
  console.log(
    "with maps meta:",
    cal.filter((m) => m.meta?.maps?.order?.length).length,
    "/",
    cal.length,
  );
  console.log(
    "upcoming with predictions:",
    cal.filter((m) => getEffectiveMatchStatus(m) === "upcoming" && m.meta?.predictions?.winner).length,
  );
  if (byStatus.upcoming > 0) {
    console.log("\nUpcoming sample:");
    for (const m of cal.filter((m) => getEffectiveMatchStatus(m) === "upcoming").slice(0, 8)) {
      console.log(" -", m.id, m.date.slice(0, 10), m.teamASlug, "vs", m.teamBSlug);
    }
  }
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
