import type { EsportsMatch } from "./matches";

/** Partidos BSC 2026 — Liquipedia (Brawl Cup, MF, PSI, Challengers) */
export const bscMatches: EsportsMatch[] = [
  // ── Brawl Cup 2026 — Group A (HMBLE, BH, Ace Xero) ──
  { id: "bc26-ga-1", teamASlug: "bounty-hunters-esports", teamBSlug: "hmble", scoreA: 1, scoreB: 3, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group A", date: "2026-05-15T11:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-ga-2", teamASlug: "bounty-hunters-esports", teamBSlug: "ace-xero", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group A", date: "2026-05-15T12:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-ga-3", teamASlug: "hmble", teamBSlug: "ace-xero", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group A", date: "2026-05-15T13:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },

  // ── Group B (ZETA, Only Realm, BC* SA) ──
  { id: "bc26-gb-1", teamASlug: "only-realm", teamBSlug: "zeta-division", scoreA: 2, scoreB: 3, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group B", date: "2026-05-15T14:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-gb-2", teamASlug: "only-realm", teamBSlug: "bc-gaming-sa", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group B", date: "2026-05-15T14:45:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-gb-3", teamASlug: "zeta-division", teamBSlug: "bc-gaming-sa", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group B", date: "2026-05-15T15:30:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },

  // ── Group C (CR, Revenant XSpark, Eternal) ──
  { id: "bc26-gc-1", teamASlug: "crazy-raccoon", teamBSlug: "eternal-esports", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group C", date: "2026-05-16T11:30:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-gc-2", teamASlug: "crazy-raccoon", teamBSlug: "revenant-xspark", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group C", date: "2026-05-16T12:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-gc-3", teamASlug: "eternal-esports", teamBSlug: "revenant-xspark", scoreA: 1, scoreB: 3, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group C", date: "2026-05-16T13:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },

  // ── Group D (Tribe, FUT, Toxic Lotus) ──
  { id: "bc26-gd-1", teamASlug: "fut-esports", teamBSlug: "tribe-gaming", scoreA: 2, scoreB: 3, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group D", date: "2026-05-16T13:30:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-gd-2", teamASlug: "fut-esports", teamBSlug: "toxic-lotus", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group D", date: "2026-05-16T14:45:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-gd-3", teamASlug: "tribe-gaming", teamBSlug: "toxic-lotus", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-brawl-cup", stage: "Group D", date: "2026-05-16T15:30:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },

  // ── Playoffs ──
  { id: "bc26-qf1", teamASlug: "hmble", teamBSlug: "only-realm", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Quarterfinal", date: "2026-05-17T11:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-qf2", teamASlug: "tribe-gaming", teamBSlug: "revenant-xspark", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-brawl-cup", stage: "Quarterfinal", date: "2026-05-17T12:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-qf3", teamASlug: "zeta-division", teamBSlug: "bounty-hunters-esports", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Quarterfinal", date: "2026-05-17T13:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-qf4", teamASlug: "crazy-raccoon", teamBSlug: "fut-esports", scoreA: 1, scoreB: 3, tournamentSlug: "bsc-2026-brawl-cup", stage: "Quarterfinal", date: "2026-05-17T13:30:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-sf1", teamASlug: "hmble", teamBSlug: "tribe-gaming", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-brawl-cup", stage: "Semifinal", date: "2026-05-17T14:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-sf2", teamASlug: "zeta-division", teamBSlug: "fut-esports", scoreA: 0, scoreB: 3, tournamentSlug: "bsc-2026-brawl-cup", stage: "Semifinal", date: "2026-05-17T15:00:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },
  { id: "bc26-gf", teamASlug: "hmble", teamBSlug: "fut-esports", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-brawl-cup", stage: "Grand Final", date: "2026-05-17T15:30:00Z", status: "finished", region: "GLOBAL", format: "Bo5" },

  // ── March 2026 EMEA Monthly Finals (Liquipedia) ──
  { id: "mf26-mar-emea-qf1", teamASlug: "fut-esports", teamBSlug: "kebap", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-march-emea-mf", stage: "Quarterfinal", date: "2026-03-15T13:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-mar-emea-qf2", teamASlug: "team-heretics", teamBSlug: "natus-vincere", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-march-emea-mf", stage: "Quarterfinal", date: "2026-03-15T13:30:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-mar-emea-sf1", teamASlug: "fut-esports", teamBSlug: "team-heretics", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-march-emea-mf", stage: "Semifinal", date: "2026-03-15T16:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-mar-emea-qf3", teamASlug: "hmble", teamBSlug: "totem-esports", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-march-emea-mf", stage: "Quarterfinal", date: "2026-03-15T14:45:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-mar-emea-qf4", teamASlug: "novo-esports", teamBSlug: "sk-gaming", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-march-emea-mf", stage: "Quarterfinal", date: "2026-03-15T15:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-mar-emea-sf2", teamASlug: "hmble", teamBSlug: "novo-esports", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-march-emea-mf", stage: "Semifinal", date: "2026-03-15T17:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-mar-emea-gf", teamASlug: "fut-esports", teamBSlug: "hmble", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-march-emea-mf", stage: "Grand Final", date: "2026-03-15T18:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },

  // ── March 2026 NA Monthly Finals ──
  { id: "mf26-mar-na-sf", teamASlug: "stmn-esports", teamBSlug: "zoos-esports", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-march-na-mf", stage: "Semifinal", date: "2026-03-22T20:00:00Z", status: "finished", region: "NA", format: "Bo5" },
  { id: "mf26-mar-na-gf", teamASlug: "stmn-esports", teamBSlug: "tribe-gaming", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-march-na-mf", stage: "Grand Final", date: "2026-03-22T21:00:00Z", status: "finished", region: "NA", format: "Bo5" },

  // ── April 2026 Monthly Finals (S3) ──
  { id: "mf26-apr-emea-sf", teamASlug: "sk-gaming", teamBSlug: "hmble", scoreA: 2, scoreB: 3, tournamentSlug: "bsc-2026-april-emea-mf", stage: "Semifinal", date: "2026-04-12T11:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-apr-emea-gf", teamASlug: "sk-gaming", teamBSlug: "fut-esports", scoreA: 0, scoreB: 3, tournamentSlug: "bsc-2026-april-emea-mf", stage: "Grand Final", date: "2026-04-12T13:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-apr-ea-gf", teamASlug: "crazy-raccoon", teamBSlug: "zeta-division", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-april-ea-mf", stage: "Grand Final", date: "2026-04-11T21:00:00Z", status: "finished", region: "EA", format: "Bo5" },
  { id: "mf26-apr-ea-sf", teamASlug: "crazy-raccoon", teamBSlug: "reject", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-april-ea-mf", stage: "Semifinal", date: "2026-04-11T19:00:00Z", status: "finished", region: "EA", format: "Bo5" },
  { id: "mf26-apr-na-gf", teamASlug: "tribe-gaming", teamBSlug: "only-realm", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-april-na-mf", stage: "Grand Final", date: "2026-04-19T21:00:00Z", status: "finished", region: "NA", format: "Bo5" },
  { id: "mf26-apr-sa-gf", teamASlug: "eternal-esports", teamBSlug: "bounty-hunters-esports", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-april-sa-mf", stage: "Grand Final", date: "2026-04-18T20:30:00Z", status: "finished", region: "SA", format: "Bo5" },

  // ── March 2026 EA / SA Monthly Finals ──
  { id: "mf26-mar-ea-gf", teamASlug: "crazy-raccoon", teamBSlug: "reject", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-march-ea-mf", stage: "Grand Final", date: "2026-03-14T21:00:00Z", status: "finished", region: "EA", format: "Bo5" },
  { id: "mf26-mar-sa-gf", teamASlug: "loud", teamBSlug: "skcalalas", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-march-sa-mf", stage: "Grand Final", date: "2026-03-21T21:00:00Z", status: "finished", region: "SA", format: "Bo5" },

  // ── February 2026 Monthly Finals ──
  { id: "mf26-feb-emea-gf", teamASlug: "hmble", teamBSlug: "sk-gaming", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-february-emea-mf", stage: "Grand Final", date: "2026-02-15T15:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "mf26-feb-ea-gf", teamASlug: "zeta-division", teamBSlug: "crazy-raccoon", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-february-ea-mf", stage: "Grand Final", date: "2026-02-14T21:00:00Z", status: "finished", region: "EA", format: "Bo5" },
  { id: "mf26-feb-na-gf", teamASlug: "tribe-gaming", teamBSlug: "stmn-esports", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-february-na-mf", stage: "Grand Final", date: "2026-02-22T21:00:00Z", status: "finished", region: "NA", format: "Bo5" },
  { id: "mf26-feb-sa-gf", teamASlug: "skcalalas", teamBSlug: "eternal-esports", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-february-sa-mf", stage: "Grand Final", date: "2026-02-21T21:00:00Z", status: "finished", region: "SA", format: "Bo5" },

  // ── Chinese Mainland May 2026 Monthly Finals ──
  { id: "mf26-may-cn-gf", teamASlug: "toxic-lotus", teamBSlug: "ace-xero", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-cn-may-mf", stage: "Grand Final", date: "2026-05-23T12:00:00Z", status: "finished", region: "EA", format: "Bo5" },

  // ── Challengers DACH 2026 — final ──
  { id: "chal26-dach-gf", teamASlug: "sk-gaming", teamBSlug: "natus-vincere", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-challengers-dach", stage: "Grand Final", date: "2026-05-30T17:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },

  // ── Pre-Season Invitational 2026 ──
  { id: "psi26-emea-gf", teamASlug: "sk-gaming", teamBSlug: "hmble", scoreA: 3, scoreB: 2, tournamentSlug: "bsc-2026-psi-emea", stage: "Grand Final", date: "2026-01-24T15:00:00Z", status: "finished", region: "EMEA", format: "Bo5" },
  { id: "psi26-ea-gf", teamASlug: "crazy-raccoon", teamBSlug: "zeta-division", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-psi-ea", stage: "Grand Final", date: "2026-01-24T15:00:00Z", status: "finished", region: "EA", format: "Bo5" },
  { id: "psi26-na-gf", teamASlug: "tribe-gaming", teamBSlug: "stmn-esports", scoreA: 3, scoreB: 1, tournamentSlug: "bsc-2026-psi-na", stage: "Grand Final", date: "2026-01-25T15:00:00Z", status: "finished", region: "NA", format: "Bo5" },
  { id: "psi26-sa-gf", teamASlug: "loud", teamBSlug: "eternal-esports", scoreA: 3, scoreB: 0, tournamentSlug: "bsc-2026-psi-sa", stage: "Grand Final", date: "2026-01-25T15:00:00Z", status: "finished", region: "SA", format: "Bo5" },
];
