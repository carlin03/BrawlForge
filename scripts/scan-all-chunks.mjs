import https from "node:https";

const chunks = [
  "/brawlstars/_nuxt/BCxRaQh7.js","/brawlstars/_nuxt/CK7ydWTw.js","/brawlstars/_nuxt/DirpWYrC.js",
  "/brawlstars/_nuxt/DP97pnfI.js","/brawlstars/_nuxt/DXZEHr36.js","/brawlstars/_nuxt/Cw1eJQ0q.js",
  "/brawlstars/_nuxt/Ctqt7bgf.js","/brawlstars/_nuxt/C6zi4igK.js","/brawlstars/_nuxt/BPzsEEzu.js",
  "/brawlstars/_nuxt/IRFp7HW7.js","/brawlstars/_nuxt/D7PaVUtg.js","/brawlstars/_nuxt/Br1dU6tu.js",
  "/brawlstars/_nuxt/DFZtVocJ.js","/brawlstars/_nuxt/QktAPW3O.js","/brawlstars/_nuxt/Dazepje1.js",
  "/brawlstars/_nuxt/DCVJisDu.js","/brawlstars/_nuxt/DcFNr3K0.js","/brawlstars/_nuxt/CHJAS5Yy.js",
  "/brawlstars/_nuxt/B6ZqWzKp.js","/brawlstars/_nuxt/BvbFK6Np.js","/brawlstars/_nuxt/C0j4Lxx7.js",
  "/brawlstars/_nuxt/-OTjEcIY.js","/brawlstars/_nuxt/DxvBcEZR.js","/brawlstars/_nuxt/BkSbvBdX.js",
  "/brawlstars/_nuxt/BJCyc6d1.js","/brawlstars/_nuxt/2S0BUUWF.js","/brawlstars/_nuxt/B2AUbQdn.js",
  "/brawlstars/_nuxt/CGZM5UHS.js","/brawlstars/_nuxt/vOu7X_4h.js","/brawlstars/_nuxt/A-wlT24d.js",
  "/brawlstars/_nuxt/CHh5LY3Y.js","/brawlstars/_nuxt/CdJ42Xts.js","/brawlstars/_nuxt/Bn02vfik.js",
  "/brawlstars/_nuxt/DAWJLTY3.js",
];

function get(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://event.supercell.com${path}`, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

const allApis = new Set();
const allImgs = new Set();
const allStrings = new Set();

for (const c of chunks) {
  const js = await get(c);
  for (const m of js.matchAll(/\/brawlstars\/v1\/[a-zA-Z0-9/_-]+/g)) allApis.add(m[0]);
  for (const m of js.matchAll(/\/(?:brawlstars|streamers)\/[a-zA-Z0-9/_-]+(?:\.png|\.webp|\.jpg)?/g)) allImgs.add(m[0]);
  for (const m of js.matchAll(/"(\/[a-zA-Z0-9/_-]{5,80})"/g)) {
    const s = m[1];
    if (/logo|contest|team|photo|image|leaderboard|partner|club/i.test(s)) allStrings.add(s);
  }
}

console.log("APIs:", [...allApis].sort());
console.log("\nImage paths:", [...allImgs].sort());
console.log("\nRelevant strings:", [...allStrings].sort().slice(0, 50));
