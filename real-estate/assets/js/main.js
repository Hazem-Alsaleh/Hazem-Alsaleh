/*
 * الأجزاء المشتركة بين كل الصفحات: الترويسة، التذييل، بطاقات العقارات، المفضلة، النماذج.
 */
(function () {
  "use strict";

  var C = window.SITE_CONFIG;
  var GOVS = window.GOVERNORATES;
  var TYPES = window.PROPERTY_TYPES;
  var readyQueue = [];
  var isReady = false;
  window.onSiteReady = function (fn) { if (isReady) fn(); else readyQueue.push(fn); };

  document.documentElement.lang = "ar";
  document.documentElement.dir = "rtl";

  /* ---------- أيقونات ---------- */
  var ICONS = {
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    bed: '<path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 14h18M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>',
    bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 3.5-1.3M7 19l-1 2M17 19l1 2"/>',
    area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    chat: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrow: '<path d="M15 6l-6 6 6 6"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    home: '<path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
  }

  /* ---------- أدوات عامة ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtNum(n) { return Number(n).toLocaleString("en-US"); }
  function govById(id) { for (var i = 0; i < GOVS.length; i++) if (GOVS[i].id === id) return GOVS[i]; return null; }
  function govName(id) { var g = govById(id); return g ? g.name : ""; }
  function placeShort(p) { return (window.PLACE_ALIASES && window.PLACE_ALIASES[p]) || p; }

  function locationLabel(l) {
    var gName = govName(l.gov);
    var p = placeShort(l.place);
    if (l.district) return l.district + "، " + p;
    if (p === gName) return "مدينة " + gName;
    return p + "، " + gName;
  }
  /* ---------- العملات: الدولار والليرة السورية ----------
   * كل عقار له سعر بعملته الأصلية. إذا ضُبط سعر الصرف (usdRate) يستطيع الزائر
   * عرض كل الأسعار بالدولار أو بالليرة، والمبالغ المحوّلة تظهر مع علامة ≈.
   */
  var CUR_KEY = "aqar-currency";
  var curOverride = null;
  function usdRate() { var r = Number(C.usdRate); return r > 0 ? r : 0; }
  function curOf(l) { return l.currency === "SYP" ? "SYP" : "USD"; }
  function displayCurrency() {
    if (!usdRate()) return null;
    var saved = curOverride;
    if (!saved) { try { saved = localStorage.getItem(CUR_KEY); } catch (e) { saved = null; } }
    if (saved === "USD" || saved === "SYP") return saved;
    return C.displayCurrency === "SYP" ? "SYP" : "USD";
  }
  function convert(amount, from, to) {
    if (from === to) return amount;
    var r = usdRate();
    if (!r) return null;
    return from === "USD" ? amount * r : amount / r;
  }
  function niceRound(n) {
    if (n >= 100000) return Math.round(n / 1000) * 1000;
    if (n >= 1000) return Math.round(n / 10) * 10;
    return Math.round(n);
  }
  function fmtMoney(n, cur) { return cur === "SYP" ? fmtNum(n) + " ل.س" : "$" + fmtNum(n); }
  function curLabel(cur) { return cur === "SYP" ? "ل.س" : "$"; }
  /* السعر بالعملة المطلوبة (أو بعملة العرض الحالية): { amount, cur, approx } */
  function priceIn(l, cur) {
    var from = curOf(l);
    var target = cur || displayCurrency() || from;
    var v = convert(l.price, from, target);
    if (v == null) return { amount: l.price, cur: from, approx: false };
    return { amount: target === from ? v : niceRound(v), cur: target, approx: target !== from };
  }
  function perLabel(l) {
    return l.deal === "rent" ? '<span class="per">/ ' + (l.rentPeriod === "year" ? "سنوياً" : "شهرياً") + "</span>" : "";
  }
  function priceHTML(l) {
    var p = priceIn(l);
    return '<bdi class="amount">' + (p.approx ? "≈ " : "") + fmtMoney(p.amount, p.cur) + "</bdi>" + perLabel(l);
  }
  /* سطر ثانٍ في صفحة العقار: السعر المعلن أو ما يعادله بالعملة الأخرى */
  function priceAltHTML(l) {
    if (!usdRate()) return "";
    var shown = priceIn(l);
    if (shown.approx) return "السعر المعلن: <bdi>" + fmtMoney(l.price, curOf(l)) + "</bdi>";
    var other = priceIn(l, curOf(l) === "USD" ? "SYP" : "USD");
    return "يعادل تقريباً <bdi>" + fmtMoney(other.amount, other.cur) + "</bdi>" + (other.cur === "SYP" ? " (ليرة سورية)" : "");
  }
  function rateNote() {
    if (!usdRate()) return "";
    var d = C.rateUpdatedAt ? String(C.rateUpdatedAt).slice(0, 10).split("-") : null;
    var MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
    return "حسب سعر الصرف المعتمد: <bdi>$1 = " + fmtNum(usdRate()) + " ل.س</bdi>" +
      (d && d.length === 3 ? " (" + Number(d[2]) + " " + MONTHS[Number(d[1]) - 1] + " " + d[0] + ")" : "");
  }
  function refreshPrices() {
    document.querySelectorAll("[data-price-of]").forEach(function (el) {
      var l = findListing(el.getAttribute("data-price-of"));
      if (l) el.innerHTML = priceHTML(l);
    });
    document.querySelectorAll("[data-price-alt-of]").forEach(function (el) {
      var l = findListing(el.getAttribute("data-price-alt-of"));
      if (l) el.innerHTML = priceAltHTML(l);
    });
  }
  function syncCurrencySwitch() {
    var cur = displayCurrency();
    document.querySelectorAll("[data-cur]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-cur") === cur ? "true" : "false");
    });
  }
  function setDisplayCurrency(cur) {
    var from = displayCurrency();
    if (cur === from) return;
    curOverride = cur;
    try { localStorage.setItem(CUR_KEY, cur); } catch (e) { /* التخزين غير متاح */ }
    syncCurrencySwitch();
    refreshPrices();
    document.dispatchEvent(new CustomEvent("currency-changed", { detail: { from: from, to: cur } }));
    toast(cur === "SYP" ? "تُعرض الأسعار الآن بالليرة السورية" : "تُعرض الأسعار الآن بالدولار");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cur]");
    if (b) setDisplayCurrency(b.getAttribute("data-cur"));
  });
  function priceText(l) {
    var amount = l.currency === "SYP" ? fmtNum(l.price) + " ل.س" : "$" + fmtNum(l.price);
    if (l.deal === "rent") amount += " " + (l.rentPeriod === "year" ? "سنوياً" : "شهرياً");
    return amount;
  }
  function dealLabel(d) { return d === "rent" ? "للإيجار" : "للبيع"; }
  function roomsLabel(n) {
    if (n === 1) return "غرفة";
    if (n === 2) return "غرفتان";
    if (n >= 3 && n <= 10) return n + " غرف";
    return n + " غرفة";
  }
  function img(name) {
    if (!name) return "";
    return name.indexOf("/") !== -1 ? name : "assets/img/" + name + ".jpg";
  }
  function findListing(id) {
    id = Number(id);
    for (var i = 0; i < window.LISTINGS.length; i++) if (window.LISTINGS[i].id === id) return window.LISTINGS[i];
    return null;
  }
  function agentById(id) {
    for (var i = 0; i < window.AGENTS.length; i++) if (String(window.AGENTS[i].id) === String(id)) return window.AGENTS[i];
    return null;
  }
  function initials(name) {
    var parts = name.trim().split(/\s+/);
    var last = parts.length > 1 ? parts[parts.length - 1].replace(/^ال/, "") : "";
    return parts[0].charAt(0) + (last ? " " + last.charAt(0) : "");
  }
  function waLink(text, number) {
    return "https://wa.me/" + (number || C.whatsapp) + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function telLink(phone) { return "tel:" + String(phone || C.phone).replace(/\s+/g, ""); }

  /* ---------- المفضلة (تُحفظ في متصفح الزائر فقط) ---------- */
  var FAV_KEY = "aqar-favorites";
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return memFavs; }
  }
  var memFavs = [];
  function setFavs(list) {
    memFavs = list;
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) { /* التخزين غير متاح */ }
  }
  function isFav(id) { return getFavs().indexOf(Number(id)) !== -1; }
  function toggleFav(id) {
    id = Number(id);
    var f = getFavs(), i = f.indexOf(id);
    if (i === -1) f.push(id); else f.splice(i, 1);
    setFavs(f);
    syncFavUI();
    toast(i === -1 ? "أُضيف العقار إلى المفضلة" : "أُزيل العقار من المفضلة");
    document.dispatchEvent(new CustomEvent("favs-changed"));
    return i === -1;
  }
  function syncFavUI() {
    var f = getFavs();
    document.querySelectorAll("[data-fav]").forEach(function (b) {
      var on = f.indexOf(Number(b.getAttribute("data-fav"))) !== -1;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.querySelectorAll(".fav-count").forEach(function (el) {
      el.textContent = f.length ? String(f.length) : "";
      el.hidden = !f.length;
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fav]");
    if (b) { e.preventDefault(); toggleFav(b.getAttribute("data-fav")); }
  });

  /* ---------- إشعار صغير ---------- */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* ---------- بطاقة عقار ---------- */
  function cardHTML(l) {
    var facts = [];
    if (l.rooms) facts.push("<li>" + icon("bed") + roomsLabel(l.rooms) + "</li>");
    if (l.baths) facts.push("<li>" + icon("bath") + l.baths + " حمام</li>");
    facts.push("<li>" + icon("area") + '<bdi>' + fmtNum(l.size) + "</bdi> م²</li>");
    var href = "property.html?id=" + l.id;
    return (
      '<article class="card">' +
        '<a class="card-media" href="' + href + '" tabindex="-1" aria-hidden="true">' +
          '<img loading="lazy" src="' + img(l.images[0]) + '" alt="" width="600" height="400">' +
          '<span class="badge ' + (l.deal === "rent" ? "badge-rent" : "badge-sale") + '">' + dealLabel(l.deal) + "</span>" +
          (l.images.length > 1 ? '<span class="photo-count">' + icon("camera") + l.images.length + "</span>" : "") +
        "</a>" +
        '<button type="button" class="fav-btn" data-fav="' + l.id + '" aria-pressed="false" aria-label="حفظ في المفضلة">' + icon("heart") + "</button>" +
        '<div class="card-body">' +
          '<p class="card-loc">' + icon("pin") + esc(locationLabel(l)) + "</p>" +
          '<h3 class="card-title"><a href="' + href + '">' + esc(l.title) + "</a></h3>" +
          '<p class="card-price" data-price-of="' + l.id + '">' + priceHTML(l) + "</p>" +
          '<ul class="card-facts">' + facts.join("") + "</ul>" +
          '<p class="card-type">' + esc(TYPES[l.type]) + (l.ownership ? " · " + esc(l.ownership) : "") + (l.furnished ? " · مفروش" : "") + "</p>" +
        "</div>" +
      "</article>"
    );
  }
  function renderCards(container, list) {
    container.innerHTML = list.map(cardHTML).join("");
    syncFavUI();
  }

  /* ---------- قوائم المحافظات والمدن ---------- */
  function fillGovSelect(sel, allLabel) {
    sel.innerHTML = '<option value="">' + (allLabel || "كل المحافظات") + "</option>" +
      GOVS.map(function (g) { return '<option value="' + g.id + '">' + g.name + "</option>"; }).join("");
  }
  function fillPlaceSelect(sel, govId, labelEl, allLabel) {
    var g = govById(govId);
    if (labelEl) labelEl.textContent = g ? g.placeLabel : "المدينة / الحي";
    if (!g) {
      sel.innerHTML = '<option value="">اختر المحافظة أولاً</option>';
      sel.disabled = true;
      return;
    }
    sel.disabled = false;
    sel.innerHTML = '<option value="">' + (allLabel || (g.id === "damascus" ? "كل أحياء دمشق" : "كل مدن " + g.name)) + "</option>" +
      g.places.map(function (p) { return '<option value="' + esc(p) + '">' + esc(p) + "</option>"; }).join("");
  }
  function fillTypeSelect(sel, allLabel) {
    sel.innerHTML = '<option value="">' + (allLabel || "كل الأنواع") + "</option>" +
      Object.keys(TYPES).map(function (k) { return '<option value="' + k + '">' + TYPES[k] + "</option>"; }).join("");
  }

  /* ---------- النماذج ----------
   * مع الخادم: يُحفظ الطلب ويظهر في لوحة التحكم.
   * بدون خادم (استضافة ثابتة): يُرسل الطلب عبر واتساب برسالة جاهزة.
   */
  function wireForm(form, opts) {
    var hp = document.createElement("input");
    hp.type = "text"; hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off";
    hp.className = "hp"; hp.setAttribute("aria-hidden", "true");
    form.appendChild(hp);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      var pairs = [];
      (opts.fields || []).forEach(function (f) {
        var el = form.elements[f[0]];
        var v = data[f[0]];
        if (el && el.tagName === "SELECT" && el.selectedIndex > -1 && v) v = el.options[el.selectedIndex].text;
        if (v) pairs.push([f[1], v]);
      });
      var title = typeof opts.title === "function" ? opts.title() : opts.title;
      var msg = [title].concat(pairs.map(function (p) { return p[0] + ": " + p[1]; })).join("\n");
      var extra = pairs.filter(function (p) { return p[0] !== "الاسم" && p[0] !== "الهاتف"; });

      if (window.DATA_SOURCE !== "server") { done(false); return; }
      var btn = form.querySelector('[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "جارٍ الإرسال…"; }
      fetch("api/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: opts.kind || "contact", listingId: opts.listingId || null, name: data.name, phone: data.phone, fields: extra, website: data.website })
      }).then(function (r) { return r.ok ? done(true) : done(false); }, function () { done(false); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });

      function done(saved) {
        var box = document.createElement("div");
        box.className = "form-success";
        box.setAttribute("role", "status");
        box.innerHTML = saved
          ? '<div class="form-success-icon">' + icon("check") + "</div>" +
            "<h3>" + esc(opts.successTitle || "شكراً لك، وصلنا طلبك") + "</h3>" +
            "<p>" + esc(opts.successText || "سيتواصل معك أحد وسطائنا خلال يوم عمل واحد.") + "</p>" +
            '<a class="btn btn-ghost" href="' + waLink(msg, opts.whatsapp) + '" target="_blank" rel="noopener">' + icon("chat") + "للرد الأسرع: راسلنا على واتساب</a>" +
            '<button type="button" class="btn btn-ghost form-reset">إرسال طلب آخر</button>'
          : '<div class="form-success-icon">' + icon("chat") + "</div>" +
            "<h3>خطوة أخيرة: أرسل طلبك عبر واتساب</h3>" +
            "<p>اضغط الزر لفتح واتساب برسالة جاهزة فيها تفاصيل طلبك، ثم اضغط إرسال.</p>" +
            '<a class="btn btn-whatsapp" href="' + waLink(msg, opts.whatsapp) + '" target="_blank" rel="noopener">' + icon("chat") + "إرسال الطلب عبر واتساب</a>" +
            '<button type="button" class="btn btn-ghost form-reset">تعديل الطلب</button>';
        form.hidden = true;
        form.parentNode.insertBefore(box, form.nextSibling);
        box.querySelector(".form-reset").addEventListener("click", function () {
          if (saved) { form.reset(); if (opts.onReset) opts.onReset(); }
          box.remove(); form.hidden = false;
        });
      }
    });
  }

  /* ---------- الترويسة والتذييل ---------- */
  var BRAND_MARK =
    '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true">' +
      '<rect width="40" height="40" rx="9" fill="var(--brand)"/>' +
      '<path d="M12 31V19.5C12 13.5 16 10 20 7.5c4 2.5 8 6 8 12V31z" fill="none" stroke="var(--on-brand)" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M17 31v-7a3 3 0 0 1 6 0v7" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/>' +
    "</svg>";

  var NAV = [
    { href: "properties.html?deal=sale", label: "شراء", key: "sale" },
    { href: "properties.html?deal=rent", label: "استئجار", key: "rent" },
    { href: "sell.html", label: "بيع أو تأجير عقارك", key: "sell" },
    { href: "agents.html", label: "الوسطاء", key: "agents" },
    { href: "contact.html", label: "اتصل بنا", key: "contact" }
  ];

  function currentNavKey() {
    var page = document.body.getAttribute("data-page");
    if (page === "properties") {
      var d = new URLSearchParams(location.search).get("deal");
      return d === "rent" ? "rent" : d === "sale" ? "sale" : "";
    }
    return page;
  }

  function renderHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    var active = currentNavKey();
    host.innerHTML =
      '<div class="topbar"><div class="container topbar-inner">' +
        '<p class="topbar-note">' + esc(C.slogan) + "</p>" +
        '<div class="topbar-links">' +
          '<a href="' + telLink() + '">' + icon("phone") + '<bdi dir="ltr">' + esc(C.phone) + "</bdi></a>" +
          '<a href="' + waLink() + '" target="_blank" rel="noopener">' + icon("chat") + "واتساب</a>" +
          '<span class="topbar-hours">' + icon("clock") + esc(C.workingHours) + "</span>" +
        "</div>" +
      "</div></div>" +
      '<header class="site-header"><div class="container header-inner">' +
        '<a class="brand" href="index.html" aria-label="' + esc(C.companyName) + ' — الصفحة الرئيسية">' + BRAND_MARK +
          '<span class="brand-text"><span class="brand-name">' + esc(C.companyName) + '</span><span class="brand-tag">' + esc(C.tagline) + "</span></span>" +
        "</a>" +
        '<nav class="main-nav" id="main-nav" aria-label="القائمة الرئيسية"><ul>' +
          NAV.map(function (n) {
            return '<li><a href="' + n.href + '"' + (n.key === active ? ' aria-current="page"' : "") + ">" + n.label + "</a></li>";
          }).join("") +
          '<li class="nav-cta-mobile"><a class="btn btn-accent" href="sell.html#valuation">تقييم مجاني لعقارك</a></li>' +
        "</ul></nav>" +
        '<div class="header-actions">' +
          (usdRate() ? '<div class="cur-switch" role="group" aria-label="عملة عرض الأسعار" title="سعر الصرف: $1 = ' + fmtNum(usdRate()) + ' ل.س">' +
            '<button type="button" data-cur="USD" aria-pressed="false">$</button><button type="button" data-cur="SYP" aria-pressed="false">ل.س</button></div>' : "") +
          '<a class="icon-btn" href="properties.html?fav=1" aria-label="العقارات المحفوظة">' + icon("heart") + '<span class="fav-count" hidden></span></a>' +
          '<a class="btn btn-accent header-cta" href="sell.html#valuation">تقييم مجاني</a>' +
          '<button type="button" class="icon-btn menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="فتح القائمة">' + icon("menu") + "</button>" +
        "</div>" +
      "</div></header>";

    var toggle = host.querySelector(".menu-toggle");
    var nav = host.querySelector("#main-nav");
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.innerHTML = icon(open ? "close" : "menu");
      document.body.classList.toggle("nav-open", open);
    });
  }

  function renderFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    var year = new Date().getFullYear();
    var govLinks = GOVS.slice(0, 7).map(function (g) {
      return '<li><a href="properties.html?gov=' + g.id + '">عقارات في ' + g.name + "</a></li>";
    }).join("");
    var govLinks2 = GOVS.slice(7).map(function (g) {
      return '<li><a href="properties.html?gov=' + g.id + '">عقارات في ' + g.name + "</a></li>";
    }).join("");
    var social = [];
    if (C.social.facebook) social.push('<a href="' + esc(C.social.facebook) + '" target="_blank" rel="noopener">فيسبوك</a>');
    if (C.social.instagram) social.push('<a href="' + esc(C.social.instagram) + '" target="_blank" rel="noopener">إنستغرام</a>');
    if (C.social.telegram) social.push('<a href="' + esc(C.social.telegram) + '" target="_blank" rel="noopener">تلغرام</a>');

    host.innerHTML =
      '<footer class="site-footer">' +
        '<div class="footer-pattern" aria-hidden="true"></div>' +
        '<div class="container footer-grid">' +
          '<div class="footer-about">' +
            '<a class="brand brand-light" href="index.html">' + BRAND_MARK +
              '<span class="brand-text"><span class="brand-name">' + esc(C.companyName) + '</span><span class="brand-tag">' + esc(C.tagline) + "</span></span></a>" +
            "<p>نساعدك على بيع عقارك أو شرائه أو استئجاره في كل المحافظات السورية، مع وسطاء محليين يعرفون الأحياء والأسعار وإجراءات نقل الملكية.</p>" +
            (social.length ? '<p class="footer-social">' + social.join(" · ") + "</p>" : "") +
          "</div>" +
          '<div><h3>العقارات</h3><ul>' +
            '<li><a href="properties.html?deal=sale">عقارات للبيع</a></li>' +
            '<li><a href="properties.html?deal=rent">عقارات للإيجار</a></li>' +
            '<li><a href="properties.html?type=villa">فيلات</a></li>' +
            '<li><a href="properties.html?type=land">أراضٍ ومزارع</a></li>' +
            '<li><a href="properties.html?type=shop">محلات ومكاتب</a></li>' +
          "</ul></div>" +
          '<div><h3>المحافظات</h3><ul class="footer-govs">' + govLinks + govLinks2 + "</ul></div>" +
          '<div><h3>تواصل معنا</h3><ul class="footer-contact">' +
            '<li>' + icon("phone") + '<a href="' + telLink() + '"><bdi dir="ltr">' + esc(C.phone) + "</bdi></a></li>" +
            '<li>' + icon("chat") + '<a href="' + waLink() + '" target="_blank" rel="noopener">واتساب</a></li>' +
            '<li>' + icon("mail") + '<a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a></li>" +
            '<li>' + icon("pin") + "<span>" + esc(C.address) + "</span></li>" +
            '<li>' + icon("clock") + "<span>" + esc(C.workingHours) + "</span></li>" +
          "</ul>" +
          '<a class="btn btn-accent" href="sell.html#valuation">اطلب تقييماً مجانياً</a>' +
          "</div>" +
        "</div>" +
        '<div class="container footer-bottom">' +
          "<p>© " + year + " " + esc(C.companyName) + ". جميع الحقوق محفوظة.</p>" +
          (C.showSampleNotice !== false ? '<p class="footer-note">العقارات والأسماء المعروضة حالياً أمثلة توضيحية.</p>' : "") +
        "</div>" +
      "</footer>";
  }

  function applyCompanyName() {
    document.title = document.title.replace(/اسم الشركة/g, C.companyName);
    document.querySelectorAll("[data-company]").forEach(function (el) { el.textContent = C.companyName; });
    document.querySelectorAll("[data-phone]").forEach(function (el) { el.textContent = C.phone; });
    document.querySelectorAll("[data-tel]").forEach(function (el) { el.setAttribute("href", telLink()); });
    document.querySelectorAll("[data-whatsapp]").forEach(function (el) { el.setAttribute("href", waLink(el.getAttribute("data-whatsapp") || "")); });
  }

  function init() {
    C = window.SITE_CONFIG;
    C.social = C.social || {};
    renderHeader();
    renderFooter();
    applyCompanyName();
    syncFavUI();
    syncCurrencySwitch();
    isReady = true;
    readyQueue.forEach(function (fn) { fn(); });
    readyQueue = [];
  }
  (window.DATA_READY || Promise.resolve()).then(init, init);

  window.SITE = {
    icon: icon, esc: esc, fmtNum: fmtNum, govById: govById, govName: govName, placeShort: placeShort,
    locationLabel: locationLabel, priceHTML: priceHTML, priceText: priceText, dealLabel: dealLabel,
    priceAltHTML: priceAltHTML, rateNote: rateNote, usdRate: usdRate, displayCurrency: displayCurrency,
    convert: convert, niceRound: niceRound, fmtMoney: fmtMoney, curLabel: curLabel, curOf: curOf,
    roomsLabel: roomsLabel, img: img, findListing: findListing, agentById: agentById, initials: initials,
    waLink: waLink, telLink: telLink, getFavs: getFavs, isFav: isFav, toggleFav: toggleFav, syncFavUI: syncFavUI,
    toast: toast, cardHTML: cardHTML, renderCards: renderCards, fillGovSelect: fillGovSelect,
    fillPlaceSelect: fillPlaceSelect, fillTypeSelect: fillTypeSelect, wireForm: wireForm
  };
})();
