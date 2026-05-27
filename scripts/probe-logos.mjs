import https from "node:https";
import { LIQUIPEDIA_TEAM_LOGOS, liquipediaCommonsUrl } from "./liquipedia-commons.mjs";
import { TAIYORO_LOGOS } from "./team-logo-urls.mjs";

function head(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if ([301, 302].includes(res.statusCode) && res.headers.location) {
          res.resume();
          return head(res.headers.location).then(resolve);
        }
        let len = 0;
        res.on("data", (c) => (len += c.length));
        res.on("end", () => resolve({ url, status: res.statusCode, len, ct: res.headers["content-type"] }));
      })
      .on("error", (e) => resolve({ url, err: e.message }));
  });
}

console.log("TAIYORO:");
for (const [slug, url] of Object.entries(TAIYORO_LOGOS)) {
  console.log(slug, await head(url));
}

console.log("\nLiquipedia commons:");
for (const [slug, file] of Object.entries(LIQUIPEDIA_TEAM_LOGOS)) {
  const url = liquipediaCommonsUrl(file);
  console.log(slug, await head(url));
}
