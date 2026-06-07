import { getSupabaseRest } from "./supabase-rest.mjs";

/** Borra filas cuyo id NO está en keepIds (por lotes). */
export async function deleteMatchesNotIn(keepIds) {
  const keep = new Set(keepIds);
  const { url, headers } = getSupabaseRest();
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/matches_catalog?select=id&order=id&limit=1000&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list matches: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  const toDelete = rows.map((r) => r.id).filter((id) => !keep.has(id));
  if (!toDelete.length) return 0;

  let n = 0;
  for (let i = 0; i < toDelete.length; i += 30) {
    const batch = toDelete.slice(i, i + 30);
    const inList = batch.map((id) => encodeURIComponent(id)).join(",");
    const del = await fetch(`${url}/rest/v1/matches_catalog?id=in.(${inList})`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok) throw new Error(`delete batch: ${del.status} ${await del.text()}`);
    n += batch.length;
  }
  return n;
}
