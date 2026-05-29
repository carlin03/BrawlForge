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
  "bsc-2026-psi-emea": ["sk-gaming", "team-heretics", "hmble", "fut-esports", "madridmira"],
  "bsc-2026-psi-ea": ["crazy-raccoon", "zeta-division", "reject", "skcalalas-ea", "fennel", "insomnia"],
  "bsc-2026-psi-na": ["tribe-gaming", "only-realm", "f-a-homeless", "legacy-esports", "vic-day"],
  "bsc-2026-psi-sa": ["loud", "skcalalas", "bc-gaming-sa", "bounty-hunters-esports", "oddyssey", "acre-lovers"],
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
  "big-talents",
  "novo-esports",
  "kebap",
  "metizport",
  "madridmira",
  "cmm",
  "fut-esports-academy",
];

const MF_EA = [
  "crazy-raccoon",
  "zeta-division",
  "reject",
  "skcalalas-ea",
  "rival-esports",
  "wwl-esports",
  "feasible-gaming",
  "frenzy-esports",
  "fennel",
  "insomnia",
  "ace-xero",
  "toxic-lotus",
];

const MF_NA = [
  "tribe-gaming",
  "only-realm",
  "stmn-esports",
  "team-elektros",
  "vatic-esports",
  "elevate",
  "f-a-homeless",
  "vic-day",
  "legacy-esports",
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
  "oddyssey",
  "acre-lovers",
  "f-a-zurita-gaming",
  "level-esports",
  "enosis-esports",
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
BSC_FANTASY_PARTICIPANTS["bsc-2026-s3-sa-mf"] = [...MF_SA];

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
