/*
 * Henter boliger, meglere og innstillinger fra serveren (administrasjonspanelet).
 * Hvis serveren ikke finnes (f.eks. GitHub Pages), brukes dataene i config.js og listings.js.
 */
window.DATA_SOURCE = "static";
window.DATA_READY = (function () {
  if (location.protocol === "file:" || !window.fetch) return Promise.resolve();
  var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);
  return fetch("api/public/data", { cache: "no-store", headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined })
    .then(function (r) {
      var type = r.headers.get("content-type") || "";
      if (!r.ok || type.indexOf("application/json") === -1) throw new Error("no api");
      return r.json();
    })
    .then(function (d) {
      window.SITE_CONFIG = Object.assign({}, window.SITE_CONFIG, d.settings || {});
      window.LISTINGS = d.listings || [];
      window.AGENTS = d.agents || [];
      window.DATA_SOURCE = "server";
    })
    .catch(function () { /* بيانات ثابتة */ })
    .then(function () { clearTimeout(timer); });
})();
