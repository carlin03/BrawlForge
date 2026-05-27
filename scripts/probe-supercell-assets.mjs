/**
 * Probe Supercell assets URL patterns for team/contestant logos.
 */
import https from "node:https";

const BASE = "https://event.supercell.com";

function head(url) {
  return new Promise((resolve) => {
    https
      .request(url, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        resolve({ url, status: res.statusCode, ct: res.headers["content-type"], len: res.headers["content-length"] });
      })
      .on("error", (e) => resolve({ url, error: e.message }))
      .end();
  });
}

const ids = [4, 6, 8, 20, 33, 47, 51, 52, 54];
const patterns = [];

for (const id of ids) {
  patterns.push(
    `/brawlstars/assets/contestants/${id}.png`,
    `/brawlstars/assets/contestants/${id}.webp`,
    `/brawlstars/assets/teams/${id}.png`,
    `/brawlstars/assets/images/contestants/${id}.png`,
    `/brawlstars/v1/contestant/${id}/logo`,
    `/brawlstars/v1/contestants/${id}/logo`,
  );
}

patterns.push(
  "/brawlstars/share-image.jpg",
  "/brawlstars/page-icon.ico",
  "/brawlstars/images/leaderboard/trophies/trophy-icon-gold.png",
);

for (const p of patterns) {
  const r = await head(BASE + p);
  if (r.status === 200) console.log("OK", p, r.ct, r.len);
  else if (r.status && r.status !== 404) console.log(r.status, p);
}
