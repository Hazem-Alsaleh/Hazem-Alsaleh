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

  /* العقارات المختارة */
  function newest(a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.date.localeCompare(a.date); }
  var sale = L.filter(function (l) { return l.deal === "sale"; }).sort(newest).slice(0, 6);
  var rent = L.filter(function (l) { return l.deal === "rent"; }).sort(newest).slice(0, 3);
  S.renderCards(document.getElementById("featured-sale"), sale);
  S.renderCards(document.getElementById("featured-rent"), rent);

  /* المحافظات مع عدد العقارات */
  var grid = document.getElementById("gov-grid");
  grid.innerHTML = window.GOVERNORATES.map(function (g) {
    var n = L.filter(function (l) { return l.gov === g.id; }).length;
    var label = n === 0 ? "قريباً" : n === 1 ? "عقار واحد" : n === 2 ? "عقاران" : n <= 10 ? n + " عقارات" : n + " عقاراً";
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
