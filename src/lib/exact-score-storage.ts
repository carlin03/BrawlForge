const KEY = "bf_exact_scores";

export function readExactScores(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function writeExactScore(matchId: string, score: string | null): void {
  if (typeof window === "undefined") return;
  const all = readExactScores();
  if (!score) delete all[matchId];
  else all[matchId] = score;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getExactScore(matchId: string): string | null {
  return readExactScores()[matchId] ?? null;
}
