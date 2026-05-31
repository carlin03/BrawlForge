/** Filas 3+2 o 2+2+2 para chips de brawlers en análisis de mapa */
export function chunkBrawlerDisplay<T>(items: T[]): T[][] {
  if (!items.length) return [];
  const pattern = items.length <= 5 ? [3, 2] : [2, 2, 2];
  const rows: T[][] = [];
  let i = 0;
  let p = 0;
  while (i < items.length) {
    const take = pattern[p % pattern.length];
    rows.push(items.slice(i, i + take));
    i += take;
    p += 1;
  }
  return rows;
}
