/*
 * لوحة التحكم — تطبيق صفحة واحدة بدون مكتبات.
 * يتصل بالخادم عبر ../api/admin/* ويستخدم ترويسة X-Requested-With للحماية من طلبات المواقع الأخرى.
 */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var modalRoot = document.getElementById("modal-root");
  var state = { user: null, ref: null, settings: {}, agents: [], listings: [], inquiries: [], users: [], notify: { configured: false } };
  var dirty = false;

  var STATUS = { published: "منشور", draft: "مسودة", sold: "مباع", rented: "مؤجّر" };
  var KIND = { valuation: "طلب تقييم", viewing: "طلب معاينة", contact: "رسالة", sell: "عرض عقار" };
  var INQ_STATUS = { "new": "جديد", "in-progress": "قيد المتابعة", done: "منتهٍ" };
  var MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];

  /* ---------- أدوات ---------- */
  var ICONS = {
    home: '<path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    alert: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'
  };
  function icon(n) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || "") + "</svg>";
  }
  var BRAND_MARK = '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="var(--brand)"/><path d="M12 31V19.5C12 13.5 16 10 20 7.5c4 2.5 8 6 8 12V31z" fill="none" stroke="var(--on-brand)" stroke-width="2.4" stroke-linejoin="round"/><path d="M17 31v-7a3 3 0 0 1 6 0v7" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmtNum(n) { return Number(n).toLocaleString("en-US"); }
  function fmtDate(iso, withTime) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var s = d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
    if (withTime) s += "، " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    return s;
  }
  function gov(id) { return (state.ref.governorates || []).find(function (g) { return g.id === id; }) || null; }
  function govName(id) { var g = gov(id); return g ? g.name : ""; }
  function placeShort(p) { return p === "مركز جبل سمعان (حلب)" ? "حلب" : p; }
  function locationLabel(l) {
    var parts = [l.district, placeShort(l.place), govName(l.gov)].filter(Boolean);
    return parts.filter(function (p, i) { return parts.indexOf(p) === i; }).join("، ");
  }
  function priceText(l) {
    var a = l.currency === "SYP" ? fmtNum(l.price) + " ل.س" : "$" + fmtNum(l.price);
    if (l.deal === "rent") a += l.rentPeriod === "year" ? " سنوياً" : " شهرياً";
    return a;
  }
  function rateInfo() {
    var s = state.settings;
    if (!(Number(s.usdRate) > 0)) return "لم يُضبط سعر صرف، لذلك تظهر أسعار العقارات بعملتها الأصلية فقط ولا يظهر زر التبديل.";
    return "السعر الحالي: $1 = " + fmtNum(s.usdRate) + " ل.س" + (s.rateUpdatedAt ? " — آخر تحديث " + fmtDate(s.rateUpdatedAt) : "") + ".";
  }
  function imgSrc(p) { return p.indexOf("/") !== -1 ? "../" + p : "../assets/img/" + p + ".jpg"; }
  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/);
    var last = parts.length > 1 ? parts[parts.length - 1].replace(/^ال/, "") : "";
    return parts[0].charAt(0) + (last ? " " + last.charAt(0) : "");
  }
  function waNumber(p) {
    var d = String(p || "").replace(/\D/g, "");
    if (d.indexOf("00") === 0) d = d.slice(2);
    else if (d.charAt(0) === "0") d = "963" + d.slice(1);
    else if (d.length === 9 && d.charAt(0) === "9") d = "963" + d;
    return d;
  }
  function options(list, selected, emptyLabel) {
    return (emptyLabel != null ? '<option value="">' + esc(emptyLabel) + "</option>" : "") +
      list.map(function (o) {
        var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
        return '<option value="' + esc(v) + '"' + (String(v) === String(selected == null ? "" : selected) ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("");
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.style.background = isError ? "var(--heart)" : "";
    t.style.color = isError ? "#fff" : "";
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, isError ? 4500 : 2600);
  }

  function api(method, url, body) {
    var headers = { "X-Requested-With": "aqar-admin", Accept: "application/json" };
    var payload;
    if (typeof Blob !== "undefined" && body instanceof Blob) { payload = body; headers["Content-Type"] = body.type; }
    else if (body !== undefined) { payload = JSON.stringify(body); headers["Content-Type"] = "application/json"; }
    return fetch("../api" + url, { method: method, headers: headers, body: payload, credentials: "same-origin" })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) {
            var e = new Error(d.error || (r.status === 404 ? "الخادم غير متاح. شغّل الموقع بالأمر npm start" : "حدث خطأ"));
            e.status = r.status; e.errors = d.errors || {};
            throw e;
          }
          return d;
        });
      }, function () {
        var e = new Error("تعذّر الاتصال بالخادم");
        e.status = 0; e.errors = {};
        throw e;
      });
  }
  function fail(e) {
    if (e && e.status === 401) { state.user = null; dirty = false; renderLogin("انتهت الجلسة. سجّل الدخول مرة أخرى."); return; }
    toast((e && e.message) || "حدث خطأ", true);
  }

  function confirmBox(text, okLabel, danger) {
    return new Promise(function (resolve) {
      modalRoot.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true"><div class="modal-card">' +
          "<p>" + esc(text) + "</p>" +
          '<div class="modal-actions">' +
            '<button type="button" class="btn ' + (danger ? "btn-danger solid" : "btn-primary") + '" data-ok>' + esc(okLabel || "تأكيد") + "</button>" +
            '<button type="button" class="btn btn-ghost" data-cancel>إلغاء</button>' +
          "</div>" +
        "</div></div>";
      function close(v) { modalRoot.innerHTML = ""; document.removeEventListener("keydown", onKey); resolve(v); }
      function onKey(ev) { if (ev.key === "Escape") close(false); }
      $("[data-ok]", modalRoot).onclick = function () { close(true); };
      $("[data-cancel]", modalRoot).onclick = function () { close(false); };
      $(".modal", modalRoot).addEventListener("click", function (ev) { if (ev.target.classList.contains("modal")) close(false); });
      document.addEventListener("keydown", onKey);
      $("[data-ok]", modalRoot).focus();
    });
  }

  function showErrors(form, errors) {
    $$(".field-error", form).forEach(function (el) { el.remove(); });
    $$(".has-error", form).forEach(function (el) { el.classList.remove("has-error"); });
    var first = null;
    Object.keys(errors || {}).forEach(function (k) {
      var box = $('[data-field="' + k + '"]', form);
      if (!box) return;
      box.classList.add("has-error");
      var p = document.createElement("p");
      p.className = "field-error";
      p.textContent = errors[k];
      box.appendChild(p);
      if (!first) first = box;
    });
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function field(name, label, control, cls, forId) {
    return '<div class="field ' + (cls || "") + '" data-field="' + name + '"><label for="' + (forId || "f-" + name) + '">' + label + "</label>" + control + "</div>";
  }

  /* ---------- تسجيل الدخول ---------- */
  function renderLogin(message) {
    api("GET", "/admin/setup-status").then(function (s) { draw(s.hasUsers); }, function () { draw(true, true); });
    function draw(hasUsers, offline) {
      app.innerHTML =
        '<div class="login-wrap"><div class="footer-pattern" aria-hidden="true"></div>' +
        '<form class="login-card" id="login-form" novalidate>' +
          '<div class="brand">' + BRAND_MARK + '<span class="brand-text"><span class="brand-name">لوحة التحكم</span><span class="brand-tag">إدارة العقارات والطلبات</span></span></div>' +
          "<h1>تسجيل الدخول</h1>" +
          (offline ? '<p class="notice">لوحة التحكم تحتاج إلى الخادم. شغّل الموقع بالأمر <code>npm start</code> ثم افتح <code>/admin/</code>.</p>' : "") +
          (!hasUsers && !offline ? '<p class="notice">لا يوجد حساب مدير بعد. نفّذ الأمر <code>npm run create-admin</code> على الخادم، ثم سجّل الدخول هنا.</p>' : "") +
          (message ? '<p class="error-box">' + esc(message) + "</p>" : "") +
          '<p class="error-box" id="login-error" hidden></p>' +
          '<div class="field"><label for="l-user">اسم المستخدم</label><input id="l-user" name="username" autocomplete="username" dir="ltr" required></div>' +
          '<div class="field"><label for="l-pass">كلمة المرور</label><input id="l-pass" name="password" type="password" autocomplete="current-password" dir="ltr" required></div>' +
          '<button class="btn btn-primary btn-block" type="submit">دخول</button>' +
          '<a class="small" href="../">العودة إلى الموقع</a>' +
        "</form></div>";
      var form = $("#login-form");
      $("#l-user").focus();
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var btn = $('[type="submit"]', form);
        btn.disabled = true;
        api("POST", "/admin/login", { username: form.elements.username.value, password: form.elements.password.value })
          .then(function (d) { state.user = d.user; return start(); })
          .catch(function (e) {
            var box = $("#login-error");
            box.textContent = e.message; box.hidden = false;
            btn.disabled = false;
          });
      });
    }
  }

  /* ---------- التحميل والإطار ---------- */
  function loadAll() {
    return Promise.all([
      api("GET", "/admin/reference"), api("GET", "/admin/settings"), api("GET", "/admin/agents"),
      api("GET", "/admin/listings"), api("GET", "/admin/inquiries"), api("GET", "/admin/users"), api("GET", "/admin/notify/status")
    ]).then(function (r) {
      state.ref = r[0];
      state.settings = r[1].settings;
      state.agents = r[2].agents;
      state.listings = r[3].listings;
      state.inquiries = r[4].inquiries;
      state.users = r[5].users;
      state.notify = r[6];
    });
  }

  function start() {
    return loadAll().then(renderShell);
  }

  function newInquiries() { return state.inquiries.filter(function (q) { return q.status === "new"; }).length; }

  function renderShell() {
    var n = newInquiries();
    var brand = '<a class="brand" href="#/">' + BRAND_MARK + '<span class="brand-text"><span class="brand-name">' + esc(state.settings.companyName || "لوحة التحكم") + '</span><span class="brand-tag">لوحة التحكم</span></span></a>';
    app.innerHTML =
      '<div class="admin-shell">' +
        '<div class="admin-topbar">' + brand + '<button type="button" class="icon-btn" id="nav-toggle" aria-expanded="false" aria-controls="sidebar" aria-label="القائمة">' + icon("menu") + "</button></div>" +
        '<aside class="sidebar" id="sidebar">' + brand +
          '<nav class="side-nav" aria-label="أقسام لوحة التحكم">' +
            '<a href="#/" data-nav="/">' + icon("home") + "نظرة عامة</a>" +
            '<a href="#/listings" data-nav="/listings">' + icon("layers") + "العقارات</a>" +
            '<a href="#/listings/new" data-nav="/listings/new">' + icon("plus") + "إضافة عقار</a>" +
            '<a href="#/inquiries" data-nav="/inquiries">' + icon("chat") + 'الطلبات <span class="count-badge" id="inq-badge"' + (n ? "" : " hidden") + ">" + n + "</span></a>" +
            '<a href="#/agents" data-nav="/agents">' + icon("users") + "الوسطاء</a>" +
            '<a href="#/settings" data-nav="/settings">' + icon("gear") + "الإعدادات</a>" +
            '<span class="sep"></span>' +
            '<a href="../" target="_blank" rel="noopener">' + icon("external") + "عرض الموقع</a>" +
          "</nav>" +
          '<div class="side-user"><span>مسجّل باسم <strong style="color:#fff">' + esc(state.user.name || state.user.username) + "</strong></span>" +
            '<button type="button" id="logout">' + icon("logout") + "تسجيل الخروج</button></div>" +
        "</aside>" +
        '<main class="admin-main" id="view"></main>' +
      "</div>";
    $("#logout").addEventListener("click", function () {
      api("POST", "/admin/logout").then(function () { state.user = null; dirty = false; renderLogin(); }, fail);
    });
    $("#nav-toggle").addEventListener("click", function () {
      var open = $("#sidebar").classList.toggle("open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
      this.innerHTML = icon(open ? "close" : "menu");
    });
    route();
  }

  function updateBadge() {
    var b = $("#inq-badge");
    if (!b) return;
    var n = newInquiries();
    b.textContent = n; b.hidden = !n;
  }

  /* ---------- التنقل ---------- */
  var currentHash = location.hash, ignoreNext = false;
  window.addEventListener("hashchange", function () {
    if (ignoreNext) { ignoreNext = false; return; }
    if (dirty) {
      var target = location.hash;
      ignoreNext = true;
      location.hash = currentHash;
      confirmBox("لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظ؟", "المغادرة دون حفظ", true).then(function (ok) {
        if (ok) { dirty = false; location.hash = target; }
      });
      return;
    }
    currentHash = location.hash;
    if (state.user) route();
  });
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  function route() {
    var h = location.hash.replace(/^#/, "") || "/";
    var view = $("#view");
    if (!view) return;
    var sb = $("#sidebar");
    if (sb && sb.classList.contains("open")) $("#nav-toggle").click();
    $$(".side-nav a[data-nav]").forEach(function (a) {
      var on = a.getAttribute("data-nav") === h || (a.getAttribute("data-nav") === "/listings" && /^\/listings\/(\d+|copy\/\d+)$/.test(h));
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
    var m;
    if (h === "/listings") return viewListings(view);
    if (h === "/listings/new") return viewEditor(view, null);
    if ((m = h.match(/^\/listings\/(\d+)$/))) return viewEditor(view, Number(m[1]));
    if ((m = h.match(/^\/listings\/copy\/(\d+)$/))) return viewEditor(view, null, Number(m[1]));
    if (h === "/inquiries") { viewInquiries(view); return refreshInquiries(true); }
    if (h === "/agents") return viewAgents(view);
    if (h === "/settings") return viewSettings(view);
    viewDashboard(view);
    return refreshInquiries(true);
  }

  /* الطلبات الجديدة تصل من الموقع في أي وقت: نحدّثها عند فتح الصفحة وكل دقيقة */
  function refreshInquiries(rerender) {
    return api("GET", "/admin/inquiries").then(function (d) {
      var before = JSON.stringify(state.inquiries);
      state.inquiries = d.inquiries;
      updateBadge();
      if (!rerender || before === JSON.stringify(d.inquiries)) return;
      var h = location.hash.replace(/^#/, "") || "/";
      if (h === "/inquiries") viewInquiries($("#view"));
      else if (h === "/") viewDashboard($("#view"));
    }).catch(function (e) { if (e.status === 401) fail(e); });
  }
  setInterval(function () {
    if (state.user && document.visibilityState === "visible" && !dirty) refreshInquiries(true);
  }, 60000);

  /* ---------- نظرة عامة ---------- */
  function viewDashboard(view) {
    var L = state.listings;
    var pub = L.filter(function (l) { return l.status === "published"; });
    var sale = pub.filter(function (l) { return l.deal === "sale"; }).length;
    var rent = pub.length - sale;
    var drafts = L.filter(function (l) { return l.status === "draft"; }).length;
    var n = newInquiries();
    var s = state.settings;

    var todo = [];
    if (!s.companyName || s.companyName === "اسم الشركة") todo.push(["اكتب الاسم النهائي للشركة", "#/settings"]);
    if (s.phone === "+963 11 000 0000" || s.whatsapp === "963900000000") todo.push(["أدخل رقم الهاتف ورقم واتساب الحقيقيين", "#/settings"]);
    if (s.email === "info@example.com") todo.push(["أدخل البريد الإلكتروني للشركة", "#/settings"]);
    if (!(Number(s.usdRate) > 0)) todo.push(["أدخل سعر صرف الدولار ليتمكن الزوار من رؤية الأسعار بالليرة السورية", "#/settings"]);
    else if (s.rateUpdatedAt && Date.now() - new Date(s.rateUpdatedAt).getTime() > 7 * 864e5) todo.push(["حدّث سعر صرف الدولار (آخر تحديث " + fmtDate(s.rateUpdatedAt) + ")", "#/settings"]);
    if (!s.notifyEnabled) todo.push(["فعّل إشعارات البريد لتصلك الطلبات الجديدة فور وصولها", "#/settings"]);
    else if (!state.notify.configured) todo.push(["إشعارات البريد مفعّلة لكن خادم البريد (SMTP) غير مضبوط على الخادم", "#/settings"]);
    if (s.showSampleNotice) todo.push(["استبدل العقارات والوسطاء التجريبيين بالحقيقيين، ثم ألغِ ملاحظة «أمثلة توضيحية» من الإعدادات", "#/listings"]);

    var recentInq = state.inquiries.slice(0, 5);
    var recentL = L.slice(0, 5);
    view.innerHTML =
      '<div class="admin-head"><div><h1>مرحباً، ' + esc(state.user.name || state.user.username) + "</h1><p>ملخص العقارات والطلبات.</p></div>" +
        '<div class="head-actions"><a class="btn btn-primary" href="#/listings/new">' + icon("plus") + "إضافة عقار</a></div></div>" +
      '<div class="stats">' +
        '<a class="stat" href="#/listings"><strong>' + pub.length + "</strong><span>عقار منشور</span></a>" +
        '<a class="stat" href="#/listings"><strong>' + sale + "</strong><span>للبيع</span></a>" +
        '<a class="stat" href="#/listings"><strong>' + rent + "</strong><span>للإيجار</span></a>" +
        '<a class="stat" href="#/listings"><strong>' + drafts + "</strong><span>مسودة غير منشورة</span></a>" +
        '<a class="stat' + (n ? " attention" : "") + '" href="#/inquiries"><strong>' + n + "</strong><span>طلب جديد</span></a>" +
      "</div>" +
      (todo.length ? '<section class="panel"><h2>قبل إطلاق الموقع</h2><ul class="checklist">' +
        todo.map(function (t) { return "<li>" + icon("alert") + '<a href="' + t[1] + '">' + esc(t[0]) + "</a></li>"; }).join("") + "</ul></section>" : "") +
      '<div class="cols-2">' +
        '<section class="panel"><div class="panel-head"><h2>أحدث الطلبات</h2><a href="#/inquiries">عرض الكل</a></div>' +
          (recentInq.length ? '<ul class="mini-list">' + recentInq.map(function (q) {
            return '<li><div><a href="#/inquiries">' + esc(q.name) + " — " + KIND[q.kind] + "</a><small>" + fmtDate(q.createdAt, true) + "</small></div>" + '<span class="status st-' + q.status + '">' + INQ_STATUS[q.status] + "</span></li>";
          }).join("") + "</ul>" : '<p class="muted">لا توجد طلبات بعد. تظهر هنا طلبات التقييم والمعاينة والرسائل المرسلة من الموقع.</p>') +
        "</section>" +
        '<section class="panel"><div class="panel-head"><h2>آخر العقارات المعدّلة</h2><a href="#/listings">عرض الكل</a></div>' +
          (recentL.length ? '<ul class="mini-list">' + recentL.map(function (l) {
            return '<li><div><a href="#/listings/' + l.id + '">' + esc(l.title) + "</a><small>" + esc(locationLabel(l)) + " · " + esc(priceText(l)) + "</small></div>" + '<span class="status st-' + l.status + '">' + STATUS[l.status] + "</span></li>";
          }).join("") + "</ul>" : '<p class="muted">لا توجد عقارات بعد.</p>') +
        "</section>" +
      "</div>";
  }

  /* ---------- قائمة العقارات ---------- */
  var listFilter = { q: "", deal: "", status: "", gov: "" };
  function viewListings(view) {
    var counts = {};
    state.listings.forEach(function (l) { counts[l.status] = (counts[l.status] || 0) + 1; });
    view.innerHTML =
      '<div class="admin-head"><div><h1>العقارات</h1><p>' + state.listings.length + " عقار مسجّل</p></div>" +
        '<div class="head-actions"><a class="btn btn-primary" href="#/listings/new">' + icon("plus") + "إضافة عقار</a></div></div>" +
      '<section class="panel">' +
        '<div class="filters-row">' +
          '<div class="field grow"><label for="lf-q">بحث</label><input id="lf-q" type="search" placeholder="العنوان، الحي، رقم العقار" value="' + esc(listFilter.q) + '"></div>' +
          '<div class="field"><label for="lf-deal">العرض</label><select id="lf-deal">' + options([["sale", "للبيع"], ["rent", "للإيجار"]], listFilter.deal, "الكل") + "</select></div>" +
          '<div class="field"><label for="lf-status">الحالة</label><select id="lf-status">' + options(Object.keys(STATUS).map(function (k) { return [k, STATUS[k] + " (" + (counts[k] || 0) + ")"]; }), listFilter.status, "كل الحالات") + "</select></div>" +
          '<div class="field"><label for="lf-gov">المحافظة</label><select id="lf-gov">' + options(state.ref.governorates.map(function (g) { return [g.id, g.name]; }), listFilter.gov, "كل المحافظات") + "</select></div>" +
        "</div>" +
      "</section>" +
      '<section class="panel" id="list-body"></section>';
    ["q", "deal", "status", "gov"].forEach(function (k) {
      $("#lf-" + k).addEventListener(k === "q" ? "input" : "change", function () { listFilter[k] = this.value.trim(); renderListTable(); });
    });
    renderListTable();
  }

  function renderListTable() {
    var box = $("#list-body");
    var q = listFilter.q;
    var rows = state.listings.filter(function (l) {
      if (listFilter.deal && l.deal !== listFilter.deal) return false;
      if (listFilter.status && l.status !== listFilter.status) return false;
      if (listFilter.gov && l.gov !== listFilter.gov) return false;
      if (q) {
        var hay = [l.title, l.place, l.district, govName(l.gov), "#" + l.id, String(l.id)].join(" ");
        if (hay.indexOf(q.replace(/^#/, "")) === -1 && hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (!rows.length) {
      box.innerHTML = '<div class="empty"><h3>لا توجد عقارات مطابقة</h3><p>غيّر التصفية أو أضف عقاراً جديداً.</p><a class="btn btn-primary" href="#/listings/new">إضافة عقار</a></div>';
      return;
    }
    box.innerHTML =
      '<div class="table-wrap"><table class="data"><thead><tr><th><span class="sr-only">الصورة</span></th><th>العقار</th><th>السعر</th><th>الحالة</th><th>مميز</th><th>آخر تعديل</th><th><span class="sr-only">إجراءات</span></th></tr></thead><tbody>' +
      rows.map(function (l) {
        var types = state.ref.propertyTypes;
        return "<tr>" +
          '<td class="c-thumb">' + (l.images && l.images[0] ? '<img src="' + esc(imgSrc(l.images[0])) + '" alt="" loading="lazy">' : '<span class="muted">' + icon("image") + "</span>") + "</td>" +
          '<td class="c-title"><a href="#/listings/' + l.id + '">' + esc(l.title) + "</a><small>#" + l.id + " · " + esc(types[l.type] || "") + " " + (l.deal === "rent" ? "للإيجار" : "للبيع") + " · " + esc(locationLabel(l)) + "</small></td>" +
          '<td class="c-price"><bdi>' + esc(priceText(l)) + "</bdi></td>" +
          '<td><select data-status="' + l.id + '" aria-label="حالة العقار">' + options(Object.keys(STATUS).map(function (k) { return [k, STATUS[k]]; }), l.status) + "</select></td>" +
          '<td><button type="button" class="star" data-featured="' + l.id + '" aria-pressed="' + (l.featured ? "true" : "false") + '" aria-label="عقار مميز" title="يظهر في الصفحة الرئيسية">★</button></td>' +
          '<td class="c-date">' + fmtDate(l.updatedAt) + "</td>" +
          '<td class="c-actions">' +
            '<a class="btn btn-ghost btn-sm" href="#/listings/' + l.id + '">' + icon("edit") + "تعديل</a>" +
            (l.status === "published" ? '<a class="btn btn-ghost btn-sm" href="../property.html?id=' + l.id + '" target="_blank" rel="noopener">' + icon("eye") + "عرض</a>" : "") +
            '<button type="button" class="btn btn-danger btn-sm" data-delete="' + l.id + '" aria-label="حذف">' + icon("trash") + "</button>" +
          "</td></tr>";
      }).join("") + "</tbody></table></div>";

    $$("[data-status]", box).forEach(function (sel) {
      sel.addEventListener("change", function () {
        var id = Number(sel.getAttribute("data-status"));
        var old = findListing(id).status;
        api("PATCH", "/admin/listings/" + id, { status: sel.value }).then(function (d) {
          replaceListing(d.listing); toast("تم تغيير الحالة إلى «" + STATUS[d.listing.status] + "»");
        }).catch(function (e) {
          sel.value = old;
          if (e.errors && e.errors.images) toast(e.errors.images, true); else fail(e);
        });
      });
    });
    $$("[data-featured]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = Number(b.getAttribute("data-featured"));
        var next = b.getAttribute("aria-pressed") !== "true";
        api("PATCH", "/admin/listings/" + id, { featured: next }).then(function (d) {
          replaceListing(d.listing);
          b.setAttribute("aria-pressed", next ? "true" : "false");
          toast(next ? "سيظهر العقار في الصفحة الرئيسية" : "أُزيل العقار من المميزة");
        }, fail);
      });
    });
    $$("[data-delete]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var l = findListing(Number(b.getAttribute("data-delete")));
        deleteListing(l, renderListTable);
      });
    });
  }

  function findListing(id) { return state.listings.find(function (l) { return l.id === id; }) || null; }
  function replaceListing(row) {
    var i = state.listings.findIndex(function (l) { return l.id === row.id; });
    if (i === -1) state.listings.unshift(row); else state.listings[i] = row;
  }
  function deleteListing(l, after) {
    confirmBox("حذف العقار «" + l.title + "» نهائياً مع صوره؟ لا يمكن التراجع عن ذلك.", "حذف العقار", true).then(function (ok) {
      if (!ok) return;
      api("DELETE", "/admin/listings/" + l.id).then(function () {
        state.listings = state.listings.filter(function (x) { return x.id !== l.id; });
        toast("تم حذف العقار");
        after();
      }, fail);
    });
  }

  /* ---------- تحرير عقار ---------- */
  function viewEditor(view, id, copyFrom) {
    var ref = state.ref;
    var l;
    if (id) {
      l = findListing(id);
      if (!l) { view.innerHTML = '<div class="panel empty"><h3>العقار غير موجود</h3><a class="btn btn-primary" href="#/listings">العودة إلى العقارات</a></div>'; return; }
    } else if (copyFrom && findListing(copyFrom)) {
      l = JSON.parse(JSON.stringify(findListing(copyFrom)));
      delete l.id; delete l.createdAt; delete l.updatedAt; delete l.date;
      l.title = l.title + " (نسخة)";
      l.status = "draft";
    } else {
      l = { deal: "sale", type: "apartment", status: "draft", currency: state.settings.defaultCurrency || "USD", rentPeriod: "month", images: [], features: [], gov: "", place: "" };
    }
    var images = (l.images || []).slice();
    var features = (l.features || []).slice();
    var uploading = 0;
    dirty = false;

    var g = gov(l.gov);
    var types = Object.keys(ref.propertyTypes).map(function (k) { return [k, ref.propertyTypes[k]]; });
    var num = function (name, label, val, attrs) {
      return field(name, label, '<input id="f-' + name + '" name="' + name + '" type="number" inputmode="decimal" dir="ltr" ' + (attrs || "") + ' value="' + (val == null ? "" : esc(val)) + '">');
    };

    view.innerHTML =
      '<div class="admin-head"><div><h1>' + (id ? "تعديل العقار #" + id : "إضافة عقار جديد") + "</h1>" +
        "<p>" + (id ? esc(l.title) : "املأ المعلومات وأضف الصور، ثم اختر «منشور» ليظهر العقار في الموقع.") + "</p></div>" +
        '<div class="head-actions"><a class="btn btn-ghost" href="#/listings">العودة إلى القائمة</a></div></div>' +
      '<form class="editor" id="editor" novalidate>' +
        '<div class="editor-main">' +
          '<section class="panel"><h2>المعلومات الأساسية</h2><div class="form-grid">' +
            '<fieldset class="fieldset span-2" data-field="deal"><legend>نوع العرض</legend><div class="choice-row">' +
              '<label class="choice"><input type="radio" name="deal" value="sale"' + (l.deal === "sale" ? " checked" : "") + "><span>للبيع</span></label>" +
              '<label class="choice"><input type="radio" name="deal" value="rent"' + (l.deal === "rent" ? " checked" : "") + "><span>للإيجار</span></label>" +
            "</div></fieldset>" +
            field("type", "نوع العقار", '<select id="f-type" name="type">' + options(types, l.type) + "</select>") +
            field("title", "عنوان الإعلان", '<input id="f-title" name="title" maxlength="120" value="' + esc(l.title || "") + '" placeholder="مثال: شقة سوبر ديلوكس بإطلالة مفتوحة">', "span-2") +
            field("description", "الوصف", '<textarea id="f-description" name="description" rows="6" maxlength="5000" placeholder="صف العقار: الغرف، الإطلالة، القرب من الخدمات، حالة البناء…">' + esc(l.description || "") + "</textarea>", "span-2") +
          "</div></section>" +

          '<section class="panel"><h2>الموقع</h2><div class="form-grid">' +
            field("gov", "المحافظة", '<select id="f-gov" name="gov">' + options(ref.governorates.map(function (x) { return [x.id, x.name]; }), l.gov, "اختر المحافظة") + "</select>") +
            '<div class="field" data-field="place"><label for="f-place" id="f-place-label">' + (g ? g.placeLabel : "المدينة / الحي") + '</label><select id="f-place" name="place"></select></div>' +
            field("district", "المنطقة أو الشارع (اختياري)", '<input id="f-district" name="district" maxlength="60" value="' + esc(l.district || "") + '" placeholder="مثال: فيلات غربية">', "span-2") +
          "</div></section>" +

          '<section class="panel"><h2>السعر</h2><div class="form-grid">' +
            field("price", '<span id="price-label">' + (l.deal === "rent" ? "قيمة الإيجار" : "السعر") + "</span>", '<input id="f-price" name="price" type="number" min="0" inputmode="decimal" dir="ltr" value="' + (l.price == null ? "" : esc(l.price)) + '">') +
            field("currency", "العملة", '<select id="f-currency" name="currency">' + options([["USD", "دولار أمريكي ($)"], ["SYP", "ليرة سورية جديدة (ل.س)"]], l.currency) + "</select>") +
            '<p class="form-note span-2" id="price-eq" aria-live="polite"></p>' +
            '<div class="field" data-field="rentPeriod" id="rent-period-box"' + (l.deal === "rent" ? "" : " hidden") + '><label for="f-rentPeriod">مدة الإيجار</label><select id="f-rentPeriod" name="rentPeriod">' + options([["month", "شهري"], ["year", "سنوي"]], l.rentPeriod || "month") + "</select></div>" +
            '<div class="field" style="justify-content:end"><label class="check"><input type="checkbox" name="negotiable"' + (l.negotiable ? " checked" : "") + "> السعر قابل للتفاوض</label></div>" +
          "</div></section>" +

          '<section class="panel"><h2>المواصفات</h2><div class="form-grid">' +
            num("size", "المساحة (م²)", l.size, 'min="0"') +
            num("land", "مساحة الأرض (م²، اختياري)", l.land, 'min="0"') +
            num("rooms", "غرف النوم", l.rooms, 'min="0" max="50" step="1"') +
            num("baths", "الحمامات", l.baths, 'min="0" max="50" step="1"') +
            num("floor", "الطابق (0 = أرضي)", l.floor, 'min="-5" max="200" step="1"') +
            num("totalFloors", "عدد طوابق البناء", l.totalFloors, 'min="0" max="200" step="1"') +
            num("year", "سنة البناء", l.year, 'min="1000" step="1"') +
            field("finish", "الإكساء", '<select id="f-finish" name="finish">' + options(ref.finishLevels, l.finish, "غير محدد") + "</select>") +
            field("direction", "الاتجاه", '<select id="f-direction" name="direction">' + options(ref.directions, l.direction, "غير محدد") + "</select>") +
            field("ownership", "نوع الملكية", '<select id="f-ownership" name="ownership">' + options(ref.ownershipTypes, l.ownership, "غير محدد") + "</select>") +
            '<div class="field span-2"><label class="check"><input type="checkbox" name="furnished"' + (l.furnished ? " checked" : "") + "> العقار مفروش</label></div>" +
          "</div></section>" +

          '<section class="panel"><h2>المزايا والخدمات</h2><div class="feature-chips" id="feature-chips"></div>' +
            '<div class="add-row"><input id="feature-new" maxlength="60" placeholder="ميزة أخرى، مثال: إطلالة على قاسيون" aria-label="ميزة جديدة"><button type="button" class="btn btn-ghost" id="feature-add">' + icon("plus") + "إضافة</button></div>" +
          "</section>" +

          '<section class="panel" data-field="images"><div class="panel-head"><h2>الصور</h2><span class="muted small">الصورة الأولى هي الصورة الرئيسية. تُصغَّر الصور تلقائياً قبل الرفع.</span></div><div class="thumbs" id="thumbs"></div></section>' +
        "</div>" +

        '<aside class="editor-side">' +
          '<section class="panel"><h2>النشر</h2><div style="display:grid; gap:1rem">' +
            field("status", "الحالة", '<select id="f-status" name="status">' + options(Object.keys(STATUS).map(function (k) { return [k, STATUS[k]]; }), l.status) + "</select>") +
            '<label class="check"><input type="checkbox" name="featured"' + (l.featured ? " checked" : "") + "> عقار مميز (يظهر في الصفحة الرئيسية)</label>" +
            field("agent", "الوسيط المسؤول", '<select id="f-agent" name="agent">' + options(state.agents.map(function (a) { return [a.id, a.name]; }), l.agent, "بدون وسيط") + "</select>") +
            '<div class="side-actions">' +
              '<button type="submit" class="btn btn-primary btn-block" id="save-btn">' + icon("check") + "حفظ</button>" +
              (id && l.status === "published" ? '<a class="btn btn-ghost btn-block" href="../property.html?id=' + id + '" target="_blank" rel="noopener">' + icon("eye") + "عرض في الموقع</a>" : "") +
              (id ? '<a class="btn btn-ghost btn-block" href="#/listings/copy/' + id + '">' + icon("copy") + "نسخ كعقار جديد</a>" : "") +
              (id ? '<button type="button" class="btn btn-danger btn-block" id="delete-btn">' + icon("trash") + "حذف العقار</button>" : "") +
            "</div>" +
            (id ? '<div class="meta-list"><span>أُضيف: ' + fmtDate(l.createdAt) + "</span><span>آخر تعديل: " + fmtDate(l.updatedAt, true) + "</span></div>" : "") +
          "</div></section>" +
        "</aside>" +
      "</form>";

    var form = $("#editor");

    /* الموقع: المدينة حسب المحافظة */
    function fillPlaces(selected) {
      var gg = gov(form.elements.gov.value);
      $("#f-place-label").textContent = gg ? gg.placeLabel : "المدينة / الحي";
      form.elements.place.innerHTML = gg ? options(gg.places, selected, gg.id === "damascus" ? "اختر الحي" : "اختر المدينة أو البلدة") : '<option value="">اختر المحافظة أولاً</option>';
      form.elements.place.disabled = !gg;
    }
    fillPlaces(l.place);
    form.elements.gov.addEventListener("change", function () { fillPlaces(""); });

    /* نوع العرض */
    $$('input[name="deal"]', form).forEach(function (r) {
      r.addEventListener("change", function () {
        var rent = form.elements.deal.value === "rent";
        $("#rent-period-box").hidden = !rent;
        $("#price-label").textContent = rent ? "قيمة الإيجار" : "السعر";
      });
    });

    /* ما يعادل السعر بالعملة الأخرى حسب سعر الصرف المعتمد */
    function updatePriceEq() {
      var box = $("#price-eq");
      var r = Number(state.settings.usdRate) || 0;
      var v = parseFloat(form.elements.price.value);
      var cur = form.elements.currency.value;
      var hint = cur === "SYP" ? "اكتب المبلغ بالليرة الجديدة (بعد حذف صفرين). " : "";
      if (!r || !(v > 0)) { box.textContent = hint; return; }
      var other = cur === "SYP" ? "$" + fmtNum(Math.round(v / r)) : fmtNum(Math.round(v * r)) + " ل.س";
      box.textContent = hint + "يعادل تقريباً " + other + " حسب سعر الصرف المعتمد ($1 = " + fmtNum(r) + " ل.س).";
    }
    form.elements.price.addEventListener("input", updatePriceEq);
    form.elements.currency.addEventListener("change", updatePriceEq);
    updatePriceEq();

    /* المزايا */
    function renderFeatures() {
      var all = ref.commonFeatures.slice();
      features.forEach(function (f) { if (all.indexOf(f) === -1) all.push(f); });
      $("#feature-chips").innerHTML = all.map(function (f, i) {
        return '<label class="choice"><input type="checkbox" data-feature-i="' + i + '" value="' + esc(f) + '"' + (features.indexOf(f) !== -1 ? " checked" : "") + "><span>" + esc(f) + "</span></label>";
      }).join("");
    }
    renderFeatures();
    $("#feature-chips").addEventListener("change", function (ev) {
      var v = ev.target.value;
      if (ev.target.checked) { if (features.indexOf(v) === -1) features.push(v); }
      else features = features.filter(function (f) { return f !== v; });
    });
    function addFeature() {
      var inp = $("#feature-new");
      var v = inp.value.trim();
      if (!v) return;
      if (features.indexOf(v) === -1) features.push(v);
      inp.value = "";
      renderFeatures();
      dirty = true;
    }
    $("#feature-add").addEventListener("click", addFeature);
    $("#feature-new").addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); addFeature(); } });

    /* الصور */
    function renderImages() {
      var html = images.map(function (p, i) {
        return '<figure class="thumb"><img src="' + esc(imgSrc(p)) + '" alt="صورة ' + (i + 1) + '">' +
          "<figcaption>" + (i === 0 ? '<span class="cover">الصورة الرئيسية</span>' : '<button type="button" data-cover="' + i + '">اجعلها رئيسية</button>') +
          '<span class="tools">' +
            (i > 0 ? '<button type="button" data-move="' + i + '" data-dir="-1" aria-label="تقديم الصورة">' + icon("right") + "</button>" : "") +
            (i < images.length - 1 ? '<button type="button" data-move="' + i + '" data-dir="1" aria-label="تأخير الصورة">' + icon("left") + "</button>" : "") +
            '<button type="button" class="del" data-remove="' + i + '" aria-label="حذف الصورة">' + icon("trash") + "</button>" +
          "</span></figcaption></figure>";
      }).join("");
      for (var k = 0; k < uploading; k++) html += '<div class="thumb pending">جارٍ الرفع…</div>';
      html += '<label class="upload-tile" id="upload-tile">' + icon("image") + "<span>أضف صوراً</span><small class=\"muted\">JPG أو PNG أو WebP</small>" +
        '<input type="file" id="img-input" accept="image/jpeg,image/png,image/webp,image/*" multiple></label>';
      $("#thumbs").innerHTML = html;
      $("#img-input").addEventListener("change", function () { uploadFiles(this.files); this.value = ""; });
      var tile = $("#upload-tile");
      ["dragenter", "dragover"].forEach(function (t) { tile.addEventListener(t, function (ev) { ev.preventDefault(); tile.classList.add("drag"); }); });
      ["dragleave", "drop"].forEach(function (t) { tile.addEventListener(t, function () { tile.classList.remove("drag"); }); });
      tile.addEventListener("drop", function (ev) { ev.preventDefault(); uploadFiles(ev.dataTransfer.files); });
    }
    $("#thumbs").addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-cover")) { var i = Number(b.getAttribute("data-cover")); images.unshift(images.splice(i, 1)[0]); }
      else if (b.hasAttribute("data-move")) {
        var a = Number(b.getAttribute("data-move")), d = Number(b.getAttribute("data-dir"));
        var tmp = images[a]; images[a] = images[a + d]; images[a + d] = tmp;
      } else if (b.hasAttribute("data-remove")) images.splice(Number(b.getAttribute("data-remove")), 1);
      else return;
      dirty = true;
      renderImages();
    });

    function resizeImage(file) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file);
        var im = new Image();
        im.onload = function () {
          var max = 1600, w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
          var c = document.createElement("canvas");
          c.width = Math.round(w * k); c.height = Math.round(h * k);
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(im, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) { if (b) resolve(b); else reject(new Error("تعذّرت معالجة الصورة " + file.name)); }, "image/jpeg", 0.82);
        };
        im.onerror = function () { URL.revokeObjectURL(url); reject(new Error("تعذّرت قراءة الصورة " + file.name + ". استخدم JPG أو PNG.")); };
        im.src = url;
      });
    }
    function uploadFiles(fileList) {
      var files = Array.prototype.slice.call(fileList || []).filter(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic)$/i.test(f.name); });
      if (!files.length) return;
      if (images.length + files.length > 30) { toast("الحد الأقصى 30 صورة للعقار الواحد", true); files = files.slice(0, Math.max(0, 30 - images.length)); }
      uploading += files.length;
      renderImages();
      files.reduce(function (p, f) {
        return p.then(function () {
          return resizeImage(f).then(function (blob) { return api("POST", "/admin/uploads", blob); })
            .then(function (d) { images.push(d.path); dirty = true; })
            .catch(fail)
            .then(function () { uploading--; renderImages(); });
        });
      }, Promise.resolve()).then(function () { showErrors(form, {}); });
    }
    renderImages();

    /* حفظ */
    form.addEventListener("input", function () { dirty = true; });
    form.addEventListener("change", function () { dirty = true; });
    function collect() {
      var f = form.elements;
      return {
        deal: f.deal.value, type: f.type.value, title: f.title.value, description: f.description.value,
        gov: f.gov.value, place: f.place.value, district: f.district.value,
        price: f.price.value, currency: f.currency.value, rentPeriod: f.rentPeriod.value, negotiable: f.negotiable.checked,
        size: f.size.value, land: f.land.value, rooms: f.rooms.value, baths: f.baths.value, floor: f.floor.value,
        totalFloors: f.totalFloors.value, year: f.year.value, finish: f.finish.value, direction: f.direction.value,
        ownership: f.ownership.value, furnished: f.furnished.checked, features: features.slice(), images: images.slice(),
        agent: f.agent.value, status: f.status.value, featured: f.featured.checked
      };
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (uploading) { toast("انتظر حتى ينتهي رفع الصور", true); return; }
      var btn = $("#save-btn");
      btn.disabled = true;
      api(id ? "PUT" : "POST", "/admin/listings" + (id ? "/" + id : ""), collect()).then(function (d) {
        replaceListing(d.listing);
        dirty = false;
        toast(d.listing.status === "published" ? "تم الحفظ، والعقار منشور في الموقع" : "تم الحفظ (" + STATUS[d.listing.status] + ")");
        if (!id) location.hash = "#/listings/" + d.listing.id;
        else viewEditor(view, id);
      }).catch(function (e) {
        btn.disabled = false;
        if (e.status === 400) { showErrors(form, e.errors); toast(e.message, true); } else fail(e);
      });
    });
    if (id) $("#delete-btn").addEventListener("click", function () {
      deleteListing(l, function () { dirty = false; location.hash = "#/listings"; });
    });
  }

  /* ---------- الطلبات ---------- */
  var inqFilter = { status: "", kind: "" };
  function viewInquiries(view) {
    var c = { "": state.inquiries.length };
    state.inquiries.forEach(function (q) { c[q.status] = (c[q.status] || 0) + 1; });
    view.innerHTML =
      '<div class="admin-head"><div><h1>الطلبات</h1><p>طلبات التقييم والمعاينة والرسائل المرسلة من نماذج الموقع.</p></div></div>' +
      '<section class="panel"><div class="filters-row" style="align-items:center; justify-content:space-between">' +
        '<div class="tabs" role="group" aria-label="حالة الطلب">' +
          [["", "الكل"], ["new", "جديد"], ["in-progress", "قيد المتابعة"], ["done", "منتهٍ"]].map(function (t) {
            return '<button type="button" data-tab="' + t[0] + '" aria-pressed="' + (inqFilter.status === t[0] ? "true" : "false") + '">' + t[1] + " (" + (c[t[0]] || 0) + ")</button>";
          }).join("") +
        "</div>" +
        '<div class="field" style="flex:0 1 220px"><label for="iq-kind" class="sr-only">نوع الطلب</label><select id="iq-kind">' + options(Object.keys(KIND).map(function (k) { return [k, KIND[k]]; }), inqFilter.kind, "كل الأنواع") + "</select></div>" +
      "</div></section>" +
      '<div class="inq-list" id="inq-list"></div>';
    $$("[data-tab]", view).forEach(function (b) {
      b.addEventListener("click", function () { inqFilter.status = b.getAttribute("data-tab"); viewInquiries(view); });
    });
    $("#iq-kind").addEventListener("change", function () { inqFilter.kind = this.value; renderInqList(); });
    renderInqList();
  }

  function renderInqList() {
    var box = $("#inq-list");
    var rows = state.inquiries.filter(function (q) {
      return (!inqFilter.status || q.status === inqFilter.status) && (!inqFilter.kind || q.kind === inqFilter.kind);
    });
    if (!rows.length) {
      box.innerHTML = '<div class="panel empty"><h3>لا توجد طلبات هنا</h3><p>عندما يرسل زائر نموذجاً من الموقع يظهر طلبه في هذه الصفحة.</p></div>';
      return;
    }
    box.innerHTML = rows.map(function (q) {
      var l = q.listingId ? findListing(q.listingId) : null;
      var wa = waNumber(q.phone);
      return '<article class="inq' + (q.status === "new" ? " is-new" : "") + '">' +
        '<div class="inq-head"><span class="status st-' + q.status + '">' + INQ_STATUS[q.status] + "</span><strong>" + KIND[q.kind] + "</strong>" +
          '<time datetime="' + esc(q.createdAt) + '">' + fmtDate(q.createdAt, true) + "</time>" +
          '<span class="grow"><select data-inq="' + q.id + '" aria-label="تغيير حالة الطلب">' + options(Object.keys(INQ_STATUS).map(function (k) { return [k, INQ_STATUS[k]]; }), q.status) + "</select>" +
          '<button type="button" class="btn btn-danger btn-sm" data-inq-del="' + q.id + '" aria-label="حذف الطلب">' + icon("trash") + "</button></span></div>" +
        '<div class="inq-who"><strong>' + esc(q.name) + "</strong>" +
          '<a href="tel:' + esc(q.phone.replace(/\s+/g, "")) + '">' + icon("phone") + '<bdi dir="ltr">' + esc(q.phone) + "</bdi></a>" +
          (wa ? '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + icon("chat") + "واتساب</a>" : "") +
        "</div>" +
        (q.listingId ? '<p class="small">العقار: ' + (l ? '<a href="#/listings/' + l.id + '">#' + l.id + " — " + esc(l.title) + "</a>" : "#" + q.listingId + " (محذوف)") + "</p>" : "") +
        (q.fields && q.fields.length ? "<dl>" + q.fields.map(function (p) { return "<dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd>"; }).join("") + "</dl>" : "") +
        (q.email === "sent" ? '<p class="small muted mail-note">' + icon("check") + "أُرسل إشعار بالبريد</p>" : "") +
        (q.email === "failed" ? '<p class="small mail-note mail-failed">' + icon("alert") + "تعذّر إرسال إشعار البريد. تحقق من إعدادات خادم البريد.</p>" : "") +
      "</article>";
    }).join("");
    $$("[data-inq]", box).forEach(function (sel) {
      sel.addEventListener("change", function () {
        var id = Number(sel.getAttribute("data-inq"));
        api("PATCH", "/admin/inquiries/" + id, { status: sel.value }).then(function (d) {
          var i = state.inquiries.findIndex(function (x) { return x.id === id; });
          state.inquiries[i] = d.inquiry;
          updateBadge();
          toast("تم تحديث حالة الطلب");
          viewInquiries($("#view"));
        }, fail);
      });
    });
    $$("[data-inq-del]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = Number(b.getAttribute("data-inq-del"));
        confirmBox("حذف هذا الطلب نهائياً؟", "حذف", true).then(function (ok) {
          if (!ok) return;
          api("DELETE", "/admin/inquiries/" + id).then(function () {
            state.inquiries = state.inquiries.filter(function (x) { return x.id !== id; });
            updateBadge();
            toast("تم حذف الطلب");
            viewInquiries($("#view"));
          }, fail);
        });
      });
    });
  }

  /* ---------- الوسطاء ---------- */
  function viewAgents(view) {
    view.innerHTML =
      '<div class="admin-head"><div><h1>الوسطاء</h1><p>يظهر الوسطاء في صفحة «الوسطاء» وفي صفحة كل عقار مسؤولين عنه.</p></div>' +
        '<div class="head-actions"><button type="button" class="btn btn-primary" id="agent-add">' + icon("plus") + "إضافة وسيط</button></div></div>" +
      (state.agents.length ? '<div class="agent-grid">' + state.agents.map(function (a) {
        var n = state.listings.filter(function (l) { return l.agent === a.id; }).length;
        return '<article class="agent-card">' +
          '<div class="agent"><span class="avatar" aria-hidden="true">' + esc(initials(a.name)) + "</span><div><strong>" + esc(a.name) + "</strong><span>" + esc(a.role || "") + "</span></div></div>" +
          '<ul class="agent-meta">' +
            "<li>" + icon("pin") + "<span>" + esc((a.govs || []).map(govName).join("، ") || "كل المحافظات") + "</span></li>" +
            (a.phone ? "<li>" + icon("phone") + '<bdi dir="ltr">' + esc(a.phone) + "</bdi></li>" : "") +
            "<li>" + icon("layers") + "<span>" + n + " عقار</span></li>" +
          "</ul>" +
          '<div class="agent-actions"><button type="button" class="btn btn-ghost btn-sm" data-agent-edit="' + a.id + '">' + icon("edit") + "تعديل</button>" +
          '<button type="button" class="btn btn-danger btn-sm" data-agent-del="' + a.id + '">' + icon("trash") + "حذف</button></div>" +
        "</article>";
      }).join("") + "</div>" : '<div class="panel empty"><h3>لا يوجد وسطاء بعد</h3></div>');
    $("#agent-add").addEventListener("click", function () { agentDialog(null); });
    $$("[data-agent-edit]", view).forEach(function (b) {
      b.addEventListener("click", function () { agentDialog(state.agents.find(function (a) { return a.id === Number(b.getAttribute("data-agent-edit")); })); });
    });
    $$("[data-agent-del]", view).forEach(function (b) {
      b.addEventListener("click", function () {
        var a = state.agents.find(function (x) { return x.id === Number(b.getAttribute("data-agent-del")); });
        confirmBox("حذف الوسيط «" + a.name + "»؟", "حذف", true).then(function (ok) {
          if (!ok) return;
          api("DELETE", "/admin/agents/" + a.id).then(function () {
            state.agents = state.agents.filter(function (x) { return x.id !== a.id; });
            toast("تم حذف الوسيط");
            viewAgents(view);
          }, fail);
        });
      });
    });
  }

  function agentDialog(a) {
    a = a || { name: "", role: "", languages: "العربية", phone: "", whatsapp: "", email: "", govs: [] };
    modalRoot.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ag-title"><form class="modal-card wide" id="agent-form" novalidate>' +
        '<h2 id="ag-title">' + (a.id ? "تعديل الوسيط" : "إضافة وسيط") + "</h2>" +
        '<div class="form-grid">' +
          field("name", "الاسم", '<input id="f-name" name="name" maxlength="80" value="' + esc(a.name) + '">') +
          field("role", "المسمى الوظيفي", '<input id="f-role" name="role" maxlength="80" value="' + esc(a.role) + '" placeholder="وسيط عقاري">') +
          field("phone", "الهاتف (اختياري)", '<input id="f-phone" name="phone" dir="ltr" maxlength="30" value="' + esc(a.phone) + '" placeholder="+963 9xx xxx xxx">') +
          field("whatsapp", "واتساب (اختياري)", '<input id="f-whatsapp" name="whatsapp" dir="ltr" maxlength="20" value="' + esc(a.whatsapp) + '" placeholder="9639xxxxxxxx">') +
          field("email", "البريد الإلكتروني (اختياري)", '<input id="f-aemail" name="email" type="email" dir="ltr" maxlength="120" value="' + esc(a.email || "") + '">', "", "f-aemail") +
          field("languages", "اللغات", '<input id="f-languages" name="languages" maxlength="120" value="' + esc(a.languages) + '">') +
          '<fieldset class="fieldset span-2"><legend>المحافظات التي يغطيها</legend><div class="gov-checks">' +
            state.ref.governorates.map(function (g) {
              return '<label class="check"><input type="checkbox" name="govs" value="' + g.id + '"' + ((a.govs || []).indexOf(g.id) !== -1 ? " checked" : "") + "> " + g.name + "</label>";
            }).join("") +
          "</div></fieldset>" +
          '<p class="form-note span-2">إذا تركت الهاتف وواتساب فارغين، يُستخدم رقم الشركة. البريد لا يظهر في الموقع، ويُستخدم لإرسال طلبات المعاينة للوسيط إذا فعّلت ذلك في الإعدادات.</p>' +
        "</div>" +
        '<div class="modal-actions"><button type="submit" class="btn btn-primary">حفظ</button><button type="button" class="btn btn-ghost" data-cancel>إلغاء</button></div>' +
      "</form></div>";
    var form = $("#agent-form");
    $("#f-name").focus();
    function close() { modalRoot.innerHTML = ""; }
    $("[data-cancel]", form).addEventListener("click", close);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var body = {
        name: form.elements.name.value, role: form.elements.role.value, phone: form.elements.phone.value, whatsapp: form.elements.whatsapp.value,
        email: form.elements.email.value, languages: form.elements.languages.value,
        govs: $$('input[name="govs"]:checked', form).map(function (c) { return c.value; })
      };
      api(a.id ? "PUT" : "POST", "/admin/agents" + (a.id ? "/" + a.id : ""), body).then(function (d) {
        var i = state.agents.findIndex(function (x) { return x.id === d.agent.id; });
        if (i === -1) state.agents.push(d.agent); else state.agents[i] = d.agent;
        close();
        toast("تم حفظ الوسيط");
        viewAgents($("#view"));
      }).catch(function (e) { if (e.status === 400) showErrors(form, e.errors); else fail(e); });
    });
  }

  /* ---------- الإعدادات ---------- */
  function viewSettings(view) {
    var s = state.settings;
    var offices = (s.offices || []).slice();
    var govOpts = state.ref.governorates.map(function (g) { return [g.id, g.name]; });
    var text = function (name, label, val, attrs, cls) {
      return field(name, label, '<input id="f-' + name + '" name="' + name + '" value="' + esc(val || "") + '" ' + (attrs || "") + ">", cls);
    };
    view.innerHTML =
      '<div class="admin-head"><div><h1>الإعدادات</h1><p>تظهر هذه البيانات في كل صفحات الموقع.</p></div></div>' +
      '<form id="settings-form" novalidate style="display:grid; gap:1.25rem">' +
        '<section class="panel"><h2>بيانات الشركة</h2><div class="form-grid">' +
          text("companyName", "اسم الشركة", s.companyName, 'maxlength="80"') +
          text("tagline", "الوصف المختصر تحت الاسم", s.tagline, 'maxlength="80"') +
          text("slogan", "العبارة في أعلى الصفحة", s.slogan, 'maxlength="160"', "span-2") +
          text("phone", "الهاتف", s.phone, 'dir="ltr" maxlength="30"') +
          text("whatsapp", "رقم واتساب (بالصيغة الدولية بدون +)", s.whatsapp, 'dir="ltr" maxlength="20" placeholder="9639xxxxxxxx"') +
          text("email", "البريد الإلكتروني", s.email, 'type="email" dir="ltr" maxlength="120"') +
          text("workingHours", "ساعات العمل", s.workingHours, 'maxlength="120"') +
          text("address", "العنوان الرئيسي", s.address, 'maxlength="160"', "span-2") +
        "</div></section>" +
        '<section class="panel"><div class="panel-head"><h2>المكاتب</h2><button type="button" class="btn btn-ghost btn-sm" id="office-add">' + icon("plus") + "إضافة مكتب</button></div><div id=\"offices\"></div></section>" +
        '<section class="panel"><h2>روابط التواصل الاجتماعي</h2><div class="form-grid">' +
          ["facebook", "instagram", "telegram"].map(function (k) {
            return field("social." + k, { facebook: "فيسبوك", instagram: "إنستغرام", telegram: "تلغرام" }[k], '<input id="f-social.' + k + '" name="social.' + k + '" dir="ltr" maxlength="300" placeholder="https://" value="' + esc((s.social || {})[k] || "") + '">');
          }).join("") +
        "</div></section>" +
        '<section class="panel" id="notify"><h2>إشعارات البريد الإلكتروني</h2><div style="display:grid; gap:1rem">' +
          '<p class="notice" id="notify-status"></p>' +
          '<label class="check"><input type="checkbox" name="notifyEnabled"' + (s.notifyEnabled ? " checked" : "") + "> أرسل بريداً عند وصول طلب جديد من الموقع</label>" +
          field("notifyEmails", "العناوين التي تستلم الإشعارات (عنوان في كل سطر، حتى 10)", '<textarea id="f-notifyEmails" name="notifyEmails" rows="3" dir="ltr" placeholder="office@example.com">' + esc((s.notifyEmails || []).join("\n")) + "</textarea>") +
          '<label class="check"><input type="checkbox" name="notifyAgent"' + (s.notifyAgent !== false ? " checked" : "") + "> أرسل طلبات المعاينة أيضاً إلى الوسيط المسؤول عن العقار (إذا كان له بريد)</label>" +
          '<div><button type="button" class="btn btn-ghost" id="notify-test">' + icon("chat") + "إرسال بريد تجريبي إلى هذه العناوين</button></div>" +
        "</div></section>" +
        '<section class="panel" id="currency"><h2>العملة وسعر الصرف</h2><div class="form-grid">' +
          field("usdRate", "سعر صرف الدولار: كم ليرة سورية تساوي 1 دولار", '<input id="f-usdRate" name="usdRate" type="number" min="0" step="0.01" inputmode="decimal" dir="ltr" placeholder="122" value="' + (Number(s.usdRate) > 0 ? esc(s.usdRate) : "") + '">') +
          field("displayCurrency", "العملة التي يرى بها الزائر الأسعار أولاً", '<select id="f-displayCurrency" name="displayCurrency">' + options([["USD", "دولار أمريكي ($)"], ["SYP", "ليرة سورية (ل.س)"]], s.displayCurrency || "USD") + "</select>") +
          field("defaultCurrency", "العملة الافتراضية للعقارات الجديدة", '<select id="f-defaultCurrency" name="defaultCurrency">' + options([["USD", "دولار أمريكي ($)"], ["SYP", "ليرة سورية (ل.س)"]], s.defaultCurrency) + "</select>") +
          '<div class="span-2 form-note" style="display:grid; gap:0.3rem">' +
            '<p id="rate-info"><strong>' + esc(rateInfo()) + "</strong></p>" +
            "<p>اكتب السعر بالليرة السورية الجديدة (منذ 1 كانون الثاني 2026 حُذف صفران: 12,200 ليرة قديمة = 122 ليرة جديدة). يظهر للزائر زر للتبديل بين $ و ل.س، والأسعار المحوّلة تظهر مع علامة ≈ ومعها السعر المعلن. اترك الحقل فارغاً لإخفاء التحويل.</p>" +
          "</div>" +
        "</div></section>" +
        '<section class="panel"><h2>العرض</h2><div style="display:grid; gap:1rem">' +
          '<label class="check"><input type="checkbox" name="showSampleNotice"' + (s.showSampleNotice ? " checked" : "") + "> إظهار ملاحظة «العقارات المعروضة أمثلة توضيحية» في أسفل الموقع</label>" +
        "</div></section>" +
        '<div><button type="submit" class="btn btn-primary">' + icon("check") + "حفظ الإعدادات</button></div>" +
      "</form>" +
      '<section class="panel"><div class="panel-head"><h2>المستخدمون</h2></div><div id="users"></div>' +
        '<form id="user-form" class="form-grid" novalidate style="margin-top:1rem">' +
          field("username", "اسم المستخدم الجديد (بالإنكليزية)", '<input id="f-username" name="username" dir="ltr" autocomplete="off" maxlength="40">') +
          field("name", "الاسم الظاهر", '<input id="f-uname" name="name" maxlength="80">', "", "f-uname") +
          field("password", "كلمة المرور (10 أحرف على الأقل)", '<input id="f-upass" name="password" type="password" dir="ltr" autocomplete="new-password">', "span-2", "f-upass") +
          '<div class="span-2"><button type="submit" class="btn btn-ghost">' + icon("plus") + "إضافة مستخدم</button></div>" +
        "</form></section>" +
      '<section class="panel"><h2>تغيير كلمة المرور</h2><form id="pw-form" class="form-grid" novalidate>' +
        field("current", "كلمة المرور الحالية", '<input id="f-current" name="current" type="password" dir="ltr" autocomplete="current-password">') +
        field("password", "كلمة المرور الجديدة (10 أحرف على الأقل)", '<input id="f-newpw" name="password" type="password" dir="ltr" autocomplete="new-password">', "", "f-newpw") +
        '<div class="span-2"><button type="submit" class="btn btn-ghost">تغيير كلمة المرور</button></div>' +
      "</form></section>";

    function renderOffices() {
      $("#offices").innerHTML = offices.length ? offices.map(function (o, i) {
        return '<div class="office-row">' +
          '<div class="field"><label for="of-name-' + i + '">اسم المكتب</label><input id="of-name-' + i + '" data-of="' + i + '" data-k="name" maxlength="80" value="' + esc(o.name) + '"></div>' +
          '<div class="field"><label for="of-address-' + i + '">العنوان</label><input id="of-address-' + i + '" data-of="' + i + '" data-k="address" maxlength="160" value="' + esc(o.address) + '"></div>' +
          '<div class="field"><label for="of-gov-' + i + '">المحافظة</label><select id="of-gov-' + i + '" data-of="' + i + '" data-k="gov">' + options(govOpts, o.gov, "—") + "</select></div>" +
          '<button type="button" class="btn btn-danger btn-sm" data-of-del="' + i + '" aria-label="حذف المكتب">' + icon("trash") + "</button>" +
        "</div>";
      }).join("") : '<p class="muted">لا توجد مكاتب. أضف مكتباً ليظهر في صفحة «اتصل بنا».</p>';
    }
    renderOffices();
    $("#offices").addEventListener("input", function (ev) {
      var t = ev.target;
      if (t.hasAttribute("data-of")) offices[Number(t.getAttribute("data-of"))][t.getAttribute("data-k")] = t.value;
    });
    $("#offices").addEventListener("change", function (ev) {
      var t = ev.target;
      if (t.hasAttribute("data-of")) offices[Number(t.getAttribute("data-of"))][t.getAttribute("data-k")] = t.value;
    });
    $("#offices").addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-of-del]");
      if (!b) return;
      offices.splice(Number(b.getAttribute("data-of-del")), 1);
      renderOffices();
    });
    $("#office-add").addEventListener("click", function () { offices.push({ name: "", address: "", gov: "" }); renderOffices(); });

    var n = state.notify;
    $("#notify-status").classList.toggle("ok", !!n.configured);
    $("#notify-status").innerHTML = n.configured
      ? icon("check") + " خادم البريد مضبوط" + (n.server && n.server !== "console" ? " (" + esc(n.server) + ")" : n.server === "console" ? " (وضع التجربة: تُطبع الرسائل في طرفية الخادم)" : "") + "." +
        (n.siteUrl ? "" : " أضف SITE_URL في ملف ‎.env لتظهر روابط العقار ولوحة التحكم داخل الرسائل.")
      : icon("alert") + " خادم البريد (SMTP) غير مضبوط بعد. أضف إعداداته في ملف <code>.env</code> على الخادم (انظر <code>.env.example</code>) ثم أعد تشغيل الموقع.";

    var sf = $("#settings-form");
    $("#notify-test").addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      api("POST", "/admin/notify/test", { to: sf.elements.notifyEmails.value }).then(function (d) {
        showErrors(sf, {});
        toast("أُرسلت رسالة تجريبية إلى " + d.to.join("، "));
      }).catch(function (e) {
        if (e.status === 400) showErrors(sf, e.errors); else fail(e);
      }).then(function () { btn.disabled = false; });
    });
    sf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = sf.elements;
      var body = {
        companyName: f.companyName.value, tagline: f.tagline.value, slogan: f.slogan.value, phone: f.phone.value,
        whatsapp: f.whatsapp.value, email: f.email.value, workingHours: f.workingHours.value, address: f.address.value,
        defaultCurrency: f.defaultCurrency.value, displayCurrency: f.displayCurrency.value, usdRate: f.usdRate.value,
        showSampleNotice: f.showSampleNotice.checked, offices: offices,
        notifyEnabled: f.notifyEnabled.checked, notifyAgent: f.notifyAgent.checked, notifyEmails: f.notifyEmails.value,
        social: { facebook: f["social.facebook"].value, instagram: f["social.instagram"].value, telegram: f["social.telegram"].value }
      };
      api("PUT", "/admin/settings", body).then(function (d) {
        state.settings = d.settings;
        showErrors(sf, {});
        $("#rate-info").innerHTML = "<strong>" + esc(rateInfo()) + "</strong>";
        $$(".brand-name").forEach(function (el) { el.textContent = d.settings.companyName; });
        toast("تم حفظ الإعدادات");
      }).catch(function (e) { if (e.status === 400) showErrors(sf, e.errors); else fail(e); });
    });

    function renderUsers() {
      $("#users").innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>المستخدم</th><th>الاسم</th><th>آخر دخول</th><th></th></tr></thead><tbody>' +
        state.users.map(function (u) {
          return '<tr><td dir="ltr" style="text-align:start">' + esc(u.username) + "</td><td>" + esc(u.name) + "</td><td>" + (u.lastLogin ? fmtDate(u.lastLogin, true) : "—") + "</td>" +
            '<td class="c-actions">' + (u.id === state.user.id ? '<span class="muted small">أنت</span>' : '<button type="button" class="btn btn-danger btn-sm" data-user-del="' + u.id + '">' + icon("trash") + "حذف</button>") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      $$("[data-user-del]").forEach(function (b) {
        b.addEventListener("click", function () {
          var u = state.users.find(function (x) { return x.id === Number(b.getAttribute("data-user-del")); });
          confirmBox("حذف المستخدم «" + u.username + "»؟ لن يتمكن من الدخول بعد الآن.", "حذف", true).then(function (ok) {
            if (!ok) return;
            api("DELETE", "/admin/users/" + u.id).then(function () {
              state.users = state.users.filter(function (x) { return x.id !== u.id; });
              renderUsers(); toast("تم حذف المستخدم");
            }, fail);
          });
        });
      });
    }
    renderUsers();
    var uf = $("#user-form");
    uf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var e = uf.elements;
      api("POST", "/admin/users", { username: e.username.value, name: e.name.value, password: e.password.value }).then(function (d) {
        state.users.push(d.user); uf.reset(); showErrors(uf, {}); renderUsers(); toast("تمت إضافة المستخدم");
      }).catch(function (e) { if (e.status === 400) showErrors(uf, e.errors); else fail(e); });
    });
    var pf = $("#pw-form");
    pf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      api("POST", "/admin/password", { current: pf.elements.current.value, password: pf.elements.password.value }).then(function () {
        pf.reset(); showErrors(pf, {}); toast("تم تغيير كلمة المرور. سُجّل الخروج من الأجهزة الأخرى.");
      }).catch(function (e) {
        if (e.status === 400) {
            showErrors(pf, e.errors);
        } else fail(e);
      });
    });
  }

  /* ---------- البدء ---------- */
  api("GET", "/admin/me").then(function (d) { state.user = d.user; return start(); }).catch(function (e) {
    if (e.status === 401 || e.status === 404 || e.status === 0) renderLogin();
    else renderLogin(e.message);
  });
})();
