"use strict";
/*
 * Start: npm start
 * Miljøvariabler (valgfrie):
 *   PORT=3000            port serveren lytter på
 *   HOST=0.0.0.0         adresse
 *   DATA_DIR=./data      hvor JSON-dataene lagres
 *   UPLOADS_DIR=./uploads hvor opplastede bilder lagres
 *   COOKIE_SECURE=1      sett når siden kjøres over https (anbefalt i produksjon)
 *   TRUST_PROXY=1        sett når serveren står bak nginx/Caddy/annen proxy
 *   SITE_URL=https://…   nettsidens adresse, brukes i lenkene i e-postvarslene
 *   SMTP_* / MAIL_FROM   e-postvarsel, se .env.example
 * Variablene kan også skrives i filen real-estate/.env
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

/* Leser real-estate/.env (NØKKEL=verdi per linje) uten å overstyre variabler som allerede er satt */
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) return;
    let v = m[2];
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  });
}

const { createApp } = require("./app");
const app = createApp({
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, "data"),
  uploadsDir: process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(root, "uploads"),
  secureCookie: process.env.COOKIE_SECURE === "1",
  trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false,
  siteUrl: process.env.SITE_URL || ""
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log("الموقع يعمل على http://localhost:" + port);
  console.log("لوحة التحكم: http://localhost:" + port + "/admin/");
  const mail = process.env.MAIL_LOG === "1" ? "تُطبع في الطرفية (MAIL_LOG=1)" : process.env.SMTP_HOST ? "عبر " + process.env.SMTP_HOST : "غير مفعّلة (لم يُضبط SMTP_HOST)";
  console.log("إشعارات البريد: " + mail);
  if (!app.locals.store.list("users").length) {
    console.log("\nلا يوجد مستخدم بعد. أنشئ حساب المدير بالأمر:  npm run create-admin\n");
  }
});
