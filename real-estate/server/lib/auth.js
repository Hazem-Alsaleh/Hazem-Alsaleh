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
  const failures = new Map(); // ip -> { count, until }

  function cleanSessions() {
    const now = Date.now();
    const all = store.read("sessions", []);
    const alive = all.filter((s) => s.expires > now);
    if (alive.length !== all.length) store.write("sessions", alive);
    return alive;
  }

  function startSession(res, user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + SESSION_DAYS * 864e5;
    const sessions = cleanSessions();
    sessions.push({ hash: sha256(token), userId: user.id, expires });
    store.write("sessions", sessions);
    res.setHeader("Set-Cookie", COOKIE + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + SESSION_DAYS * 86400 + (secureCookie ? "; Secure" : ""));
  }

  function endSession(req, res) {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (token) {
      const h = sha256(token);
      store.write("sessions", store.read("sessions", []).filter((s) => s.hash !== h));
    }
    res.setHeader("Set-Cookie", COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + (secureCookie ? "; Secure" : ""));
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

  function tooManyFailures(ip) {
    const f = failures.get(ip);
    return f && f.count >= 8 && f.until > Date.now();
  }
  function recordFailure(ip) {
    const f = failures.get(ip);
    if (!f || f.until < Date.now()) failures.set(ip, { count: 1, until: Date.now() + 15 * 60e3 });
    else f.count++;
  }

  function login(req, res) {
    if (req.get("X-Requested-With") !== "aqar-admin") return res.status(403).json({ error: "طلب غير مسموح" });
    const ip = req.ip;
    if (tooManyFailures(ip)) return res.status(429).json({ error: "محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة." });
    const username = String((req.body && req.body.username) || "").trim().toLowerCase();
    const password = String((req.body && req.body.password) || "");
    const user = store.list("users").find((u) => u.username === username);
    // نحسب الهاش حتى لو لم يوجد المستخدم حتى لا يكشف التوقيت وجوده
    const ok = verifyPassword(password, user ? user.password : DUMMY_HASH);
    if (!user || !ok) {
      recordFailure(ip);
      return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
    failures.delete(ip);
    startSession(res, user);
    store.update("users", user.id, { lastLogin: new Date().toISOString() });
    res.json({ user: publicUser(user) });
  }

  return { requireAdmin, login, endSession, endAllSessionsFor, currentUser };
}

function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name || u.username, lastLogin: u.lastLogin || null, createdAt: u.createdAt };
}

module.exports = { createAuth, hashPassword, verifyPassword, validatePassword, publicUser };
