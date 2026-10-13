export type WorldsQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explain?: string;
};

/** Trivia esports BSC / Worlds — sin spoilers de resultados vivos. */
export const WORLDS_QUIZ_BANK: WorldsQuizQuestion[] = [
  {
    id: "q1",
    prompt: "¿Qué significa BSC en el circuito oficial?",
    options: ["Brawl Stars Cup", "Brawl Stars Championship", "Brawler Season Circuit", "Blast Stars Contest"],
    correctIndex: 1,
    explain: "Brawl Stars Championship es el circuito anual de Supercell.",
  },
  {
    id: "q2",
    prompt: "¿Cuántas regiones principales tiene el circuito BSC global?",
    options: ["2", "3", "4", "6"],
    correctIndex: 2,
    explain: "EMEA, East Asia, North America y South America.",
  },
  {
    id: "q3",
    prompt: "¿Cómo se llama el evento cumbre de fin de año?",
    options: ["Brawl Cup", "Monthly Finals", "World Finals", "Challengers Cup"],
    correctIndex: 2,
    explain: "World Finals reúne a los mejores del circuito.",
  },
  {
    id: "q4",
    prompt: "¿Qué formato es típico en una Final de Monthly Finals?",
    options: ["Bo1", "Bo2", "Bo3", "Bo5"],
    correctIndex: 3,
    explain: "Las finales clave suelen jugarse a Bo5.",
  },
  {
    id: "q5",
    prompt: "¿Qué evento de mayo 2026 reunió a élite global mid-season?",
    options: ["LCQ", "Brawl Cup", "Pre-Season Invitational", "Challengers Finals"],
    correctIndex: 1,
  },
  {
    id: "q6",
    prompt: "¿Para qué sirve el Last Chance Qualifier (LCQ)?",
    options: [
      "Repartir skins",
      "Última plaza hacia World Finals",
      "Sustituir Monthly Finals",
      "Clasificar solo a Challengers",
    ],
    correctIndex: 1,
  },
  {
    id: "q7",
    prompt: "¿Cuántos equipos suele reunir un Monthly Finals regional?",
    options: ["4", "8", "12", "16"],
    correctIndex: 1,
  },
  {
    id: "q8",
    prompt: "¿Qué región usa el código EA en BrawlForge?",
    options: ["Europa Atlántica", "East Asia", "East America", "Esports Alliance"],
    correctIndex: 1,
  },
  {
    id: "q9",
    prompt: "¿Qué es un pick'em / predicción en BrawlForge?",
    options: [
      "Elegir brawler en draft",
      "Votar quién gana un partido",
      "Crear un club",
      "Subir un logo",
    ],
    correctIndex: 1,
  },
  {
    id: "q10",
    prompt: "¿Qué modo de juego 3v3 define el competitivo actual de Brawl Stars?",
    options: ["Showdown", "Gem Grab / modos rotativos oficiales", "Solo Showdown", "Duels 1v1"],
    correctIndex: 1,
  },
  {
    id: "q11",
    prompt: "¿Quién organiza el circuito oficial BSC?",
    options: ["Riot Games", "Supercell (con partners)", "Valve", "Epic Games"],
    correctIndex: 1,
  },
  {
    id: "q12",
    prompt: "En un cuadro de 8 equipos (single-elim), ¿cuántos partidos hay hasta el campeón?",
    options: ["4", "7", "8", "15"],
    correctIndex: 1,
    explain: "4 cuartos + 2 semis + 1 final = 7.",
  },
];

export function pickWorldsQuizRound(count = 8): WorldsQuizQuestion[] {
  const pool = [...WORLDS_QUIZ_BANK];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
