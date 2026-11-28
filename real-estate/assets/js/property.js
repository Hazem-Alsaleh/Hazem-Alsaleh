window.onSiteReady(function () {
  "use strict";
  var S = window.SITE;
  var C = window.SITE_CONFIG;
  var TYPES = window.PROPERTY_TYPES;
  var root = document.getElementById("prop-root");

  var MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
  function fmtDate(iso) {
    var p = iso.split("-");
    return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1] + " " + p[0];
  }

  function getId() {
    var q = new URLSearchParams(location.search).get("id");
    if (q) return q;
    var m = location.hash.match(/(\d+)/);
    return m ? m[1] : null;
  }

  var l = S.findListing(getId());
  if (!l) {
    root.innerHTML =
      '<div class="container section"><div class="empty-state">' +
        "<h3>لم نجد هذا العقار</h3>" +
        "<p>ربما بِيع أو أُجِّر، أو أن الرابط غير صحيح.</p>" +
        '<a class="btn btn-primary" href="properties.html">تصفّح كل العقارات</a>' +
      "</div></div>";
    return;
  }

  document.title = l.title + " | " + C.companyName;
  var g = S.govById(l.gov);
  var agent = S.agentById(l.agent);
  var i = S.icon, e = S.esc;

  /* المعرض */
  var shown = l.images.slice(0, 5);
  var gallery = '<div class="gallery n' + Math.min(shown.length, 5) + '">' +
    shown.map(function (im, idx) {
      var src = idx ? S.thumb(im) : S.img(im);
      return '<button type="button" data-img="' + idx + '" aria-label="عرض الصورة ' + (idx + 1) + '"><img src="' + src + '" data-full="' + S.img(im) + '" alt="' + e(l.title) + " — صورة " + (idx + 1) + '"' + (idx ? ' loading="lazy"' : "") + "></button>";
    }).join("") +
    (l.images.length > 1 ? '<button type="button" class="gallery-all" data-img="0">' + i("camera") + "عرض كل الصور (" + l.images.length + ")</button>" : "") +
    "</div>";

  /* الأرقام الرئيسية في سطر واحد */
  var keys = [[l.deal === "rent" ? "الإيجار" : "السعر", S.priceHTML(l).replace(/<span class="per">[^<]*<\/span>/, "")]];
  keys.push(["المساحة", '<bdi>' + S.fmtNum(l.size) + "</bdi> م²"]);
  if (l.rooms) keys.push(["غرف النوم", l.rooms]);
  if (l.baths) keys.push(["الحمامات", l.baths]);
  if (l.land && l.land !== l.size) keys.push(["مساحة الأرض", '<bdi>' + S.fmtNum(l.land) + "</bdi> م²"]);
  else if (typeof l.floor === "number" && l.totalFloors) keys.push(["الطابق", l.floor === 0 ? "أرضي" : l.floor]);
  var keyStrip = '<dl class="facts-bar">' + keys.slice(0, 5).map(function (k) {
    return "<div><dt>" + k[0] + "</dt><dd>" + k[1] + "</dd></div>";
  }).join("") + "</dl>";

  /* جدول المعلومات */
  var facts = [
    ["رقم العقار", '<bdi class="num">#' + l.id + "</bdi>"],
    ["نوع العرض", S.dealLabel(l.deal)],
    ["نوع العقار", TYPES[l.type]],
    ["المحافظة", g ? g.name : ""],
    [g && g.id === "damascus" ? "الحي" : "المدينة / البلدة", e(S.placeShort(l.place))],
    l.district ? ["المنطقة", e(l.district)] : null,
    ["المساحة", '<bdi class="num">' + S.fmtNum(l.size) + "</bdi> م²"],
    l.land ? ["مساحة الأرض", '<bdi class="num">' + S.fmtNum(l.land) + "</bdi> م²"] : null,
    l.rooms ? ["غرف النوم", l.rooms] : null,
    l.baths ? ["الحمامات", l.baths] : null,
    typeof l.floor === "number" && l.totalFloors ? ["الطابق", (l.floor === 0 ? "أرضي" : l.floor) + " من " + l.totalFloors] : null,
    l.year ? ["سنة البناء", l.year] : null,
    l.finish ? ["الإكساء", e(l.finish)] : null,
    l.direction ? ["الاتجاه", e(l.direction)] : null,
    l.ownership ? ["نوع الملكية", e(l.ownership)] : null,
    l.deal === "rent" ? ["الإيجار", l.rentPeriod === "year" ? "سنوي" : "شهري"] : null,
    l.deal === "rent" || l.furnished ? ["مفروش", l.furnished ? "نعم" : "لا"] : null,
    ["تاريخ النشر", fmtDate(l.date)]
  ].filter(Boolean);
  var factsHTML = '<dl class="facts">' + facts.map(function (f) { return "<div><dt>" + f[0] + "</dt><dd>" + f[1] + "</dd></div>"; }).join("") + "</dl>";

  var featuresHTML = (l.features || []).length
    ? '<ul class="feature-list">' + l.features.map(function (f) { return "<li>" + e(f) + "</li>"; }).join("") + "</ul>"
    : "<p>لم تُضف مزايا لهذا العقار.</p>";

  var locText = S.locationLabel(l);
  var mapQuery = [l.district, S.placeShort(l.place), g ? g.name : "", "سوريا"].filter(Boolean).join("، ");
  var mapURL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery);

  var waText = "مرحباً، أنا مهتم بالعقار رقم #" + l.id + " (" + l.title + " — " + locText + ")";
  var pills = [];
  if (l.negotiable) pills.push('<span class="pill">قابل للتفاوض</span>');
  if (l.furnished) pills.push('<span class="pill">مفروش</span>');
  if (l.ownership) pills.push('<span class="pill">' + e(l.ownership) + "</span>");

  var agentHTML = agent
    ? '<div class="side-card">' +
        "<h3>الوسيط المسؤول</h3>" +
        '<div class="agent"><span class="avatar" aria-hidden="true">' + e(S.initials(agent.name)) + "</span><div><strong>" + e(agent.name) + "</strong><span>" + e(agent.role) + "</span></div></div>" +
        '<div class="agent-actions">' +
          '<a class="btn btn-ghost" href="' + S.telLink(agent.phone) + '">' + i("phone") + "اتصال</a>" +
          '<a class="btn btn-ghost" href="' + S.waLink(waText + "\nالوسيط: " + agent.name, agent.whatsapp) + '" target="_blank" rel="noopener">' + i("chat") + "واتساب</a>" +
        "</div>" +
      "</div>"
    : "";

  var today = new Date().toISOString().slice(0, 10);
  var dealCrumb = '<a href="properties.html?deal=' + l.deal + '">' + S.dealLabel(l.deal) + "</a>";
  var govCrumb = g ? '<a href="properties.html?deal=' + l.deal + "&gov=" + g.id + '">' + g.name + "</a>" : "";

  root.innerHTML =
    '<div class="container prop-top">' +
      '<ol class="breadcrumb"><li><a href="index.html">الرئيسية</a></li><li>' + dealCrumb + "</li>" + (govCrumb ? "<li>" + govCrumb + "</li>" : "") + "<li>" + e(S.placeShort(l.place)) + "</li></ol>" +
      '<div class="prop-head">' +
        "<div><h1>" + e(l.title) + '</h1><p class="prop-loc">' + e(locText) + " · " + TYPES[l.type] + " " + S.dealLabel(l.deal) + "</p></div>" +
        '<div class="prop-actions">' +
          '<button type="button" class="btn btn-ghost" id="share-btn">' + i("share") + "مشاركة</button>" +
        "</div>" +
      "</div>" +
      gallery +
    "</div>" +

    '<div class="container prop-layout">' +
      '<div class="prop-main">' +
        keyStrip +
        '<nav class="quick-nav" aria-label="أقسام الصفحة">' +
          '<a href="#about">عن العقار</a><a href="#details">المواصفات</a><a href="#features">المزايا</a><a href="#location">الموقع</a><a href="#viewing">طلب معاينة</a>' +
        "</nav>" +
        '<section class="prop-section" id="about"><h2>عن العقار</h2><p class="prop-desc">' + e(l.description) + "</p></section>" +
        '<section class="prop-section" id="details"><h2>المواصفات</h2>' + factsHTML + "</section>" +
        '<section class="prop-section" id="features"><h2>المزايا</h2>' + featuresHTML + "</section>" +
        '<section class="prop-section" id="location"><h2>الموقع</h2>' +
          '<div class="map-box"><div><strong>' + e(locText) + "</strong><p>نرسل لك العنوان الدقيق بعد تأكيد موعد المعاينة.</p></div>" +
          '<a class="text-link" href="' + mapURL + '" target="_blank" rel="noopener">عرض المنطقة على الخريطة</a></div>' +
        "</section>" +
      "</div>" +

      '<aside class="side">' +
        '<div class="side-card">' +
          '<p class="price-label">' + (l.deal === "rent" ? "الإيجار المطلوب" : "السعر المطلوب") + "</p>" +
          '<div class="price-big">' + S.priceHTML(l) + "</div>" +
          (pills.length ? '<div class="price-meta">' + pills.join("") + "</div>" : "") +
          '<a class="btn btn-primary btn-block" href="#viewing">اطلب معاينة</a>' +
          '<a class="btn btn-ghost btn-block" href="' + S.waLink(waText) + '" target="_blank" rel="noopener">' + i("chat") + "اسأل عبر واتساب</a>" +
        "</div>" +
        agentHTML +
        '<div class="side-card" id="viewing">' +
          "<h3>طلب معاينة</h3>" +
          '<form id="viewing-form" class="form-grid" novalidate>' +
            '<div class="field span-2"><label for="v-name">الاسم</label><input id="v-name" name="name" autocomplete="name" required></div>' +
            '<div class="field span-2"><label for="v-phone">رقم الهاتف</label><input id="v-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="09xx xxx xxx" required></div>' +
            '<div class="field"><label for="v-date">التاريخ المناسب</label><input id="v-date" name="date" type="date" min="' + today + '"></div>' +
            '<div class="field"><label for="v-time">الوقت</label><select id="v-time" name="time"><option value="">أي وقت</option><option>صباحاً</option><option>بعد الظهر</option><option>مساءً</option></select></div>' +
            '<div class="field span-2"><label for="v-msg">ملاحظات (اختياري)</label><textarea id="v-msg" name="msg" rows="3"></textarea></div>' +
            '<div class="span-2"><button class="btn btn-accent btn-block" type="submit">أرسل طلب المعاينة</button></div>' +
          "</form>" +
        "</div>" +
      "</aside>" +
    "</div>" +

    '<section class="section section-alt"><div class="container">' +
      '<div class="section-head"><h2>عقارات مشابهة</h2><a class="text-link" href="properties.html?deal=' + l.deal + '">عرض المزيد</a></div>' +
      '<div class="cards cards-3" id="similar"></div>' +
    "</div></section>";

  /* شريط الإجراءات السفلي على الجوال */
  var bar = document.createElement("div");
  bar.className = "action-bar";
  bar.innerHTML =
    '<div class="price-mini">' + S.priceHTML(l) + "</div>" +
    '<a class="icon-btn" href="' + S.waLink(waText) + '" target="_blank" rel="noopener" aria-label="واتساب">' + i("chat") + "</a>" +
    '<a class="btn btn-primary" href="#viewing">اطلب معاينة</a>';
  document.body.appendChild(bar);
  document.body.classList.add("has-action-bar");

  /* عقارات مشابهة */
  var others = window.LISTINGS.filter(function (x) { return x.id !== l.id && x.deal === l.deal; });
  others.sort(function (a, b) {
    var sa = (a.gov === l.gov ? 2 : 0) + (a.type === l.type ? 1 : 0);
    var sb = (b.gov === l.gov ? 2 : 0) + (b.type === l.type ? 1 : 0);
    return sb - sa || b.date.localeCompare(a.date);
  });
  S.renderCards(document.getElementById("similar"), others.slice(0, 3));

  /* نموذج المعاينة */
  S.wireForm(document.getElementById("viewing-form"), {
    kind: "viewing",
    listingId: l.id,
    whatsapp: agent && agent.whatsapp,
    title: "طلب معاينة للعقار رقم #" + l.id + " — " + l.title + " (" + locText + ")",
    fields: [["name", "الاسم"], ["phone", "الهاتف"], ["date", "التاريخ المناسب"], ["time", "الوقت"], ["msg", "ملاحظات"]],
    successTitle: "تم استلام طلب المعاينة",
    successText: "سيتصل بك " + (agent ? agent.name : "الوسيط") + " لتأكيد الموعد."
  });

  /* المشاركة */
  document.getElementById("share-btn").addEventListener("click", function () {
    var url = location.href;
    if (navigator.share) {
      navigator.share({ title: l.title, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { S.toast("تم نسخ رابط العقار"); }, function () { S.toast("انسخ الرابط من شريط العنوان"); });
    } else {
      S.toast("انسخ الرابط من شريط العنوان");
    }
  });

  /* نافذة الصور */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCount = document.getElementById("lb-count");
  var cur = 0, lastFocus = null;
  function show(n) {
    cur = (n + l.images.length) % l.images.length;
    lbImg.src = S.img(l.images[cur]);
    lbImg.alt = l.title + " — صورة " + (cur + 1);
    lbCount.textContent = "الصورة " + (cur + 1) + " من " + l.images.length;
  }
  function openLB(n) {
    lastFocus = document.activeElement;
    show(n); lb.hidden = false; document.body.style.overflow = "hidden";
    document.getElementById("lb-close").focus();
  }
  function closeLB() {
    lb.hidden = true; document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  root.querySelectorAll("[data-img]").forEach(function (b) {
    b.addEventListener("click", function () { openLB(Number(b.getAttribute("data-img"))); });
  });
  document.getElementById("lb-close").addEventListener("click", closeLB);
  document.getElementById("lb-prev").addEventListener("click", function () { show(cur - 1); });
  document.getElementById("lb-next").addEventListener("click", function () { show(cur + 1); });
  lb.addEventListener("click", function (ev) { if (ev.target === lb || ev.target.classList.contains("lightbox-stage")) closeLB(); });
  document.addEventListener("keydown", function (ev) {
    if (lb.hidden) return;
    if (ev.key === "Escape") closeLB();
    if (ev.key === "ArrowLeft") show(cur + 1);
    if (ev.key === "ArrowRight") show(cur - 1);
  });
});
