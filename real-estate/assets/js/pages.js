/* منطق صفحات: بيع/تأجير عقارك، الوسطاء، اتصل بنا */
window.onSiteReady(function () {
  "use strict";
  var S = window.SITE;
  var C = window.SITE_CONFIG;
  var page = document.body.getAttribute("data-page");
  var $ = function (id) { return document.getElementById(id); };

  if (page === "agents") {
    var sel = $("ag-gov"), grid = $("agents"), count = $("ag-count");
    S.fillGovSelect(sel);
    var p = new URLSearchParams(location.search).get("gov");
    if (p) sel.value = p;

    function render() {
      var g = sel.value;
      var list = window.AGENTS.filter(function (a) { return !g || a.govs.indexOf(g) !== -1; });
      var k = list.length;
      count.textContent = k ? (k === 1 ? "وسيط واحد" : k === 2 ? "وسيطان" : k <= 10 ? k + " وسطاء" : k + " وسيطاً") : "";
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
            "<li>" + S.icon("home") + "<span>" + (n === 0 ? "لا توجد عقارات معروضة حالياً" : n === 1 ? "عقار واحد معروض حالياً" : n === 2 ? "عقاران معروضان حالياً" : n <= 10 ? n + " عقارات معروضة حالياً" : n + " عقاراً معروضاً حالياً") + "</span></li>" +
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
