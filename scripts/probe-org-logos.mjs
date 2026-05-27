import https from "node:https";
import http from "node:http";

const CANDIDATES = {
  "bounty-hunters-esports": [
    "https://dcdn-us.mitiendanube.com/stores/005/755/160/themes/common/logo-1895168094-1754889616-f340878967c6d193071f9fd53738e9821754889616.png",
  ],
  skcalalas: ["https://cdn.royaleapi.com/static/img/team/logo/skcalalas.png"],
  qlash: ["https://cdn.royaleapi.com/static/img/team/logo/qlash.png"],
  "papara-supermassive": [
    "https://supmass.gg/wp-content/uploads/2023/12/logo-sup.png",
    "https://supmass.gg/wp-content/themes/supmass/assets/img/logo.png",
    "https://supmass.gg/assets/logo.png",
    "https://cdn.royaleapi.com/static/img/team/logo/supermassive.png",
  ],
  "only-realm": [
    "https://unavatar.io/twitter/OnlyRealmgg",
    "https://unavatar.io/x/OnlyRealmgg",
    "https://pbs.twimg.com/profile_images/onlyrealm",
  ],
  "eternal-esports": [
    "https://unavatar.io/twitter/EternalEsportsGG",
    "https://eternal.gg/logo.png",
    "https://www.eternal.gg/assets/logo.png",
  ],
  "toxic-lotus": [
    "https://unavatar.io/twitter/ToxicLotusBS",
    "https://unavatar.io/twitter/ToxicLotusCN",
  ],
  "ace-xero": [
    "https://unavatar.io/twitter/AceXeroBS",
    "https://unavatar.io/twitter/AceXeroGG",
  ],
  "bc-gaming-sa": [
    "https://unavatar.io/twitter/BCGamingSA",
    "https://unavatar.io/twitter/BCGaming_BS",
  ],
};

function fetch(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge/1.0" } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          return fetch(res.headers.location).then(resolve);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve({
            url,
            status: res.statusCode,
            len: buf.length,
            ct: res.headers["content-type"],
            isPng: buf[0] === 0x89 && buf[1] === 0x50,
          });
        });
      })
      .on("error", (e) => resolve({ url, err: e.message }));
  });
}

for (const [slug, urls] of Object.entries(CANDIDATES)) {
  console.log(`\n=== ${slug} ===`);
  for (const url of urls) {
    const r = await fetch(url);
    console.log(r);
    await new Promise((x) => setTimeout(x, 300));
  }
}

async function scrapeLogoFromSite(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let html = "";
        res.on("data", (c) => (html += c));
        res.on("end", () => {
          const og = html.match(/property="og:image" content="([^"]+)"/)?.[1];
          const schema = html.match(/"logo"\s*:\s*"([^"]+)"/)?.[1];
          const link = html.match(/rel="icon"[^>]+href="([^"]+)"/)?.[1];
          resolve({ url, og, schema, link });
        });
      })
      .on("error", (e) => resolve({ url, err: e.message }));
  });
}

console.log("\n=== HTML scrape ===");
for (const site of [
  "https://supmass.gg",
  "https://qlash.gg",
  "https://bhbountyhunters.com",
]) {
  console.log(await scrapeLogoFromSite(site));
}
