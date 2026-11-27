/* منطق صفحات: بيع/تأجير عقارك، الوسطاء، اتصل بنا */
window.onSiteReady(function () {
  "use strict";
  var S = window.SITE;
  var C = window.SITE_CONFIG;
  var page = document.body.getAttribute("data-page");
  var $ = function (id) { return document.getElementById(id); };

  if (page === "sell") {
    var gov = $("s-gov"), place = $("s-place"), label = $("s-place-label");
    S.fillGovSelect(gov, "اختر المحافظة");
    S.fillPlaceSelect(place, "", label);
    S.fillTypeSelect($("s-type"), "اختر النوع");
    $("s-own").innerHTML = '<option value="">لا أعرف</option>' + window.OWNERSHIP_TYPES.map(function (o) { return "<option>" + o + "</option>"; }).join("");
    gov.addEventListener("change", function () { S.fillPlaceSelect(place, gov.value, label, "غير محدد"); });
    S.wireForm($("sell-form"), {
      kind: "sell",
      title: "طلب عرض عقار / تقييم",
      fields: [["purpose", "الطلب"], ["gov", "المحافظة"], ["place", "المنطقة"], ["type", "نوع العقار"], ["size", "المساحة م²"],
        ["rooms", "الغرف"], ["own", "الملكية"], ["price", "السعر المتوقع"], ["name", "الاسم"], ["phone", "الهاتف"],
        ["contact", "التواصل المفضل"], ["msg", "ملاحظات"]],
      successTitle: "شكراً لك، وصلنا طلبك",
      onReset: function () { S.fillPlaceSelect(place, "", label); }
    });
  }

  if (page === "agents") {
    var sel = $("ag-gov"), grid = $("agents"), count = $("ag-count");
    S.fillGovSelect(sel);
    var p = new URLSearchParams(location.search).get("gov");
    if (p) sel.value = p;

    function render() {
      var g = sel.value;
      var list = window.AGENTS.filter(function (a) { return !g || a.govs.indexOf(g) !== -1; });
      count.textContent = list.length ? (list.length === 1 ? "وسيط واحد" : list.length === 2 ? "وسيطان" : list.length + " وسطاء") : "";
      if (!list.length) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1"><h3>لا يوجد وسيط مخصّص لهذه المحافظة بعد</h3><p>تواصل مع المكتب الرئيسي وسنحوّلك إلى الوسيط الأقرب.</p><a class="btn btn-primary" href="contact.html">اتصل بنا</a></div>';
        return;
      }
      grid.innerHTML = list.map(function (a) {
        var n = window.LISTINGS.filter(function (l) { return l.agent === a.id; }).length;
        var areas = a.govs.map(S.govName).join("، ");
        var msg = "مرحباً، أريد التواصل مع الوسيط " + a.name;
        return '<article class="agent-card">' +
          '<div class="agent"><span class="avatar" aria-hidden="true">' + S.esc(S.initials(a.name)) + "</span><div><strong>" + S.esc(a.name) + "</strong><span>" + S.esc(a.role) + "</span></div></div>" +
          '<ul class="agent-meta">' +
            "<li>" + S.icon("pin") + "<span>" + S.esc(areas) + "</span></li>" +
            "<li>" + S.icon("chat") + "<span>اللغات: " + S.esc(a.languages) + "</span></li>" +
            "<li>" + S.icon("home") + "<span>" + (n ? n + " عقارات معروضة حالياً" : "لا عقارات معروضة حالياً") + "</span></li>" +
          "</ul>" +
          '<div class="agent-actions">' +
            '<a class="btn btn-ghost" href="' + S.telLink(a.phone) + '">' + S.icon("phone") + "اتصال</a>" +
            '<a class="btn btn-whatsapp" href="' + S.waLink(msg, a.whatsapp) + '" target="_blank" rel="noopener">' + S.icon("chat") + "واتساب</a>" +
          "</div>" +
        "</article>";
      }).join("");
    }
    sel.addEventListener("change", render);
    render();
  }

  if (page === "contact") {
    var offices = $("offices");
    offices.innerHTML = (C.offices || []).map(function (o) {
      return '<div class="office"><h3>' + S.esc(o.name) + "</h3><ul>" +
        "<li>" + S.icon("pin") + "<span>" + S.esc(o.address) + "، " + S.esc(S.govName(o.gov)) + "</span></li>" +
        "<li>" + S.icon("phone") + '<a href="' + S.telLink() + '"><bdi dir="ltr">' + S.esc(o.phone || C.phone) + "</bdi></a></li>" +
        "<li>" + S.icon("clock") + "<span>" + S.esc(o.hours || C.workingHours) + "</span></li>" +
      "</ul></div>";
    }).join("");
    S.fillGovSelect($("c-gov"), "اختر المحافظة");
    S.wireForm($("contact-form"), {
      kind: "contact",
      title: "رسالة من الموقع",
      fields: [["topic", "الموضوع"], ["gov", "المحافظة"], ["name", "الاسم"], ["phone", "الهاتف"], ["email", "البريد"], ["msg", "الرسالة"]],
      successTitle: "شكراً لك، وصلت رسالتك"
    });
  }
});
