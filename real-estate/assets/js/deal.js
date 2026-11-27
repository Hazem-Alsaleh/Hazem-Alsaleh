/* Sidene «البيع والشراء» (sale.html) og «الإيجار» (rent.html) */
window.onSiteReady(function () {
  "use strict";
  var S = window.SITE;
  var deal = document.body.getAttribute("data-page") === "rent" ? "rent" : "sale";
  var $ = function (id) { return document.getElementById(id); };

  /* البحث */
  var gov = $("ds-gov"), place = $("ds-place"), placeLabel = $("ds-place-label"), type = $("ds-type");
  S.fillGovSelect(gov);
  S.fillPlaceSelect(place, "", placeLabel);
  S.fillTypeSelect(type);
  gov.addEventListener("change", function () { S.fillPlaceSelect(place, gov.value, placeLabel); });
  $("deal-search").addEventListener("submit", function (e) {
    e.preventDefault();
    var p = new URLSearchParams();
    p.set("deal", deal);
    if (gov.value) p.set("gov", gov.value);
    if (place.value) p.set("place", place.value);
    if (type.value) p.set("type", type.value);
    location.href = "properties.html?" + p.toString();
  });

  /* أحدث العقارات */
  var list = window.LISTINGS.filter(function (l) { return l.deal === deal; })
    .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.date.localeCompare(a.date); });
  S.renderCards($("deal-listings"), list.slice(0, 8));
  var n = list.length;
  var word = n === 1 ? "عقار واحد" : n === 2 ? "عقاران" : n <= 10 ? n + " عقارات" : n + " عقاراً";
  $("deal-all").textContent = (deal === "rent" ? "كل العقارات للإيجار" : "كل العقارات للبيع") + " (" + word + ")";

  /* نموذج أصحاب العقارات */
  var sgov = $("s-gov"), splace = $("s-place"), slabel = $("s-place-label");
  S.fillGovSelect(sgov, "اختر المحافظة");
  S.fillPlaceSelect(splace, "", slabel);
  S.fillTypeSelect($("s-type"), "اختر النوع");
  if ($("s-own")) $("s-own").innerHTML = '<option value="">لا أعرف</option>' + window.OWNERSHIP_TYPES.map(function (o) { return "<option>" + o + "</option>"; }).join("");
  sgov.addEventListener("change", function () { S.fillPlaceSelect(splace, sgov.value, slabel, "غير محدد"); });
  S.wireForm($("owner-form"), {
    kind: "sell",
    title: deal === "rent" ? "طلب تأجير عقار" : "طلب بيع عقار / تقييم",
    fields: [["purpose", "الطلب"], ["gov", "المحافظة"], ["place", "المنطقة"], ["type", "نوع العقار"], ["size", "المساحة م²"],
      ["rooms", "الغرف"], ["own", "الملكية"], ["furnished", "الفرش"], ["price", deal === "rent" ? "الأجرة المتوقعة" : "السعر المتوقع"],
      ["name", "الاسم"], ["phone", "الهاتف"], ["contact", "التواصل المفضل"], ["msg", "ملاحظات"]],
    successTitle: "شكراً لك، وصلنا طلبك",
    onReset: function () { S.fillPlaceSelect(splace, "", slabel); }
  });
});
