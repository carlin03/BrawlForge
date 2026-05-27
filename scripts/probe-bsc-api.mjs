import https from "node:https";

const endpoints = [
  "https://event.supercell.com/brawlstars/v1/event/w4Lu1Ua9yIKv2ZBABn6oP",
  "https://event.supercell.com/brawlstars/v1/teams/list",
  "https://event.supercell.com/brawlstars/v1/participants",
  "https://event.supercell.com/brawlstars/v1/cms/content",
  "https://event.supercell.com/brawlstars/v1/predictions/teams",
];

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ url, status: res.statusCode, body: d.slice(0, 500) }));
    }).on("error", (e) => resolve({ url, error: e.message }));
  });
}

for (const u of endpoints) {
  const r = await get(u);
  console.log("\n---", r.url, r.status || r.error);
  console.log(r.body || "");
}
