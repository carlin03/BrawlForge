import https from "node:https";

const teams = [
  "skcalalas",
  "bounty-hunters",
  "bounty-hunters-esports",
  "only-realm",
  "onlyrealm",
  "eternal-esports",
  "eternal",
  "toxic-lotus",
  "ace-xero",
  "papara-supermassive",
  "supermassive",
  "qlash",
  "bc-gaming",
  "bc-gaming-sa",
  "hmble",
  "zeta-division",
  "natus-vincere",
  "team-heretics",
  "fut-esports",
  "loud",
  "tribe-gaming",
  "sk-gaming",
  "crazy-raccoon",
  "reject",
  "spacestation-gaming",
  "novo-esports",
  "totem-esports",
  "revenant-xspark",
  "stmn-esports",
];

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
        res.on("end", () =>
          resolve({ status: res.statusCode, len, ct: res.headers["content-type"] }),
        );
      })
      .on("error", (e) => resolve({ err: e.message }));
  });
}

for (const slug of teams) {
  const url = `https://cdn.royaleapi.com/static/img/team/logo/${slug}.png`;
  const r = await head(url);
  if (r.status === 200 && r.len > 1000) console.log("OK", slug, r.len, "bytes");
  else console.log("NO", slug, r);
}
