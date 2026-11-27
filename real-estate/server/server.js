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
 */
const path = require("path");
const { createApp } = require("./app");

const root = path.join(__dirname, "..");
const app = createApp({
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, "data"),
  uploadsDir: process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(root, "uploads"),
  secureCookie: process.env.COOKIE_SECURE === "1",
  trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log("الموقع يعمل على http://localhost:" + port);
  console.log("لوحة التحكم: http://localhost:" + port + "/admin/");
  if (!app.locals.store.list("users").length) {
    console.log("\nلا يوجد مستخدم بعد. أنشئ حساب المدير بالأمر:  npm run create-admin\n");
  }
});
