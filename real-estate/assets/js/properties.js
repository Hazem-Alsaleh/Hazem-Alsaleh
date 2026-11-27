window.onSiteReady(function () {
  "use strict";
  var S = window.SITE;
  var L = window.LISTINGS;
  var TYPES = window.PROPERTY_TYPES;

  var form = document.getElementById("filter-form");
  var el = function (id) { return document.getElementById(id); };
  var gov = el("f-gov"), place = el("f-place"), placeLabel = el("f-place-label");
  var typesBox = el("f-types"), own = el("f-own"), finish = el("f-finish");
  var sort = el("sort"), results = el("results"), empty = el("empty"), count = el("results-count"), chips = el("chips");
  var filters = el("filters");

  /* تعبئة القوائم */
  S.fillGovSelect(gov);
  typesBox.innerHTML = Object.keys(TYPES).map(function (k) {
    return '<label><input type="checkbox" name="type" value="' + k + '"> ' + TYPES[k] + "</label>";
  }).join("");
  own.innerHTML = '<option value="">الكل</option>' + window.OWNERSHIP_TYPES.map(function (o) { return "<option>" + o + "</option>"; }).join("");
  finish.innerHTML = '<option value="">الكل</option>' + window.FINISH_LEVELS.map(function (o) { return "<option>" + o + "</option>"; }).join("");

  /* الحالة */
  var state = { deal: "" };

  function readURL() {
    var p = new URLSearchParams(location.search);
    state.deal = p.get("deal") === "sale" || p.get("deal") === "rent" ? p.get("deal") : "";
    gov.value = p.get("gov") || "";
    S.fillPlaceSelect(place, gov.value, placeLabel);
    place.value = p.get("place") || "";
    var types = (p.get("type") || "").split(",").filter(Boolean);
    form.querySelectorAll('input[name="type"]').forEach(function (c) { c.checked = types.indexOf(c.value) !== -1; });
    el("f-pmin").value = p.get("pmin") || "";
    el("f-pmax").value = p.get("pmax") || "";
    el("f-smin").value = p.get("smin") || "";
    el("f-smax").value = p.get("smax") || "";
    var rooms = p.get("rooms") || "";
    form.querySelectorAll('input[name="rooms"]').forEach(function (r) { r.checked = r.value === rooms; });
    own.value = p.get("own") || "";
    finish.value = p.get("finish") || "";
    el("f-furnished").checked = p.get("furnished") === "1";
    el("f-q").value = p.get("q") || "";
    sort.value = p.get("sort") || "new";
  }

  function collect() {
    var types = [];
    form.querySelectorAll('input[name="type"]:checked').forEach(function (c) { types.push(c.value); });
    var rooms = form.querySelector('input[name="rooms"]:checked');
    return {
      deal: state.deal,
      gov: gov.value,
      place: place.value,
      type: types,
      pmin: parseFloat(el("f-pmin").value) || 0,
      pmax: parseFloat(el("f-pmax").value) || 0,
      smin: parseFloat(el("f-smin").value) || 0,
      smax: parseFloat(el("f-smax").value) || 0,
      rooms: rooms ? Number(rooms.value) || 0 : 0,
      own: own.value,
      finish: finish.value,
      furnished: el("f-furnished").checked,
      q: el("f-q").value.trim(),
      sort: sort.value
    };
  }

  function writeURL(f) {
    var p = new URLSearchParams();
    if (f.deal) p.set("deal", f.deal);
    if (f.gov) p.set("gov", f.gov);
    if (f.place) p.set("place", f.place);
    if (f.type.length) p.set("type", f.type.join(","));
    if (f.pmin) p.set("pmin", f.pmin);
    if (f.pmax) p.set("pmax", f.pmax);
    if (f.smin) p.set("smin", f.smin);
    if (f.smax) p.set("smax", f.smax);
    if (f.rooms) p.set("rooms", f.rooms);
    if (f.own) p.set("own", f.own);
    if (f.finish) p.set("finish", f.finish);
    if (f.furnished) p.set("furnished", "1");
    if (f.q) p.set("q", f.q);
    if (f.sort && f.sort !== "new") p.set("sort", f.sort);
    var qs = p.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "")); } catch (e) { /* غير مدعوم */ }
  }

  /* السعر الشهري للمقارنة بين الإيجار الشهري والسنوي */
  function cmpPrice(l) { return l.deal === "rent" && l.rentPeriod === "year" ? l.price / 12 : l.price; }

  function matches(l, f) {
    if (f.deal && l.deal !== f.deal) return false;
    if (f.gov && l.gov !== f.gov) return false;
    if (f.place && l.place !== f.place) return false;
    if (f.type.length && f.type.indexOf(l.type) === -1) return false;
    if (f.pmin && cmpPrice(l) < f.pmin) return false;
    if (f.pmax && cmpPrice(l) > f.pmax) return false;
    if (f.smin && l.size < f.smin) return false;
    if (f.smax && l.size > f.smax) return false;
    if (f.rooms && (l.rooms || 0) < f.rooms) return false;
    if (f.own && l.ownership !== f.own) return false;
    if (f.finish && l.finish !== f.finish) return false;
    if (f.furnished && !l.furnished) return false;
    if (f.q) {
      var hay = [l.title, l.description, l.place, l.district, S.govName(l.gov), TYPES[l.type]].concat(l.features || []).join(" ");
      var words = f.q.split(/\s+/);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
    }
    return true;
  }

  var sorters = {
    "new": function (a, b) { return b.date.localeCompare(a.date); },
    "price-asc": function (a, b) { return cmpPrice(a) - cmpPrice(b); },
    "price-desc": function (a, b) { return cmpPrice(b) - cmpPrice(a); },
    "size-desc": function (a, b) { return b.size - a.size; }
  };

  function headings(f) {
    var what = f.type.length === 1 ? TYPES[f.type[0]] : "عقارات";
    var where = f.place ? " في " + S.placeShort(f.place) : f.gov ? " في " + S.govName(f.gov) : " في سوريا";
    var dealTxt = f.deal === "sale" ? " للبيع" : f.deal === "rent" ? " للإيجار" : " للبيع والإيجار";
    var title = (f.type.length === 1 ? (f.type[0] === "land" ? "أراضٍ" : what) : what) + dealTxt + where;
    el("ph-title").textContent = title;
    el("bc-current").textContent = f.deal === "sale" ? "للبيع" : f.deal === "rent" ? "للإيجار" : "العقارات";
    el("f-price-label").textContent = f.deal === "rent" ? "الإيجار الشهري ($)" : "السعر ($)";
    document.querySelectorAll(".page-head [data-deal]").forEach(function (t) {
      t.setAttribute("aria-selected", t.getAttribute("data-deal") === f.deal ? "true" : "false");
    });
    document.querySelectorAll('.main-nav a').forEach(function (a) {
      var h = a.getAttribute("href");
      var on = (f.deal === "sale" && h === "properties.html?deal=sale") || (f.deal === "rent" && h === "properties.html?deal=rent");
      if (on) a.setAttribute("aria-current", "page"); else if (h.indexOf("properties.html") === 0) a.removeAttribute("aria-current");
    });
  }

  function chip(label, clear) { return { label: label, clear: clear }; }
  function renderChips(f) {
    var list = [];
    if (f.gov) list.push(chip(S.govName(f.gov), function () { gov.value = ""; S.fillPlaceSelect(place, "", placeLabel); }));
    if (f.place) list.push(chip(S.placeShort(f.place), function () { place.value = ""; }));
    f.type.forEach(function (t) {
      list.push(chip(TYPES[t], function () { form.querySelector('input[name="type"][value="' + t + '"]').checked = false; }));
    });
    if (f.pmin || f.pmax) list.push(chip("السعر: " + (f.pmin ? "من $" + S.fmtNum(f.pmin) + " " : "") + (f.pmax ? "حتى $" + S.fmtNum(f.pmax) : ""), function () { el("f-pmin").value = ""; el("f-pmax").value = ""; }));
    if (f.smin || f.smax) list.push(chip("المساحة: " + (f.smin ? "من " + f.smin + " " : "") + (f.smax ? "حتى " + f.smax : "") + " م²", function () { el("f-smin").value = ""; el("f-smax").value = ""; }));
    if (f.rooms) list.push(chip(f.rooms + " غرف أو أكثر", function () { form.querySelector('input[name="rooms"][value=""]').checked = true; }));
    if (f.own) list.push(chip(f.own, function () { own.value = ""; }));
    if (f.finish) list.push(chip("إكساء " + f.finish, function () { finish.value = ""; }));
    if (f.furnished) list.push(chip("مفروش", function () { el("f-furnished").checked = false; }));
    if (f.q) list.push(chip("«" + f.q + "»", function () { el("f-q").value = ""; }));

    chips.innerHTML = list.map(function (c, i) {
      return '<button type="button" class="chip" data-i="' + i + '" aria-label="إزالة ' + S.esc(c.label) + '">' + S.esc(c.label) + S.icon("close") + "</button>";
    }).join("");
    chips.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () { list[Number(b.getAttribute("data-i"))].clear(); update(); });
    });
  }

  function update() {
    var f = collect();
    var out = L.filter(function (l) { return matches(l, f); }).sort(sorters[f.sort] || sorters["new"]);
    S.renderCards(results, out);
    empty.hidden = out.length > 0;
    results.hidden = out.length === 0;
    var n = out.length;
    var word = n === 1 ? "عقار واحد" : n === 2 ? "عقاران" : n >= 3 && n <= 10 ? n + " عقارات" : n + " عقاراً";
    count.innerHTML = (n === 0 ? "لا نتائج" : word) + " <span>من أصل " + L.length + "</span>";
    el("filter-apply").textContent = n ? "عرض " + word : "لا نتائج";
    headings(f);
    renderChips(f);
    writeURL(f);
  }

  /* الأحداث */
  gov.addEventListener("change", function () { S.fillPlaceSelect(place, gov.value, placeLabel); update(); });
  form.addEventListener("change", function (e) { if (e.target !== gov) update(); });
  var t;
  form.addEventListener("input", function (e) {
    if (e.target.type === "search" || e.target.type === "number") { clearTimeout(t); t = setTimeout(update, 250); }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); update(); });
  sort.addEventListener("change", update);
  document.querySelectorAll(".page-head [data-deal]").forEach(function (tab) {
    tab.addEventListener("click", function () { state.deal = tab.getAttribute("data-deal"); update(); });
  });

  function resetAll() {
    form.reset();
    S.fillPlaceSelect(place, "", placeLabel);
    update();
  }
  el("filter-reset").addEventListener("click", resetAll);
  el("empty-reset").addEventListener("click", resetAll);

  function openFilters(open) {
    filters.classList.toggle("open", open);
    document.body.classList.toggle("filters-open", open);
    el("filter-open").setAttribute("aria-expanded", open ? "true" : "false");
  }
  el("filter-open").addEventListener("click", function () { openFilters(true); });
  el("filter-close").addEventListener("click", function () { openFilters(false); });
  el("filter-apply").addEventListener("click", function () { update(); openFilters(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") openFilters(false); });

  readURL();
  update();
});
