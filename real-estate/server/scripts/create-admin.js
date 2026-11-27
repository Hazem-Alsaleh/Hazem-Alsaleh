"use strict";
/* Oppretter en administrator, eller gir en eksisterende bruker nytt passord: npm run create-admin */
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { Store } = require("../lib/store");
const { hashPassword, validatePassword } = require("../lib/auth");

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, "..", "..", "data");
const store = new Store(dataDir);

function makeAsker() {
  if (!process.stdin.isTTY) {
    // input fra pipe/fil: les alle linjene på en gang
    const lines = fs.readFileSync(0, "utf8").split(/\r?\n/);
    let i = 0;
    return { ask: (q) => { process.stdout.write(q + "\n"); return Promise.resolve(lines[i++] || ""); }, close() {} };
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  rl._writeToOutput = (s) => {
    if (!muted) return rl.output.write(s);
    if (/[\r\n]/.test(s)) rl.output.write("\n");
    else rl.output.write("*");
  };
  return {
    ask: (q, hidden) => new Promise((resolve) => {
      muted = false;
      rl.question(q, (a) => { muted = false; resolve(a); });
      muted = !!hidden;
    }),
    close: () => rl.close()
  };
}

(async () => {
  const io = makeAsker();
  const username = (await io.ask("اسم المستخدم (بالإنكليزية): ")).trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) { console.error("اسم مستخدم غير صالح: استخدم 3–40 حرفاً إنكليزياً أو أرقاماً أو . _ -"); process.exit(1); }
  const name = (await io.ask("الاسم الظاهر (اختياري): ")).trim().slice(0, 80);
  const pw = await io.ask("كلمة المرور (10 أحرف على الأقل): ", true);
  const err = validatePassword(pw);
  if (err) { console.error(err); process.exit(1); }
  const pw2 = await io.ask("أعد كتابة كلمة المرور: ", true);
  io.close();
  if (pw !== pw2) { console.error("كلمتا المرور غير متطابقتين."); process.exit(1); }

  const existing = store.list("users").find((u) => u.username === username);
  if (existing) {
    store.update("users", existing.id, { password: hashPassword(pw) });
    store.write("sessions", store.read("sessions", []).filter((s) => s.userId !== existing.id));
    console.log("تم تغيير كلمة مرور المستخدم " + username);
  } else {
    store.insert("users", { username, name, password: hashPassword(pw), createdAt: new Date().toISOString() });
    console.log("تم إنشاء المستخدم " + username + ". سجّل الدخول من /admin/");
  }
})();
