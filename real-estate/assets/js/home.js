window.onSiteReady(function () {
  "use strict";
  var S = window.SITE;
  var L = window.LISTINGS;

  /* البحث في الواجهة */
  var form = document.getElementById("hero-search");
  var gov = document.getElementById("hs-gov");
  var place = document.getElementById("hs-place");
  var placeLabel = document.getElementById("hs-place-label");
  var type = document.getElementById("hs-type");
  var deal = document.getElementById("hs-deal");

  S.fillGovSelect(gov);
  S.fillPlaceSelect(place, "", placeLabel);
  S.fillTypeSelect(type);
  gov.addEventListener("change", function () { S.fillPlaceSelect(place, gov.value, placeLabel); });

  form.querySelectorAll("[data-deal]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      form.querySelectorAll("[data-deal]").forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
      deal.value = tab.getAttribute("data-deal");
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = new URLSearchParams();
    p.set("deal", deal.value);
    if (gov.value) p.set("gov", gov.value);
    if (place.value) p.set("place", place.value);
    if (type.value) p.set("type", type.value);
    location.href = "properties.html?" + p.toString();
  });

  /* عقارات جديدة: تبويب للبيع / للإيجار */
  function newest(a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.date.localeCompare(a.date); }
  var grid = document.getElementById("featured");
  var allLink = document.getElementById("featured-all");
  function showFeatured(deal) {
    var list = L.filter(function (l) { return l.deal === deal; }).sort(newest).slice(0, 8);
    S.renderCards(grid, list);
    allLink.setAttribute("href", "properties.html?deal=" + deal);
    allLink.textContent = deal === "rent" ? "كل العقارات للإيجار" : "كل العقارات للبيع";
    document.querySelectorAll("[data-featured]").forEach(function (t) {
      t.setAttribute("aria-selected", t.getAttribute("data-featured") === deal ? "true" : "false");
    });
  }
  document.querySelectorAll("[data-featured]").forEach(function (t) {
    t.addEventListener("click", function () { showFeatured(t.getAttribute("data-featured")); });
  });
  showFeatured("sale");

  /* المحافظات مع عدد العقارات */
  document.getElementById("gov-grid").innerHTML = window.GOVERNORATES.map(function (g) {
    var n = L.filter(function (l) { return l.gov === g.id; }).length;
    var label = n === 0 ? "—" : n === 1 ? "عقار واحد" : n === 2 ? "عقاران" : n <= 10 ? n + " عقارات" : n + " عقاراً";
    return '<a class="gov-card" href="properties.html?gov=' + g.id + '"><strong>' + g.name + "</strong><span>" + label + "</span></a>";
  }).join("");

  /* نموذج التقييم السريع */
  S.fillGovSelect(document.getElementById("qv-gov"), "اختر المحافظة");
  S.fillTypeSelect(document.getElementById("qv-type"), "اختر النوع");
  S.wireForm(document.getElementById("quick-valuation"), {
    kind: "valuation",
    title: "طلب تقييم مجاني لعقار",
    fields: [["gov", "المحافظة"], ["type", "نوع العقار"], ["name", "الاسم"], ["phone", "الهاتف"]],
    successTitle: "شكراً لك، وصلنا طلب التقييم"
  });
});
