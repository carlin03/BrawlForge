/**
 * Participantes BSC 2026 para fantasy — equipos por torneo (MF, PSI, Brawl Cup).
 */
export const BSC_FANTASY_PARTICIPANTS: Record<string, string[]> = {
  "bsc-2026-brawl-cup": [
    "hmble",
    "fut-esports",
    "tribe-gaming",
    "zeta-division",
    "crazy-raccoon",
    "only-realm",
    "bounty-hunters-esports",
    "bc-gaming-sa",
    "eternal-esports",
    "revenant-xspark",
    "ace-xero",
    "toxic-lotus",
  ],
  "bsc-2026-psi-emea": ["sk-gaming", "team-heretics", "hmble", "fut-esports"],
  "bsc-2026-psi-ea": ["crazy-raccoon", "zeta-division", "reject", "skcalalas-ea"],
  "bsc-2026-psi-na": ["tribe-gaming", "kds-esports", "loud", "skcalalas"],
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
    "natus-vincere",
    "reject",
    "kds-esports",
    "skcalalas",
  ],
};

const MF_EMEA = [
  "fut-esports",
  "sk-gaming",
  "team-heretics",
  "hmble",
  "natus-vincere",
  "totem-esports",
  "big",
  "novo-esports",
  "kebap",
  "metizport",
];

const MF_EA = [
  "crazy-raccoon",
  "zeta-division",
  "reject",
  "skcalalas-ea",
  "rival-esports",
  "effort-result",
  "abc-ea-team",
  "wwl-esports",
];

const MF_NA = [
  "tribe-gaming",
  "kds-esports",
  "stmn-esports",
  "team-elektros",
  "vatic-esports",
  "only-realm",
  "elevate",
  "zoos-esports",
];

const MF_SA = [
  "loud",
  "skcalalas",
  "new-heights-gaming",
  "kaioperro",
  "eternal-esports",
  "alguem-segura",
  "olimpo-squad",
  "bounty-hunters-esports",
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
    "ace-xero",
    "toxic-lotus",
    "crazy-raccoon",
    "zeta-division",
    "reject",
    "skcalalas-ea",
  ];
}
