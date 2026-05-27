import https from "node:https";

const urls = [
  "https://event.supercell.com/brawlstars/v1/event",
  "https://event.supercell.com/brawlstars/v1/predictions",
  "https://event.supercell.com/brawlstars/v1/teams",
  "https://event.supercell.com/brawlstars/v1/contestants",
  "https://event.supercell.com/brawlstars/v1/partners",
  "https://event.supercell.com/brawlstars/v1/clubs",
  "https://event.brawlstars.com/v1/event",
  "https://event.brawlstars.com/brawlstars/v1/event",
  "https://event.supercell.com/brawlstars/v1/leaderboard",
  "https://event.supercell.com/brawlstars/v1/bracket",
];

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 BrawlForge" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ url, status: res.statusCode, ct: res.headers["content-type"], body: data }));
      })
      .on("error", reject);
  });
}

for (const url of urls) {
  try {
    const r = await get(url);
    const hasLogo = /logo|icon|badge|avatar|image/i.test(r.body);
    console.log(`${r.status} ${url} (${r.body.length}b) logo-ish: ${hasLogo}`);
    if (r.status === 200 && hasLogo) {
      const matches = r.body.match(/"(?:logo|icon|image|badge|avatar)[^"]*"\s*:\s*"[^"]+"/gi);
      console.log("  samples:", matches?.slice(0, 8));
    }
  } catch (e) {
    console.log(`ERR ${url}: ${e.message}`);
  }
}
