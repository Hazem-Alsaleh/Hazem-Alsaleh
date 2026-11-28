"use strict";
/*
 * Innlogging for administrasjonspanelet.
 * - Passord lagres som scrypt-hash med tilfeldig salt (aldri i klartekst).
 * - Økter: tilfeldig token i en httpOnly-cookie; bare SHA-256 av tokenet lagres på serveren.
 * - Enkel begrensning av mislykkede innlogginger per IP.
 */
const crypto = require("crypto");

const COOKIE = "aqar_admin";
const SESSION_DAYS = 14;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return "scrypt$" + salt.toString("hex") + "$" + hash.toString("hex");
}

function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const actual = crypto.scryptSync(String(password), salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

function parseCookies(header) {
  const out = {};
  (header || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < 10) return "كلمة المرور يجب أن تتكون من 10 أحرف على الأقل";
  if (pw.length > 200) return "كلمة المرور طويلة جداً";
  return null;
}

const DUMMY_HASH = hashPassword("dummy-password-for-timing");

function createAuth(store, options) {
  const secureCookie = !!(options && options.secureCookie);
  // mislykkede innlogginger: per IP + brukernavn (8 forsøk) og per IP (30 forsøk), i 15 minutter.
  // Nøkkelen med brukernavn gjør at én angriper bak samme proxy ikke kan stenge ute alle andre.
  const failures = new Map(); // key -> { count, until }
  const WINDOW = 15 * 60e3;

  /* Secure-flagget settes når siden kjøres over https (direkte eller via proxy med TRUST_PROXY) */
  function cookieFlags(req) { return "; Path=/; HttpOnly; SameSite=Lax" + (secureCookie || req.secure ? "; Secure" : ""); }

  function cleanSessions() {
    const now = Date.now();
    const all = store.read("sessions", []);
    const alive = all.filter((s) => s.expires > now);
    if (alive.length !== all.length) store.write("sessions", alive);
    return alive;
  }

  function startSession(req, res, user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + SESSION_DAYS * 864e5;
    const sessions = cleanSessions();
    sessions.push({ hash: sha256(token), userId: user.id, expires });
    store.write("sessions", sessions);
    res.setHeader("Set-Cookie", COOKIE + "=" + token + cookieFlags(req) + "; Max-Age=" + SESSION_DAYS * 86400);
  }

  function endSession(req, res) {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (token) {
      const h = sha256(token);
      store.write("sessions", store.read("sessions", []).filter((s) => s.hash !== h));
    }
    res.setHeader("Set-Cookie", COOKIE + "=" + cookieFlags(req) + "; Max-Age=0");
  }

  function endAllSessionsFor(userId, exceptHash) {
    store.write("sessions", store.read("sessions", []).filter((s) => s.userId !== userId || s.hash === exceptHash));
  }

  function currentUser(req) {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (!token) return null;
    const h = sha256(token);
    const s = store.read("sessions", []).find((x) => x.hash === h && x.expires > Date.now());
    if (!s) return null;
    const user = store.get("users", s.userId);
    if (!user) return null;
    req.sessionHash = h;
    return user;
  }

  /* Middleware: krever innlogging + egen header mot CSRF (skjemaer fra andre nettsteder kan ikke sette den) */
  function requireAdmin(req, res, next) {
    if (req.method !== "GET" && req.get("X-Requested-With") !== "aqar-admin") {
      return res.status(403).json({ error: "طلب غير مسموح" });
    }
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: "يجب تسجيل الدخول" });
    req.user = user;
    next();
  }

  function blocked(key, max) {
    const f = failures.get(key);
    return !!(f && f.count >= max && f.until > Date.now());
  }
  function bump(key) {
    const now = Date.now();
    const f = failures.get(key);
    if (!f || f.until < now) failures.set(key, { count: 1, until: now + WINDOW });
    else f.count++;
    if (failures.size > 5000) failures.forEach((v, k) => { if (v.until < now) failures.delete(k); });
  }

  function login(req, res) {
    if (req.get("X-Requested-With") !== "aqar-admin") return res.status(403).json({ error: "طلب غير مسموح" });
    const ip = req.ip;
    const username = String((req.body && req.body.username) || "").trim().toLowerCase().slice(0, 80);
    const userKey = "u:" + ip + ":" + username;
    if (blocked(userKey, 8) || blocked("ip:" + ip, 30)) return res.status(429).json({ error: "محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة." });
    const password = String((req.body && req.body.password) || "");
    const user = store.list("users").find((u) => u.username === username);
    // نحسب الهاش حتى لو لم يوجد المستخدم حتى لا يكشف التوقيت وجوده
    const ok = verifyPassword(password, user ? user.password : DUMMY_HASH);
    if (!user || !ok) {
      bump(userKey);
      bump("ip:" + ip);
      return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
    failures.delete(userKey);
    startSession(req, res, user);
    store.update("users", user.id, { lastLogin: new Date().toISOString() });
    res.json({ user: publicUser(user) });
  }

  return { requireAdmin, login, endSession, endAllSessionsFor, currentUser };
}

function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name || u.username, lastLogin: u.lastLogin || null, createdAt: u.createdAt };
}

module.exports = { createAuth, hashPassword, verifyPassword, validatePassword, publicUser };
