(function () {
  var urls = [
    "/api/home/matches",
    "/api/catalog",
    "/api/cms/runtime",
    "/api/news",
    "/api/logos/config",
    "/api/predictions/aggregates",
  ];
  var data = (window.__bfPrefetchData = window.__bfPrefetchData || {});
  var inflight = (window.__bfPrefetchInflight = window.__bfPrefetchInflight || {});

  function prefetch(url) {
    if (data[url] !== undefined || inflight[url]) return;
    inflight[url] = fetch(url, { cache: "no-store", credentials: "same-origin" })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (json) {
        if (json != null) data[url] = json;
        return json;
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        delete inflight[url];
      });
  }

  for (var i = 0; i < urls.length; i++) prefetch(urls[i]);
})();
