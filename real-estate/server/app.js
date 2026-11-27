"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");

const { Store } = require("./lib/store");
const { reference, seedData, ROOT } = require("./lib/seed");
const { createAuth, hashPassword, verifyPassword, validatePassword, publicUser } = require("./lib/auth");
const { validateListing, validateAgent, validateSettings, validateInquiry, parseEmails } = require("./lib/validate");
const { createMailer } = require("./lib/mailer");
const { buildInquiryEmail, buildTestEmail, recipientsFor } = require("./lib/notify");

const PUBLIC_SETTINGS = ["companyName", "tagline", "slogan", "phone", "whatsapp", "email", "address", "workingHours", "offices", "social", "defaultCurrency", "showSampleNotice"];
const SETTINGS_DEFAULTS = { notifyEnabled: false, notifyAgent: true, notifyEmails: [] };

const PUBLIC_PAGES = ["index.html", "properties.html", "property.html", "sale.html", "rent.html", "sell.html", "agents.html", "contact.html"];
const IMAGE_TYPES = {
  "image/jpeg": { ext: "jpg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", check: (b) => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", check: (b) => b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP" }
};

function createApp(options) {
  options = options || {};
  const dataDir = options.dataDir || path.join(ROOT, "data");
  const uploadsDir = options.uploadsDir || path.join(ROOT, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const store = new Store(dataDir);

  /* Startdata første gang */
  if (!store.exists("listings")) {
    const seed = seedData();
    store.write("settings", seed.settings);
    store.write("agents", seed.agents);
    store.write("listings", seed.listings);
  }
  if (!store.exists("inquiries")) store.write("inquiries", []);
  if (!store.exists("users")) store.write("users", []);

  const auth = createAuth(store, { secureCookie: options.secureCookie });
  const mailer = options.mailer || createMailer(process.env);
  // adressen nettsiden har utad, brukes i lenkene i e-postene (aldri hentet fra forespørselen)
  const siteUrl = /^https?:\/\/[^\s"'<>]+$/.test(options.siteUrl || "") ? options.siteUrl.replace(/\/+$/, "") : "";
  const app = express();
  app.disable("x-powered-by");
  if (options.trustProxy) app.set("trust proxy", options.trustProxy);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  const json = express.json({ limit: "200kb" });

  /* ---------- hjelpefunksjoner ---------- */
  const settings = () => Object.assign({}, SETTINGS_DEFAULTS, store.read("settings", {}));
  const publicSettings = () => {
    const s = settings(), out = {};
    PUBLIC_SETTINGS.forEach((k) => { if (k in s) out[k] = s[k]; });
    return out;
  };
  const agentExists = (id) => !!store.get("agents", id);
  const today = () => new Date().toISOString().slice(0, 10);

  function publicListing(l) {
    const { status, createdAt, updatedAt, ...rest } = l;
    return rest;
  }
  function publicAgent(a) {
    return { id: a.id, name: a.name, role: a.role, govs: a.govs, languages: a.languages, phone: a.phone || "", whatsapp: a.whatsapp || "" };
  }
  function referencedImages() {
    const set = new Set();
    store.list("listings").forEach((l) => (l.images || []).forEach((i) => set.add(i)));
    return set;
  }
  function deleteUnusedUploads(candidates) {
    const used = referencedImages();
    candidates.forEach((img) => {
      if (!img.startsWith("uploads/") || used.has(img)) return;
      const f = path.join(uploadsDir, path.basename(img));
      fs.rm(f, { force: true }, () => {});
    });
  }
  /* e-postvarsel sendes i bakgrunnen; resultatet lagres på henvendelsen (sent / failed / off) */
  function notifyInquiry(inq) {
    const s = settings();
    const listing = inq.listingId ? store.get("listings", inq.listingId) : null;
    const agent = listing && listing.agent ? store.get("agents", listing.agent) : null;
    const to = recipientsFor(s, agent);
    if (!to.length || !mailer.configured) {
      store.update("inquiries", inq.id, { email: "off" });
      return Promise.resolve("off");
    }
    const msg = buildInquiryEmail(inq, { settings: s, listing, siteUrl });
    return mailer.send(Object.assign({ to }, msg)).then(
      () => { store.update("inquiries", inq.id, { email: "sent" }); return "sent"; },
      (err) => {
        console.error("تعذّر إرسال إشعار البريد للطلب #" + inq.id + ": " + (err && err.message));
        store.update("inquiries", inq.id, { email: "failed" });
        return "failed";
      }
    );
  }
  app.locals.notifyInquiry = notifyInquiry;

  function bad(res, errors) { return res.status(400).json({ error: "تحقق من الحقول المحددة", errors }); }

  /* ---------- offentlig API ---------- */
  app.get("/api/public/data", (req, res) => {
    const s = publicSettings();
    const listings = store.list("listings").filter((l) => l.status === "published").map(publicListing);
    res.setHeader("Cache-Control", "no-store");
    res.json({ settings: s, listings, agents: store.list("agents").map(publicAgent) });
  });

  const inquiryHits = new Map();
  app.post("/api/public/inquiries", json, (req, res) => {
    // enkel spam-beskyttelse: skjult felt + maks 10 henvendelser per time per IP
    if (req.body && req.body.website) return res.json({ ok: true });
    const now = Date.now();
    const hits = (inquiryHits.get(req.ip) || []).filter((t) => now - t < 3600e3);
    if (hits.length >= 10) return res.status(429).json({ error: "أرسلت طلبات كثيرة. حاول لاحقاً أو تواصل عبر واتساب." });
    hits.push(now);
    inquiryHits.set(req.ip, hits);

    const v = validateInquiry(req.body);
    if (!v.ok) return bad(res, v.errors);
    if (v.value.listingId && !store.get("listings", v.value.listingId)) delete v.value.listingId;
    const row = store.insert("inquiries", Object.assign(v.value, { status: "new", createdAt: new Date().toISOString() }));
    res.status(201).json({ ok: true, id: row.id });
    notifyInquiry(row);
  });

  /* ---------- innlogging ---------- */
  app.post("/api/admin/login", json, auth.login);
  app.post("/api/admin/logout", (req, res) => { auth.endSession(req, res); res.json({ ok: true }); });
  app.get("/api/admin/setup-status", (req, res) => res.json({ hasUsers: store.list("users").length > 0 }));

  const admin = express.Router();
  admin.use(auth.requireAdmin);
  admin.use(json);

  admin.get("/me", (req, res) => res.json({ user: publicUser(req.user) }));
  admin.get("/reference", (req, res) => res.json(reference));

  /* boliger */
  admin.get("/listings", (req, res) => {
    const rows = store.list("listings").slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    res.json({ listings: rows });
  });
  admin.get("/listings/:id", (req, res) => {
    const l = store.get("listings", req.params.id);
    if (!l) return res.status(404).json({ error: "العقار غير موجود" });
    res.json({ listing: l });
  });
  admin.post("/listings", (req, res) => {
    const v = validateListing(req.body, { agentExists });
    if (!v.ok) return bad(res, v.errors);
    const now = new Date().toISOString();
    const row = store.insert("listings", Object.assign(v.value, { date: today(), createdAt: now, updatedAt: now }));
    res.status(201).json({ listing: row });
  });
  admin.put("/listings/:id", (req, res) => {
    const old = store.get("listings", req.params.id);
    if (!old) return res.status(404).json({ error: "العقار غير موجود" });
    const v = validateListing(req.body, { agentExists });
    if (!v.ok) return bad(res, v.errors);
    const row = Object.assign({ id: old.id, date: old.date, createdAt: old.createdAt }, v.value, { updatedAt: new Date().toISOString() });
    const all = store.list("listings").map((x) => (x.id === old.id ? row : x));
    store.write("listings", all);
    deleteUnusedUploads(old.images || []);
    res.json({ listing: row });
  });
  admin.patch("/listings/:id", (req, res) => {
    // hurtigendring fra listen: status og «مميز»
    const old = store.get("listings", req.params.id);
    if (!old) return res.status(404).json({ error: "العقار غير موجود" });
    const patch = {};
    if (req.body && typeof req.body.featured === "boolean") patch.featured = req.body.featured;
    if (req.body && ["published", "draft", "sold", "rented"].includes(req.body.status)) {
      if (req.body.status === "published" && !(old.images || []).length) return bad(res, { images: "أضف صورة واحدة على الأقل قبل النشر" });
      patch.status = req.body.status;
    }
    patch.updatedAt = new Date().toISOString();
    res.json({ listing: store.update("listings", old.id, patch) });
  });
  admin.delete("/listings/:id", (req, res) => {
    const old = store.get("listings", req.params.id);
    if (!old) return res.status(404).json({ error: "العقار غير موجود" });
    store.remove("listings", old.id);
    deleteUnusedUploads(old.images || []);
    res.json({ ok: true });
  });

  /* bilder: rå bildedata i body (bildet er allerede forminsket i nettleseren) */
  admin.post("/uploads", express.raw({ type: Object.keys(IMAGE_TYPES), limit: "6mb" }), (req, res) => {
    const t = IMAGE_TYPES[(req.get("Content-Type") || "").split(";")[0]];
    if (!t || !Buffer.isBuffer(req.body) || req.body.length < 100 || !t.check(req.body)) {
      return res.status(400).json({ error: "الملف ليس صورة مدعومة (JPG أو PNG أو WebP)" });
    }
    const name = crypto.randomBytes(12).toString("hex") + "." + t.ext;
    fs.writeFileSync(path.join(uploadsDir, name), req.body);
    res.status(201).json({ path: "uploads/" + name });
  });

  /* meglere */
  admin.get("/agents", (req, res) => res.json({ agents: store.list("agents") }));
  admin.post("/agents", (req, res) => {
    const v = validateAgent(req.body);
    if (!v.ok) return bad(res, v.errors);
    res.status(201).json({ agent: store.insert("agents", v.value) });
  });
  admin.put("/agents/:id", (req, res) => {
    if (!store.get("agents", req.params.id)) return res.status(404).json({ error: "الوسيط غير موجود" });
    const v = validateAgent(req.body);
    if (!v.ok) return bad(res, v.errors);
    res.json({ agent: store.update("agents", req.params.id, v.value) });
  });
  admin.delete("/agents/:id", (req, res) => {
    const id = Number(req.params.id);
    const n = store.list("listings").filter((l) => l.agent === id).length;
    if (n) return res.status(409).json({ error: "هذا الوسيط مسؤول عن " + n + " عقار. انقلها إلى وسيط آخر أولاً." });
    if (!store.remove("agents", id)) return res.status(404).json({ error: "الوسيط غير موجود" });
    res.json({ ok: true });
  });

  /* henvendelser */
  admin.get("/inquiries", (req, res) => {
    const rows = store.list("inquiries").slice().sort((a, b) => b.id - a.id);
    res.json({ inquiries: rows });
  });
  admin.patch("/inquiries/:id", (req, res) => {
    const st = req.body && req.body.status;
    if (!["new", "in-progress", "done"].includes(st)) return bad(res, { status: "حالة غير صحيحة" });
    const row = store.update("inquiries", req.params.id, { status: st });
    if (!row) return res.status(404).json({ error: "الطلب غير موجود" });
    res.json({ inquiry: row });
  });
  admin.delete("/inquiries/:id", (req, res) => {
    if (!store.remove("inquiries", req.params.id)) return res.status(404).json({ error: "الطلب غير موجود" });
    res.json({ ok: true });
  });

  /* innstillinger */
  admin.get("/settings", (req, res) => res.json({ settings: settings() }));
  admin.get("/notify/status", (req, res) => {
    res.json({ configured: mailer.configured, server: mailer.server, from: mailer.from || "", siteUrl });
  });
  admin.post("/notify/test", (req, res) => {
    const parsed = parseEmails(req.body && req.body.to);
    if (parsed.bad.length) return bad(res, { notifyEmails: "عناوين غير صحيحة: " + parsed.bad.join("، ") });
    if (!parsed.ok.length) return bad(res, { notifyEmails: "اكتب بريداً واحداً على الأقل" });
    if (!mailer.configured) return res.status(409).json({ error: "لم تُضبط إعدادات خادم البريد (SMTP) على الخادم بعد. راجع ملف ‎.env" });
    mailer.send(Object.assign({ to: parsed.ok.slice(0, 10) }, buildTestEmail(settings())))
      .then(() => res.json({ ok: true, to: parsed.ok.slice(0, 10) }))
      .catch((err) => res.status(502).json({ error: "تعذّر الإرسال: " + ((err && err.message) || "خطأ غير معروف") }));
  });
  admin.put("/settings", (req, res) => {
    const v = validateSettings(req.body);
    if (!v.ok) return bad(res, v.errors);
    res.json({ settings: store.write("settings", v.value) });
  });

  /* brukere */
  admin.get("/users", (req, res) => res.json({ users: store.list("users").map(publicUser) }));
  admin.post("/users", (req, res) => {
    const username = String((req.body && req.body.username) || "").trim().toLowerCase();
    const name = String((req.body && req.body.name) || "").trim().slice(0, 80);
    const errors = {};
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) errors.username = "استخدم 3–40 حرفاً إنكليزياً أو أرقاماً أو . _ -";
    else if (store.list("users").some((u) => u.username === username)) errors.username = "اسم المستخدم موجود مسبقاً";
    const pwErr = validatePassword(req.body && req.body.password);
    if (pwErr) errors.password = pwErr;
    if (Object.keys(errors).length) return bad(res, errors);
    const row = store.insert("users", { username, name, password: hashPassword(req.body.password), createdAt: new Date().toISOString() });
    res.status(201).json({ user: publicUser(row) });
  });
  admin.delete("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: "لا يمكنك حذف حسابك الحالي" });
    if (!store.remove("users", id)) return res.status(404).json({ error: "المستخدم غير موجود" });
    auth.endAllSessionsFor(id);
    res.json({ ok: true });
  });
  admin.post("/password", (req, res) => {
    const current = req.body && req.body.current;
    const next = req.body && req.body.password;
    if (!verifyPassword(current, req.user.password)) return bad(res, { current: "كلمة المرور الحالية غير صحيحة" });
    const pwErr = validatePassword(next);
    if (pwErr) return bad(res, { password: pwErr });
    store.update("users", req.user.id, { password: hashPassword(next) });
    auth.endAllSessionsFor(req.user.id, req.sessionHash);
    res.json({ ok: true });
  });

  app.use("/api/admin", admin);
  app.use("/api", (req, res) => res.status(404).json({ error: "غير موجود" }));

  /* ---------- statiske filer (bare nettsiden, aldri data/ eller server/) ---------- */
  const staticOpts = { index: false, dotfiles: "deny", maxAge: "1h" };
  app.use("/assets", express.static(path.join(ROOT, "assets"), staticOpts));
  app.use("/uploads", express.static(uploadsDir, Object.assign({}, staticOpts, { maxAge: "30d" })));
  app.use("/admin", express.static(path.join(ROOT, "admin"), { index: "index.html", dotfiles: "deny" }));
  app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
  app.get("/:page", (req, res, next) => {
    if (!PUBLIC_PAGES.includes(req.params.page)) return next();
    res.sendFile(path.join(ROOT, req.params.page));
  });
  app.use((req, res) => {
    res.status(404).type("html").send('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>الصفحة غير موجودة</title><body style="font-family:system-ui,sans-serif;text-align:center;padding:4rem 1rem"><h1>الصفحة غير موجودة</h1><p><a href="/">العودة إلى الصفحة الرئيسية</a></p></body></html>');
  });

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err && err.type === "entity.too.large") return res.status(413).json({ error: "الملف أو الطلب كبير جداً" });
    if (err && err.type === "entity.parse.failed") return res.status(400).json({ error: "بيانات غير صالحة" });
    console.error(err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  });

  app.locals.store = store;
  return app;
}

module.exports = { createApp };
