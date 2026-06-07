import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Extrae BSC_UPCOMING_PREDICTION_MATCHES del .ts → objetos JS */
export function loadBscUpcomingCalendar() {
  const raw = readFileSync(resolve(root, "src/lib/data/bsc-upcoming-predictions.ts"), "utf8");
  const start = raw.indexOf("export const BSC_UPCOMING_PREDICTION_MATCHES");
  const eq = raw.indexOf("=", start);
  const arrStart = raw.indexOf("[", eq);
  let depth = 0;
  let arrEnd = -1;
  for (let i = arrStart; i < raw.length; i++) {
    if (raw[i] === "[") depth++;
    if (raw[i] === "]") {
      depth--;
      if (depth === 0) {
        arrEnd = i + 1;
        break;
      }
    }
  }
  const arrLiteral = raw
    .slice(arrStart, arrEnd)
    .replace(/\/\/[^\n]*/g, "")
    .replace(/,(\s*[}\]])/g, "$1");
  // Literal TS compatible con JS (ids, strings, números)
  return new Function(`return ${arrLiteral}`)();
}
