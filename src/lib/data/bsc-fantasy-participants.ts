/**
 * Participantes BSC 2026 para fantasy — equipos por torneo (MF, PSI, Brawl Cup, WF).
 */
export const BSC_FANTASY_PARTICIPANTS: Record<string, string[]> = {
  "bsc-2026-brawl-cup": [
    "bounty-hunters-esports",
    "hmble",
    "ace-xero",
    "only-realm",
    "zeta-division",
    "bc-gaming-sa",
    "crazy-raccoon",
    "eternal-esports",
    "revenant-xspark",
    "fut-esports",
    "tribe-gaming",
    "toxic-lotus",
  ],
  "bsc-2026-psi-emea": ["sk-gaming", "team-heretics", "hmble", "fut-esports"],
  "bsc-2026-psi-ea": ["crazy-raccoon", "zeta-division", "stmn-esports", "toxic-lotus"],
  "bsc-2026-psi-na": ["tribe-gaming", "spacestation-gaming", "loud", "skcalalas"],
  "bsc-2026-psi-sa": ["loud", "skcalalas", "bc-gaming-sa", "bounty-hunters-esports"],
  "world-finals-2026": [
    "crazy-raccoon",
    "sk-gaming",
    "tribe-gaming",
    "loud",
    "zeta-division",
    "hmble",
    "fut-esports",
    "team-heretics",
    "spacestation-gaming",
    "natus-vincere",
    "revenant-xspark",
    "stmn-esports",
    "papara-supermassive",
    "toxic-lotus",
    "skcalalas",
    "bc-gaming-sa",
  ],
};

const MF_EMEA = [
  "fut-esports",
  "sk-gaming",
  "team-heretics",
  "hmble",
  "natus-vincere",
  "totem-esports",
  "oddyssey",
  "papara-supermassive",
  "revenant-xspark",
];

const MF_EA = [
  "crazy-raccoon",
  "zeta-division",
  "stmn-esports",
  "toxic-lotus",
  "ace-xero",
  "revenant-xspark",
  "reject",
  "nova-esports",
];

const MF_NA = [
  "tribe-gaming",
  "stmn-esports",
  "spacestation-gaming",
  "loud",
  "skcalalas",
  "vatic-esports",
  "only-realm",
  "only-realm-na",
  "team-elektros",
  "kds-esports",
  "enosis-esports",
  "zoos-esports",
  "bc-gaming-sa",
];

const MF_SA = [
  "loud",
  "skcalalas",
  "bc-gaming-sa",
  "bounty-hunters-esports",
  "eternal-esports",
  "hmble",
  "fut-esports",
  "tribe-gaming",
];

const MF_MONTHS = [
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
] as const;

for (const month of MF_MONTHS) {
  BSC_FANTASY_PARTICIPANTS[`bsc-2026-${month}-emea-mf`] = [...MF_EMEA];
  BSC_FANTASY_PARTICIPANTS[`bsc-2026-${month}-ea-mf`] = [...MF_EA];
  BSC_FANTASY_PARTICIPANTS[`bsc-2026-${month}-na-mf`] = [...MF_NA];
  BSC_FANTASY_PARTICIPANTS[`bsc-2026-${month}-sa-mf`] = [...MF_SA];
}

BSC_FANTASY_PARTICIPANTS["bsc-2026-s3-emea-mf"] = [...MF_EMEA];
BSC_FANTASY_PARTICIPANTS["bsc-2026-s3-ea-mf"] = [...MF_EA];
BSC_FANTASY_PARTICIPANTS["bsc-2026-s3-na-mf"] = [...MF_NA];

for (const month of ["february", "march", "april", "may"] as const) {
  BSC_FANTASY_PARTICIPANTS[`bsc-2026-cn-${month}-mf`] = [
    "crazy-raccoon",
    "zeta-division",
    "toxic-lotus",
    "ace-xero",
    "stmn-esports",
    "revenant-xspark",
    "reject",
    "nova-esports",
  ];
}
