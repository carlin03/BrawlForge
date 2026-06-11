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

/** Borra jugadores cuyo slug NO está en keepSlugs. */
export async function deletePlayersNotIn(keepSlugs) {
  const keep = new Set(keepSlugs);
  const { url, headers } = getSupabaseRest();
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/players_catalog?select=slug&order=slug&limit=1000&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list players: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  const toDelete = rows.map((r) => r.slug).filter((slug) => !keep.has(slug));
  if (!toDelete.length) return 0;

  let n = 0;
  for (let i = 0; i < toDelete.length; i += 40) {
    const batch = toDelete.slice(i, i + 40);
    const inList = batch.map((s) => encodeURIComponent(s)).join(",");
    const del = await fetch(`${url}/rest/v1/players_catalog?slug=in.(${inList})`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok) throw new Error(`delete players: ${del.status} ${await del.text()}`);
    n += batch.length;
  }
  return n;
}

/** Borra jugadores con team_slug que no existe en teams_catalog. */
export async function deletePlayersWithOrphanTeam() {
  const { url, headers } = getSupabaseRest();
  const teamSlugs = new Set();
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/teams_catalog?select=slug&order=slug&limit=1000&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list teams: ${res.status}`);
    const batch = await res.json();
    for (const t of batch) teamSlugs.add(t.slug);
    if (batch.length < 1000) break;
    offset += 1000;
  }

  const players = [];
  offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/players_catalog?select=slug,team_slug&order=slug&limit=1000&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list players: ${res.status}`);
    const batch = await res.json();
    players.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }

  const toDelete = players
    .filter((p) => p.team_slug?.trim() && !teamSlugs.has(p.team_slug.trim().toLowerCase()))
    .map((p) => p.slug);
  if (!toDelete.length) return 0;

  let n = 0;
  for (let i = 0; i < toDelete.length; i += 40) {
    const batch = toDelete.slice(i, i + 40);
    const inList = batch.map((s) => encodeURIComponent(s)).join(",");
    const del = await fetch(`${url}/rest/v1/players_catalog?slug=in.(${inList})`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok) throw new Error(`delete orphan players: ${del.status} ${await del.text()}`);
    n += batch.length;
  }
  return n;
}

/** Borra torneos cuyo slug NO está en keepSlugs. */
export async function deleteTournamentsNotIn(keepSlugs) {
  const keep = new Set(keepSlugs);
  const { url, headers } = getSupabaseRest();
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/tournaments_catalog?select=slug&order=slug&limit=1000&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list tournaments: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  const toDelete = rows.map((r) => r.slug).filter((slug) => !keep.has(slug));
  if (!toDelete.length) return 0;
  let n = 0;
  for (let i = 0; i < toDelete.length; i += 40) {
    const batch = toDelete.slice(i, i + 40);
    const inList = batch.map((s) => encodeURIComponent(s)).join(",");
    const del = await fetch(`${url}/rest/v1/tournaments_catalog?slug=in.(${inList})`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok) throw new Error(`delete tournaments: ${del.status} ${await del.text()}`);
    n += batch.length;
  }
  return n;
}
