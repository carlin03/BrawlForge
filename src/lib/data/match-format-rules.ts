export type SeriesRules = {
  winsNeeded: number;
  maxMapsLosers: number;
  maxScoreA: number;
  maxScoreB: number;
  label: string;
};

export function getSeriesRules(format: string): SeriesRules {
  const f = format.toLowerCase();
  if (f.includes("7")) {
    return { winsNeeded: 4, maxMapsLosers: 3, maxScoreA: 4, maxScoreB: 4, label: "BO7" };
  }
  if (f.includes("5")) {
    return { winsNeeded: 3, maxMapsLosers: 2, maxScoreA: 3, maxScoreB: 3, label: "BO5" };
  }
  if (f.includes("1")) {
    return { winsNeeded: 1, maxMapsLosers: 0, maxScoreA: 1, maxScoreB: 1, label: "BO1" };
  }
  return { winsNeeded: 2, maxMapsLosers: 1, maxScoreA: 2, maxScoreB: 2, label: "BO3" };
}

export function isValidSeriesScore(scoreA: number, scoreB: number, format: string): boolean {
  const { winsNeeded, maxMapsLosers } = getSeriesRules(format);
  if (scoreA < 0 || scoreB < 0) return false;
  if (scoreA > winsNeeded || scoreB > winsNeeded) return false;
  if (scoreA === winsNeeded && scoreB <= maxMapsLosers) return true;
  if (scoreB === winsNeeded && scoreA <= maxMapsLosers) return true;
  return false;
}

export function scoreToExactString(scoreA: number, scoreB: number): string {
  return `${scoreA}-${scoreB}`;
}

export function parseExactScore(raw: string | null | undefined): { a: number; b: number } | null {
  if (!raw) return null;
  const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  return { a: Number(m[1]), b: Number(m[2]) };
}
