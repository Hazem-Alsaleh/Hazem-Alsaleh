/*
 * خريطة سوريا التفاعلية: المحافظات ← النواحي ← المدن والقرى، مع العقارات المعروضة.
 * Kartet bruker Leaflet og dataene i assets/map/ (se tools/build-map-data.js).
 */
window.onSiteReady(function () {
  "use strict";
  if (document.body.getAttribute("data-page") !== "map" || !window.L) return;

  var S = window.SITE;
  var GOVS = window.GOVERNORATES;
  var $ = function (id) { return document.getElementById(id); };
  var esc = S.esc;
  var mapEl = $("atlas-map"), body = $("atlas-body"), crumbs = $("atlas-crumbs"), status = $("atlas-status");
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var dark = root.getAttribute("data-theme") === "dark" ||
    (root.getAttribute("data-theme") !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);

  var COL = dark ? {
    land: "#1b2a2c", landLine: "#2d3e41", border: "#0f1a1c", outline: "#a6dccb",
    scale: ["#1f3436", "#24504f", "#2e6b66", "#3f8c82", "#5fb3a3"], sub: "#a6dccb", place: "#d6efe7", placeSoft: "#8fb5ae",
    muted: "#172426", selFill: "#1d3133",
    select: "#ef8468"
  } : {
    land: "#eef1f1", landLine: "#d3dcdd", border: "#ffffff", outline: "#133a40",
    scale: ["#eef4f2", "#cfe9e0", "#a6dccb", "#6fae9f", "#2f7a73"], sub: "#1e5b61", place: "#133a40", placeSoft: "#5f8f8a",
    muted: "#e8eded", selFill: "#f7fbfa",
    select: "#e76f51"
  };
  var SAT_BOUNDS = [[29.535229562948455, 30.9375], [40.97989806962013, 46.40625]];
  var KIND = ["مدينة", "بلدة", "قرية", "حي"];

  var state = { deal: "all", layer: "map", gov: null, sub: null, place: null };
  var DATA = null, GOVDATA = {}, PLACES = null, placesLoading = null;
  var govLayers = {}, govLabels = {}, contextLayer = null, outlineLayer = null;
  var detail = L.layerGroup(), pins = L.layerGroup(), subLabels = L.layerGroup(), placeLabels = L.layerGroup();
  var satImage = null, satTiles = null;

  /* ---------- hjelpere ---------- */
  function norm(s) {
    return String(s || "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه")
      .replace(/ى/g, "ي").replace(/\s+/g, " ").trim();
  }
  function nListings(n) {
    if (n === 0) return "لا توجد عقارات";
    if (n === 1) return "عقار واحد";
    if (n === 2) return "عقاران";
    return n <= 10 ? n + " عقارات" : n + " عقاراً";
  }
  function nPlaces(n) { return n === 1 ? "تجمّع سكاني واحد" : n === 2 ? "تجمّعان سكانيان" : n <= 10 ? n + " تجمّعات سكانية" : S.fmtNum(n) + " تجمّعاً سكانياً"; }
  function nSubs(n) { return n === 1 ? "ناحية واحدة" : n === 2 ? "ناحيتان" : n <= 10 ? n + " نواحٍ" : n + " ناحية"; }
  function short(n) {
    if (n >= 1e9) return (Math.round(n / 1e8) / 10) + " مليار";
    if (n >= 1e6) return (Math.round(n / 1e5) / 10) + " مليون";
    if (n >= 1e4) return Math.round(n / 1e3) + " ألف";
    return S.fmtNum(n);
  }
  function pinPrice(l) { return short(l.price) + (l.currency === "SYP" ? " ل.س" : " $"); }
  function shapeSVG(d) { return '<svg class="atlas-shape" viewBox="0 0 48 48" aria-hidden="true"><path d="' + esc(d || "") + '"/></svg>'; }
  function announce(t) { if (status) status.textContent = t; }
  function govData(id) { for (var i = 0; i < DATA.govs.length; i++) if (DATA.govs[i].id === id) return DATA.govs[i]; return null; }
  function findSub(govId, subId) {
    var g = GOVDATA[govId]; if (!g) return null;
    for (var i = 0; i < g.subs.length; i++) if (g.subs[i].id === subId) return g.subs[i];
    return null;
  }
  function inRing(lat, lon, ring) {
    var c = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var a = ring[i], b = ring[j];
      if ((a[0] > lat) !== (b[0] > lat) && lon < (b[1] - a[1]) * (lat - a[0]) / (b[0] - a[0]) + a[1]) c = !c;
    }
    return c;
  }
  function inGeom(lat, lon, geom) {
    for (var p = 0; p < geom.length; p++) {
      if (!inRing(lat, lon, geom[p][0])) continue;
      var hole = false;
      for (var h = 1; h < geom[p].length; h++) if (inRing(lat, lon, geom[p][h])) hole = true;
      if (!hole) return true;
    }
    return false;
  }
  function km(a, b) {
    var dy = (a[0] - b[0]) * 111, dx = (a[1] - b[1]) * 111 * Math.cos(a[0] * Math.PI / 180);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ---------- boliger ---------- */
  function listingsAll() { return (window.LISTINGS || []).slice().sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); }); }
  function byDeal(list) { return state.deal === "all" ? list : list.filter(function (l) { return l.deal === state.deal; }); }
  function coordOf(l) {
    var sp = DATA.sitePlaces[l.gov] || {};
    if (sp[l.place]) return sp[l.place];
    var g = govData(l.gov);
    return g ? g.center : null;
  }
  function govCounts(id) {
    var sale = 0, rent = 0;
    (window.LISTINGS || []).forEach(function (l) { if (l.gov === id) { if (l.deal === "rent") rent++; else sale++; } });
    return { sale: sale, rent: rent, shown: state.deal === "sale" ? sale : state.deal === "rent" ? rent : sale + rent };
  }
  function countLine(c) {
    if (state.deal === "sale") return c.sale ? nListings(c.sale) + " للبيع" : "لا توجد عقارات للبيع بعد";
    if (state.deal === "rent") return c.rent ? nListings(c.rent) + " للإيجار" : "لا توجد عقارات للإيجار بعد";
    if (!c.sale && !c.rent) return "لا توجد عقارات معروضة بعد";
    return [c.sale ? c.sale + " للبيع" : "", c.rent ? c.rent + " للإيجار" : ""].filter(Boolean).join(" · ");
  }
  function itemHTML(l) {
    var href = "property.html?id=" + encodeURIComponent(l.id);
    return '<a class="atlas-item" href="' + href + '">' +
      '<img loading="lazy" src="' + esc(S.thumb(l.images[0])) + '" data-full="' + esc(S.img(l.images[0])) + '" alt="" width="96" height="72">' +
      '<span class="atlas-item-text"><span class="atlas-item-deal ' + (l.deal === "rent" ? "is-rent" : "is-sale") + '">' + S.dealLabel(l.deal) + "</span>" +
      "<strong>" + esc(l.title) + "</strong><small>" + esc(S.locationLabel(l)) + "</small>" +
      '<span class="atlas-item-price">' + S.priceHTML(l) + "</span></span></a>";
  }
  function listingsBlock(list, emptyText, moreHref) {
    if (!list.length) return '<p class="atlas-empty">' + emptyText + "</p>";
    var shown = list.slice(0, 6).map(itemHTML).join("");
    var more = list.length > 6 && moreHref ? '<a class="text-link atlas-more" href="' + moreHref + '">عرض ' + nListings(list.length) + "</a>" : "";
    return '<div class="atlas-items">' + shown + "</div>" + more;
  }

  /* ---------- kartet ---------- */
  var map = L.map(mapEl, {
    zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 90,
    minZoom: 5.5, maxZoom: 16, maxBounds: [[28.5, 29.5], [42.5, 48]], maxBoundsViscosity: 0.85,
    keyboard: true, tapTolerance: 18
  });
  map.attributionControl.setPrefix('<a href="#" data-atlas-sources>مصادر الخريطة</a>');
  map.attributionControl.addAttribution("OCHA · Natural Earth · Leaflet");
  mapEl.setAttribute("aria-label", "خريطة سوريا");
  mapEl.classList.toggle("is-dark", dark);
  [["context", 210], ["sat", 220], ["govs", 400], ["subs", 410], ["places", 420], ["labels", 450]].forEach(function (p) {
    var pane = map.createPane(p[0]);
    pane.style.zIndex = p[1];
    if (p[0] === "context" || p[0] === "sat" || p[0] === "labels") pane.style.pointerEvents = "none";
  });
  var placeRenderer = L.canvas({ pane: "places", padding: 0.3 });
  detail.addTo(map); pins.addTo(map); subLabels.addTo(map); placeLabels.addTo(map);

  function fit(bounds, maxZoom) {
    var wide = mapEl.clientWidth > 560;
    map.flyToBounds(bounds, { padding: wide ? [40, 40] : [18, 18], maxZoom: maxZoom || 11, animate: !reduceMotion, duration: 0.6 });
  }
  function zoomClass() {
    var z = map.getZoom();
    mapEl.classList.toggle("z-8", z >= 8);
    mapEl.classList.toggle("z-10", z >= 10);
    mapEl.classList.toggle("z-11", z >= 10.75);
    var showPins = z >= 8.25 || !!state.gov;
    if (showPins) { if (!map.hasLayer(pins)) pins.addTo(map); } else if (map.hasLayer(pins)) map.removeLayer(pins);
    mapEl.classList.toggle("has-pins", showPins);
  }
  map.on("zoomend", zoomClass);

  function govStyle(id) {
    var n = govCounts(id).shown;
    var bin = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
    var sat = state.layer === "sat";
    var selected = state.gov === id, other = state.gov && !selected;
    return {
      pane: "govs", color: selected ? COL.select : sat ? "rgba(255,255,255,.9)" : COL.border,
      weight: selected ? 3 : sat ? 1.4 : 1.6,
      fillColor: sat ? "#ffffff" : other ? COL.muted : selected ? COL.selFill : COL.scale[bin],
      fillOpacity: sat ? (selected ? 0 : other ? 0.18 : 0.04) : 1,
      opacity: 1
    };
  }
  function labelBin(id) { var n = govCounts(id).shown; return n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4; }

  function drawBase() {
    contextLayer = L.layerGroup(DATA.context.map(function (c) {
      return L.polygon(c.geom, { pane: "context", color: COL.landLine, weight: 1, fillColor: COL.land, fillOpacity: 1, interactive: false });
    })).addTo(map);
    DATA.context.forEach(function (c) {
      if (!c.name) return;
      var b = L.polygon(c.geom).getBounds();
      var at = { "تركيا": [37.55, 37.4], "العراق": [34.0, 41.9], "الأردن": [32.05, 37.6], "لبنان": [33.85, 35.75] }[c.name] || b.getCenter();
      L.marker(at, { pane: "labels", interactive: false, keyboard: false,
        icon: L.divIcon({ className: "atlas-country", html: "<span>" + esc(c.name) + "</span>", iconSize: [0, 0] }) }).addTo(map);
    });
    L.marker([34.75, 35.25], { pane: "labels", interactive: false, keyboard: false,
      icon: L.divIcon({ className: "atlas-country atlas-sea", html: "<span>البحر المتوسط</span>", iconSize: [0, 0] }) }).addTo(map);

    DATA.govs.forEach(function (g) {
      var layer = L.polygon(g.geom, govStyle(g.id));
      layer.on("click", function () { selectGov(g.id, true); });
      layer.on("mouseover", function () { if (state.gov !== g.id) layer.setStyle({ weight: 2.6, color: COL.outline }); });
      layer.on("mouseout", function () { layer.setStyle(govStyle(g.id)); });
      layer.addTo(map);
      govLayers[g.id] = layer;
      govLabels[g.id] = L.marker(g.center, { pane: "labels", interactive: false, keyboard: false, icon: govIcon(g) }).addTo(map);
    });
    outlineLayer = L.polygon(DATA.outline, { pane: "govs", color: COL.outline, weight: 2, fill: false, interactive: false }).addTo(map);
  }
  function govIcon(g) {
    var c = govCounts(g.id).shown;
    return L.divIcon({
      className: "atlas-gov-label bin-" + labelBin(g.id) + (state.gov === g.id ? " is-selected" : ""),
      html: "<span><b>" + esc(g.name) + "</b>" + (c ? "<i>" + c + "</i>" : "") + "</span>", iconSize: [0, 0]
    });
  }
  function restyleGovs() {
    DATA.govs.forEach(function (g) {
      govLayers[g.id].setStyle(govStyle(g.id));
      govLabels[g.id].setIcon(govIcon(g));
    });
    if (outlineLayer) outlineLayer.setStyle({ color: state.layer === "sat" ? "#ffffff" : COL.outline });
  }

  /* boliger som nåler */
  function drawPins() {
    pins.clearLayers();
    var groups = {};
    byDeal(listingsAll()).forEach(function (l) {
      var c = coordOf(l); if (!c) return;
      var k = c[0].toFixed(4) + "," + c[1].toFixed(4);
      (groups[k] = groups[k] || { at: c, list: [] }).list.push(l);
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], one = g.list.length === 1, l = g.list[0];
      var deals = g.list.reduce(function (s, x) { s[x.deal] = 1; return s; }, {});
      var kind = deals.sale && deals.rent ? "is-mixed" : deals.rent ? "is-rent" : "is-sale";
      var text = one ? pinPrice(l) : nListings(g.list.length);
      var m = L.marker(g.at, {
        riseOnHover: true, keyboard: true, title: one ? l.title : text + " في " + S.placeShort(l.place),
        icon: L.divIcon({ className: "atlas-pin " + kind, html: "<span>" + esc(text) + "</span>", iconSize: [0, 0] })
      });
      m.bindPopup(function () {
        return '<div class="atlas-pop">' + (one ? "" : "<p class=\"atlas-pop-title\">" + esc(S.placeShort(l.place)) + " · " + nListings(g.list.length) + "</p>") +
          g.list.map(itemHTML).join("") + "</div>";
      }, { className: "atlas-popup", maxWidth: 300, minWidth: 240, autoPanPadding: [24, 24] });
      pins.addLayer(m);
    });
  }

  /* ---------- detaljer for en provins ---------- */
  function loadGov(id) {
    if (GOVDATA[id]) return Promise.resolve(GOVDATA[id]);
    return fetch("assets/map/gov/" + id + ".json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { GOVDATA[id] = d; return d; });
  }
  function drawGovDetail(id) {
    detail.clearLayers(); subLabels.clearLayers(); placeLabels.clearLayers();
    var d = GOVDATA[id]; if (!d) return;
    var sat = state.layer === "sat";
    detail.addLayer(L.polygon(govData(id).geom, { pane: "places", color: COL.select, weight: 3, fill: false, interactive: false }));
    d.subs.forEach(function (s) {
      var sel = state.sub === s.id;
      var poly = L.polygon(s.geom, {
        pane: "subs", color: sel ? COL.select : sat ? "rgba(255,255,255,.85)" : COL.sub, weight: sel ? 2.6 : 1, opacity: sel ? 1 : 0.7,
        dashArray: sel ? null : "3 4", fillColor: COL.select, fillOpacity: sel ? 0.06 : 0
      });
      poly.on("click", function (e) { L.DomEvent.stopPropagation(e); selectSub(id, s.id, true); });
      poly.on("mouseover", function () { if (state.sub !== s.id) poly.setStyle({ fillOpacity: 0.08, fillColor: COL.sub }); });
      poly.on("mouseout", function () { if (state.sub !== s.id) poly.setStyle({ fillOpacity: 0 }); });
      detail.addLayer(poly);
      if (d.subs.length > 1) {
        subLabels.addLayer(L.marker(s.center, { pane: "labels", interactive: false, keyboard: false,
          icon: L.divIcon({ className: "atlas-sub-label" + (sel ? " is-selected" : ""), html: "<span>" + esc(s.name) + "</span>", iconSize: [0, 0] }) }));
      }
      s.places.forEach(function (p, i) {
        var k = p[3];
        var dot = L.circleMarker([p[1], p[2]], {
          renderer: placeRenderer, radius: k === 0 ? 5 : k === 1 ? 3.6 : k === 3 ? 3.4 : 2.4,
          color: sat ? "#ffffff" : COL.border, weight: k <= 1 ? 1.5 : 1, fillColor: k === 2 ? COL.placeSoft : COL.place, fillOpacity: 1
        });
        dot.bindTooltip(esc(p[0]), { direction: "top", offset: [0, -4], className: "atlas-tip" });
        dot.on("click", function (e) { L.DomEvent.stopPropagation(e); selectPlace(id, s.id, i, true); });
        detail.addLayer(dot);
        var show = k <= 1 || k === 3 || sel;
        if (show) {
          placeLabels.addLayer(L.marker([p[1], p[2]], { pane: "labels", interactive: false, keyboard: false,
            icon: L.divIcon({ className: "atlas-place-label k" + k + (sel && k === 2 ? " in-sub" : ""), html: "<span>" + esc(p[0]) + "</span>", iconSize: [0, 0] }) }));
        }
      });
    });
  }

  /* ---------- panelet ---------- */
  function crumbsHTML() {
    var parts = ['<button type="button" data-go="country">سوريا</button>'];
    if (state.gov) parts.push('<button type="button" data-go="gov">' + esc(govData(state.gov).name) + "</button>");
    var sub = state.sub && findSub(state.gov, state.sub);
    var single = state.gov && GOVDATA[state.gov] && GOVDATA[state.gov].subs.length === 1;
    if (sub && !single) parts.push('<button type="button" data-go="sub">ناحية ' + esc(sub.name) + "</button>");
    if (state.place != null && sub) parts.push("<span>" + esc(sub.places[state.place][0]) + "</span>");
    parts[parts.length - 1] = parts[parts.length - 1].replace("<button", '<button aria-current="location"');
    return parts.join('<span class="sep" aria-hidden="true">/</span>');
  }
  function dealLinks(govId, place, where) {
    var base = "properties.html?gov=" + encodeURIComponent(govId) + (place ? "&place=" + encodeURIComponent(place) : "");
    var c = govCounts(govId), counts = !place && !where;
    var tail = where ? " في " + esc(where) : "";
    var out = [];
    if (state.deal !== "rent") out.push('<a class="btn btn-primary" href="' + base + '&deal=sale">عقارات للبيع' + tail + (counts && c.sale ? " (" + c.sale + ")" : "") + "</a>");
    if (state.deal !== "sale") out.push('<a class="btn btn-ghost" href="' + base + '&deal=rent">عقارات للإيجار' + tail + (counts && c.rent ? " (" + c.rent + ")" : "") + "</a>");
    return '<div class="atlas-actions">' + out.join("") + "</div>";
  }
  function agentsHTML(govId) {
    var list = (window.AGENTS || []).filter(function (a) { return (a.govs || []).indexOf(govId) !== -1; });
    if (!list.length) return "";
    return '<h3 class="atlas-h3">الوسيط في ' + esc(govData(govId).name) + "</h3>" + list.slice(0, 2).map(function (a) {
      var msg = "مرحباً، أريد التواصل مع الوسيط " + a.name + " بخصوص عقار في " + govData(govId).name;
      return '<div class="atlas-agent"><span class="avatar" aria-hidden="true">' + esc(S.initials(a.name)) + "</span>" +
        "<span class=\"atlas-agent-text\"><strong>" + esc(a.name) + "</strong><small>" + esc(a.role || "") + "</small></span>" +
        '<a class="icon-btn" href="' + S.telLink(a.phone) + '" aria-label="اتصال بـ' + esc(a.name) + '">' + S.icon("phone") + "</a>" +
        '<a class="icon-btn atlas-wa" href="' + S.waLink(msg, a.whatsapp) + '" target="_blank" rel="noopener" aria-label="واتساب ' + esc(a.name) + '">' + S.icon("chat") + "</a></div>";
    }).join("");
  }
  function renderCountry() {
    var all = window.LISTINGS || [];
    var sale = all.filter(function (l) { return l.deal !== "rent"; }).length, rent = all.length - sale;
    var places = DATA.govs.reduce(function (n, g) { return n + g.places; }, 0), subs = DATA.govs.reduce(function (n, g) { return n + g.subs; }, 0);
    body.innerHTML =
      '<div class="atlas-head"><p class="atlas-kicker">الجمهورية العربية السورية</p><h2>سوريا</h2>' +
        '<p class="atlas-meta">14 محافظة · ' + nSubs(subs) + " · " + nPlaces(places) + "</p></div>" +
      '<div class="atlas-stats"><div><strong>' + sale + "</strong><span>للبيع</span></div><div><strong>" + rent + "</strong><span>للإيجار</span></div></div>" +
      '<p class="atlas-hint">اختر محافظة على الخريطة أو من القائمة لترى نواحيها ومدنها والعقارات المعروضة فيها.</p>' +
      '<h3 class="atlas-h3">المحافظات</h3><ul class="atlas-list">' +
      GOVS.map(function (gv) {
        var g = govData(gv.id); if (!g) return "";
        return '<li><button type="button" data-gov="' + g.id + '">' + shapeSVG(g.shape) +
          '<span class="atlas-list-text"><strong>' + esc(g.name) + "</strong><small>" + esc(countLine(govCounts(g.id))) + "</small></span>" +
          S.icon("arrow", "atlas-chev") + "</button></li>";
      }).join("") + "</ul>";
  }
  function renderGov() {
    var g = govData(state.gov), d = GOVDATA[state.gov];
    var list = byDeal(listingsAll()).filter(function (l) { return l.gov === g.id; });
    var dealWord = state.deal === "sale" ? " للبيع" : state.deal === "rent" ? " للإيجار" : "";
    body.innerHTML =
      '<div class="atlas-head atlas-head-shape">' + shapeSVG(g.shape) + '<div><p class="atlas-kicker">محافظة</p><h2>' + esc(g.name) + "</h2>" +
        '<p class="atlas-meta">' + nSubs(g.subs) + " · " + nPlaces(g.places) + "</p></div></div>" +
      dealLinks(g.id) +
      '<h3 class="atlas-h3">أحدث العقارات' + dealWord + " في " + esc(g.name) + "</h3>" +
      listingsBlock(list, "لا توجد عقارات" + dealWord + " معروضة في " + esc(g.name) + ' حالياً. <a href="contact.html">أخبرنا بما تبحث عنه</a> وسنتواصل معك عند توفّر عقار مناسب.',
        "properties.html?gov=" + g.id + "&deal=" + (state.deal === "rent" ? "rent" : "sale")) +
      agentsHTML(g.id) +
      (d && d.subs.length > 1 ? '<h3 class="atlas-h3">النواحي</h3><ul class="atlas-list atlas-list-compact">' + d.subs.map(function (s) {
        return '<li><button type="button" data-sub="' + s.id + '">' + shapeSVG(s.shape) + '<span class="atlas-list-text"><strong>' + esc(s.name) + "</strong><small>" +
          (s.district ? "منطقة " + esc(s.district) + " · " : "") + nPlaces(s.places.length) + "</small></span>" + S.icon("arrow", "atlas-chev") + "</button></li>";
      }).join("") + "</ul>" : "") +
      (d && d.subs.length === 1 ? placesListHTML(d.subs[0]) : "");
  }
  function placesListHTML(s) {
    var order = s.places.map(function (p, i) { return [p, i]; }).sort(function (a, b) { return a[0][3] - b[0][3] || a[0][0].localeCompare(b[0][0], "ar"); });
    var label = order.length && order[0][0][3] === 3 ? "الأحياء والمدن" : "المدن والبلدات والقرى";
    return '<h3 class="atlas-h3">' + label + '</h3><ul class="atlas-chips">' + order.map(function (x) {
      return '<li><button type="button" data-place="' + x[1] + '" class="k' + x[0][3] + '">' + esc(x[0][0]) + "</button></li>";
    }).join("") + "</ul>";
  }
  function renderSub() {
    var g = govData(state.gov), s = findSub(state.gov, state.sub);
    var list = byDeal(listingsAll()).filter(function (l) { var c = coordOf(l); return l.gov === g.id && c && inGeom(c[0], c[1], s.geom); });
    body.innerHTML =
      '<div class="atlas-head atlas-head-shape">' + shapeSVG(s.shape) + '<div><p class="atlas-kicker">ناحية' + (s.district ? " · منطقة " + esc(s.district) : "") + "</p><h2>" + esc(s.name) + "</h2>" +
        '<p class="atlas-meta">محافظة ' + esc(g.name) + " · " + nPlaces(s.places.length) + "</p></div></div>" +
      dealLinks(g.id, null, "محافظة " + g.name) +
      '<h3 class="atlas-h3">العقارات في هذه الناحية</h3>' +
      listingsBlock(list, "لا توجد عقارات معروضة في ناحية " + esc(s.name) + " حالياً.", null) +
      placesListHTML(s);
  }
  function renderPlace() {
    var g = govData(state.gov), s = findSub(state.gov, state.sub), p = s.places[state.place];
    var at = [p[1], p[2]];
    var siteNames = Object.keys(DATA.sitePlaces[g.id] || {});
    var siteName = null;
    siteNames.forEach(function (n) { var c = DATA.sitePlaces[g.id][n]; if (!siteName && c[0] === p[1] && c[1] === p[2]) siteName = n; });
    var list = byDeal(listingsAll()).filter(function (l) { var c = coordOf(l); return l.gov === g.id && c && km(c, at) < 2.5; });
    var msg = "مرحباً، أبحث عن عقار في " + p[0] + "، محافظة " + g.name;
    body.innerHTML =
      '<div class="atlas-head"><p class="atlas-kicker">' + KIND[p[3]] + "</p><h2>" + esc(p[0]) + "</h2>" +
        '<p class="atlas-meta">' + (s.name !== p[0] ? "ناحية " + esc(s.name) + " · " : "") + "محافظة " + esc(g.name) + "</p></div>" +
      (siteName ? dealLinks(g.id, siteName, p[0]) : dealLinks(g.id, null, "محافظة " + g.name)) +
      '<h3 class="atlas-h3">العقارات في ' + esc(p[0]) + " وحولها</h3>" +
      listingsBlock(list, "لا توجد عقارات معروضة هنا حالياً. أخبرنا بما تبحث عنه وسيبحث لك وسيط المنطقة.", null) +
      '<a class="btn btn-whatsapp atlas-wa-btn" href="' + S.waLink(msg) + '" target="_blank" rel="noopener">' + S.icon("chat") + "أبحث عن عقار في " + esc(p[0]) + "</a>";
  }
  function render() {
    crumbs.innerHTML = crumbsHTML();
    if (state.place != null && state.sub) renderPlace();
    else if (state.sub) renderSub();
    else if (state.gov) renderGov();
    else renderCountry();
    mapEl.classList.toggle("has-gov", !!state.gov);
    var peek = $("atlas-peek");
    if (state.gov) {
      var sel = state.place != null && state.sub ? findSub(state.gov, state.sub).places[state.place][0] : state.sub ? "ناحية " + findSub(state.gov, state.sub).name : govData(state.gov).name;
      peek.innerHTML = "<span>" + esc(sel) + "</span><b>التفاصيل ↓</b>";
      peek.hidden = false;
    } else peek.hidden = true;
    var h = state.gov ? "#" + [state.gov, state.sub, state.place].filter(function (x) { return x != null; }).join("/") : location.pathname + location.search;
    if (history.replaceState) history.replaceState(null, "", h);
  }
  function focusMapOnMobile() {
    if (window.innerWidth <= 900) {
      var top = mapEl.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.4) mapEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
  }

  /* ---------- valg ---------- */
  function selectCountry(move) {
    state.gov = null; state.sub = null; state.place = null; zoomClass(); focusRing(null);
    detail.clearLayers(); subLabels.clearLayers(); placeLabels.clearLayers();
    restyleGovs(); render();
    if (move) fit(outlineLayer.getBounds(), 7);
    announce("سوريا: كل المحافظات");
  }
  function selectGov(id, move) {
    state.gov = id; state.sub = null; state.place = null; zoomClass(); focusRing(null);
    restyleGovs(); render();
    if (move) { fit(govLayers[id].getBounds(), 12); focusMapOnMobile(); }
    announce("محافظة " + govData(id).name);
    return loadGov(id).then(function () {
      if (state.gov !== id) return;
      drawGovDetail(id); render();
    }).catch(function () { body.insertAdjacentHTML("beforeend", '<p class="atlas-empty">تعذّر تحميل تفاصيل المحافظة. حاول مجدداً لاحقاً.</p>'); });
  }
  function selectSub(govId, subId, move) {
    var go = function () {
      state.gov = govId; state.sub = subId; state.place = null; zoomClass(); focusRing(null);
      restyleGovs(); drawGovDetail(govId); render();
      var s = findSub(govId, subId);
      if (move && s) { fit(L.polygon(s.geom).getBounds(), 12); focusMapOnMobile(); }
      if (s) announce("ناحية " + s.name);
    };
    return GOVDATA[govId] ? Promise.resolve(go()) : loadGov(govId).then(go);
  }
  function selectPlace(govId, subId, idx, move) {
    var go = function () {
      var changedSub = state.sub !== subId || state.gov !== govId;
      state.gov = govId; state.sub = subId; state.place = idx;
      restyleGovs(); if (changedSub || !detail.getLayers().length) drawGovDetail(govId); render();
      var p = findSub(govId, subId).places[idx];
      focusRing([p[1], p[2]]);
      if (move) { map.flyTo([p[1], p[2]], Math.max(map.getZoom(), p[3] === 0 ? 12 : 13), { animate: !reduceMotion, duration: 0.6 }); focusMapOnMobile(); }
      announce(KIND[p[3]] + " " + p[0]);
    };
    return GOVDATA[govId] ? Promise.resolve(go()) : loadGov(govId).then(go);
  }

  var ring = null;
  function focusRing(at) {
    if (ring) { map.removeLayer(ring); ring = null; }
    if (at) ring = L.circleMarker(at, { pane: "labels", radius: 11, color: COL.select, weight: 3, fill: false, interactive: false }).addTo(map);
  }

  /* ---------- søk ---------- */
  var qEl = $("atlas-q"), resEl = $("atlas-results"), results = [], active = -1;
  function loadPlaces() {
    if (PLACES) return Promise.resolve(PLACES);
    if (!placesLoading) placesLoading = fetch("assets/map/places.json").then(function (r) { return r.json(); }).then(function (d) {
      PLACES = d.map(function (r) { return { name: r[0], n: norm(r[0]), gov: DATA.govs[r[1]].id, si: r[2], lat: r[3], lon: r[4], k: r[5] }; });
      return PLACES;
    });
    return placesLoading;
  }
  function search(q) {
    var n = norm(q); if (n.length < 2) return [];
    var starts = [], has = [];
    DATA.govs.forEach(function (g) { var gn = norm(g.name); if (gn.indexOf(n) === 0) starts.push({ type: "gov", g: g }); });
    (PLACES || []).forEach(function (p) {
      var i = p.n.indexOf(n); if (i === -1) return;
      var item = { type: "place", p: p };
      (i === 0 || p.n.indexOf(" " + n) !== -1 ? starts : has).push(item);
    });
    var rank = function (a, b) { return (a.type === "gov" ? -1 : a.p.k === 3 ? 0.5 : a.p.k) - (b.type === "gov" ? -1 : b.p.k === 3 ? 0.5 : b.p.k); };
    return starts.sort(rank).concat(has.sort(rank)).slice(0, 8);
  }
  function showResults() {
    active = -1;
    if (!results.length) {
      resEl.innerHTML = qEl.value.trim().length >= 2 ? '<li class="atlas-noresult">لا توجد نتائج</li>' : "";
      resEl.hidden = !resEl.innerHTML; qEl.setAttribute("aria-expanded", resEl.hidden ? "false" : "true");
      return;
    }
    resEl.innerHTML = results.map(function (r, i) {
      var name = r.type === "gov" ? r.g.name : r.p.name;
      var meta = r.type === "gov" ? "محافظة" : KIND[r.p.k] + " · " + govData(r.p.gov).name;
      return '<li role="option" id="atlas-r' + i + '" data-i="' + i + '"><strong>' + esc(name) + "</strong><small>" + esc(meta) + "</small></li>";
    }).join("");
    resEl.hidden = false; qEl.setAttribute("aria-expanded", "true");
  }
  function setActive(i) {
    var items = resEl.querySelectorAll("[role=option]");
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach(function (el, j) { el.setAttribute("aria-selected", j === active ? "true" : "false"); });
    qEl.setAttribute("aria-activedescendant", "atlas-r" + active);
    items[active].scrollIntoView({ block: "nearest" });
  }
  function choose(i) {
    var r = results[i]; if (!r) return;
    resEl.hidden = true; qEl.setAttribute("aria-expanded", "false"); qEl.removeAttribute("aria-activedescendant");
    qEl.value = r.type === "gov" ? r.g.name : r.p.name;
    if (r.type === "gov") { selectGov(r.g.id, true); return; }
    loadGov(r.p.gov).then(function (d) {
      var s = d.subs[r.p.si];
      var idx = -1;
      s.places.forEach(function (p, j) { if (idx === -1 && p[0] === r.p.name && p[1] === r.p.lat && p[2] === r.p.lon) idx = j; });
      if (idx === -1) selectSub(r.p.gov, s.id, true); else selectPlace(r.p.gov, s.id, idx, true);
    });
  }
  qEl.addEventListener("focus", loadPlaces);
  qEl.addEventListener("input", function () {
    loadPlaces().then(function () { results = search(qEl.value); showResults(); });
  });
  qEl.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active === -1 ? 0 : active); }
    else if (e.key === "Escape") { resEl.hidden = true; qEl.setAttribute("aria-expanded", "false"); }
  });
  resEl.addEventListener("mousedown", function (e) { var li = e.target.closest("[data-i]"); if (li) { e.preventDefault(); choose(+li.getAttribute("data-i")); } });
  document.addEventListener("click", function (e) { if (!e.target.closest(".atlas-search")) { resEl.hidden = true; qEl.setAttribute("aria-expanded", "false"); } });

  /* ---------- knapper og panel ---------- */
  document.querySelectorAll(".atlas-deal [data-deal]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.deal = b.getAttribute("data-deal");
      document.querySelectorAll(".atlas-deal [data-deal]").forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
      restyleGovs(); drawPins(); render(); legend();
    });
  });
  document.querySelectorAll(".atlas-layers [data-layer]").forEach(function (b) {
    b.addEventListener("click", function () { setLayer(b.getAttribute("data-layer")); });
  });
  $("atlas-in").addEventListener("click", function () { map.zoomIn(); });
  $("atlas-out").addEventListener("click", function () { map.zoomOut(); });
  $("atlas-fit").addEventListener("click", function () { selectCountry(true); });
  body.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-gov")) selectGov(b.getAttribute("data-gov"), true);
    else if (b.hasAttribute("data-sub")) selectSub(state.gov, b.getAttribute("data-sub"), true);
    else if (b.hasAttribute("data-place")) selectPlace(state.gov, state.sub || GOVDATA[state.gov].subs[0].id, +b.getAttribute("data-place"), true);
  });
  crumbs.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]"); if (!b) return;
    var go = b.getAttribute("data-go");
    if (go === "country") selectCountry(true);
    else if (go === "gov") selectGov(state.gov, true);
    else if (go === "sub") selectSub(state.gov, state.sub, true);
  });
  $("atlas-peek").addEventListener("click", function () {
    $("atlas-panel").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
  var dlg = $("atlas-sources");
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-atlas-sources]")) { e.preventDefault(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
  });
  $("atlas-sources-close").addEventListener("click", function () { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); });

  function legend() {
    var el = $("atlas-legend");
    var word = state.deal === "sale" ? "للبيع" : state.deal === "rent" ? "للإيجار" : "معروضة";
    el.innerHTML = state.layer === "sat" ? "" :
      '<span class="atlas-legend-scale"><span class="atlas-legend-title">عقارات ' + word + "</span>" +
      [["0", 0], ["1", 1], ["2–3", 2], ["4–6", 3], ["+7", 4]].map(function (x) {
        return '<span class="atlas-legend-step"><i style="background:' + COL.scale[x[1]] + '"></i>' + x[0] + "</span>";
      }).join("") + "</span>" +
      '<span class="atlas-legend-pins">' + (state.deal !== "rent" ? '<span class="atlas-legend-step"><i class="pin-sale"></i>للبيع</span>' : "") +
      (state.deal !== "sale" ? '<span class="atlas-legend-step"><i class="pin-rent"></i>للإيجار</span>' : "") + "</span>";
  }
  function setLayer(layer) {
    state.layer = layer;
    document.querySelectorAll(".atlas-layers [data-layer]").forEach(function (x) { x.setAttribute("aria-checked", x.getAttribute("data-layer") === layer ? "true" : "false"); });
    mapEl.classList.toggle("is-sat", layer === "sat");
    if (layer === "sat") {
      if (!satImage) {
        satImage = L.imageOverlay("assets/map/syria-satellite.webp", SAT_BOUNDS, { pane: "sat", interactive: false, attribution: "EOxCloudless 2016" });
        var ESA = "https://wmts.terrascope.be/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=esa-worldcover-s2rgbnir-10m-2021-v2_tcc&STYLE=default&TILEMATRIXSET=EPSG%3A3857&FORMAT=image%2Fpng&TIME=2021-01-01";
        var Photos = L.GridLayer.extend({
          createTile: function (c, done) {
            var img = document.createElement("img"), fallback = false;
            img.alt = ""; img.setAttribute("role", "presentation");
            img.onload = function () { done(null, img); };
            img.onerror = function () {
              if (!fallback) { fallback = true; img.src = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/" + c.z + "/" + c.y + "/" + c.x + ".jpg"; }
              else { img.onerror = null; img.src = L.Util.emptyImageUrl; done(null, img); }
            };
            img.src = ESA + "&TILEMATRIX=" + c.z + "&TILEROW=" + c.y + "&TILECOL=" + c.x;
            return img;
          }
        });
        satTiles = new Photos({ pane: "sat", tileSize: 256, noWrap: true, minZoom: 8, maxNativeZoom: 14, maxZoom: 16, keepBuffer: 1, updateWhenIdle: true,
          bounds: [[29.5, 30.9], [41, 46.4]], attribution: "ESA WorldCover 2021 · EOxCloudless" });
      }
      satImage.addTo(map); satTiles.addTo(map);
      if (contextLayer) map.removeLayer(contextLayer);
    } else {
      if (satImage) { map.removeLayer(satImage); map.removeLayer(satTiles); }
      if (contextLayer && !map.hasLayer(contextLayer)) contextLayer.addTo(map);
    }
    restyleGovs();
    if (state.gov && GOVDATA[state.gov]) drawGovDetail(state.gov);
    legend();
  }

  /* ---------- start ---------- */
  fetch("assets/map/syria.json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    DATA = d;
    drawBase();
    map.fitBounds(outlineLayer.getBounds(), { padding: [16, 16] });
    zoomClass();
    drawPins(); legend();
    var h = decodeURIComponent(location.hash.replace(/^#/, "")).split("/");
    if (h[0] && govData(h[0])) {
      if (h[2] != null && h[2] !== "") selectPlace(h[0], h[1], +h[2], true);
      else if (h[1]) selectSub(h[0], h[1], true);
      else selectGov(h[0], true);
    } else render();
  }).catch(function () {
    body.innerHTML = '<p class="atlas-empty">تعذّر تحميل الخريطة. تأكد من اتصالك بالإنترنت ثم أعد تحميل الصفحة.</p>';
  });
  window.addEventListener("resize", function () { map.invalidateSize(); });
});
