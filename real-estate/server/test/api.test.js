"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createApp } = require("../app");
const { hashPassword } = require("../lib/auth");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aqar-test-"));
const sent = [];
const fakeMailer = {
  configured: true, server: "test", from: "site@test", fail: false,
  send(msg) { if (this.fail) return Promise.reject(new Error("SMTP down")); sent.push(msg); return Promise.resolve({}); }
};
const app = createApp({ dataDir: path.join(tmp, "data"), uploadsDir: path.join(tmp, "uploads"), mailer: fakeMailer, siteUrl: "https://aqar.example/" });
const tick = () => new Promise((r) => setTimeout(r, 30));
app.locals.store.insert("users", { username: "admin", password: hashPassword("correct-horse-battery"), createdAt: new Date().toISOString() });

let server, base, cookie = "";
const H = { "Content-Type": "application/json", "X-Requested-With": "aqar-admin" };
async function call(method, url, body, headers) {
  const res = await fetch(base + url, {
    method, body: body === undefined ? undefined : (Buffer.isBuffer(body) ? body : JSON.stringify(body)),
    headers: Object.assign({}, H, cookie ? { Cookie: cookie } : {}, headers || {})
  });
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = sc.split(";")[0];
  let data = null;
  try { data = await res.json(); } catch (e) { /* ikke json */ }
  return { status: res.status, data };
}

test.before(() => new Promise((r) => { server = app.listen(0, () => { base = "http://127.0.0.1:" + server.address().port; r(); }); }));
test.after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("public data contains seeded published listings", async () => {
  const r = await call("GET", "/api/public/data");
  assert.strictEqual(r.status, 200);
  assert.ok(r.data.listings.length >= 20);
  assert.ok(!("status" in r.data.listings[0]));
  assert.strictEqual(typeof r.data.listings[0].agent, "number");
});

test("admin endpoints require login", async () => {
  assert.strictEqual((await call("GET", "/api/admin/listings")).status, 401);
});

test("state-changing requests without the admin header are refused", async () => {
  const r = await fetch(base + "/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: "correct-horse-battery" }) });
  assert.strictEqual(r.status, 403);
});

test("wrong password is rejected, right password logs in", async () => {
  assert.strictEqual((await call("POST", "/api/admin/login", { username: "admin", password: "nope" })).status, 401);
  const r = await call("POST", "/api/admin/login", { username: "admin", password: "correct-horse-battery" });
  assert.strictEqual(r.status, 200);
  assert.ok(cookie.startsWith("aqar_admin="));
  assert.strictEqual((await call("GET", "/api/admin/me")).data.user.username, "admin");
});

test("create, publish, update and delete a listing with an uploaded image", async () => {
  let r = await call("POST", "/api/admin/listings", { deal: "sale", type: "apartment", title: "x" , gov: "damascus", place: "نيويورك", price: 0, size: 0 });
  assert.strictEqual(r.status, 400);
  assert.ok(r.data.errors.title && r.data.errors.place && r.data.errors.price && r.data.errors.size);

  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200)]);
  r = await call("POST", "/api/admin/uploads", jpg, { "Content-Type": "image/jpeg" });
  assert.strictEqual(r.status, 201);
  const img = r.data.path;
  assert.match(img, /^uploads\/[a-f0-9]{24}\.jpg$/);
  assert.ok(fs.existsSync(path.join(tmp, "uploads", path.basename(img))));

  const bad = await call("POST", "/api/admin/uploads", Buffer.from("<script>alert(1)</script>".repeat(10)), { "Content-Type": "image/jpeg" });
  assert.strictEqual(bad.status, 400);

  r = await call("POST", "/api/admin/listings", {
    deal: "rent", type: "apartment", title: "شقة تجريبية", gov: "damascus", place: "المزة",
    price: 500, rentPeriod: "month", size: 120, rooms: 3, baths: 2, status: "published", images: [img, "../../etc/passwd"], features: ["مصعد", "مصعد"]
  });
  assert.strictEqual(r.status, 201);
  const id = r.data.listing.id;
  assert.deepStrictEqual(r.data.listing.images, [img]);
  assert.deepStrictEqual(r.data.listing.features, ["مصعد"]);

  const pub = await call("GET", "/api/public/data");
  assert.ok(pub.data.listings.some((l) => l.id === id));

  r = await call("PATCH", "/api/admin/listings/" + id, { status: "draft" });
  assert.strictEqual(r.data.listing.status, "draft");
  assert.ok(!(await call("GET", "/api/public/data")).data.listings.some((l) => l.id === id));

  r = await call("PUT", "/api/admin/listings/" + id, Object.assign({}, r.data.listing, { images: [] , status: "draft" }));
  assert.strictEqual(r.status, 200);
  await new Promise((res) => setTimeout(res, 50));
  assert.ok(!fs.existsSync(path.join(tmp, "uploads", path.basename(img))), "unused upload is removed");

  assert.strictEqual((await call("DELETE", "/api/admin/listings/" + id)).status, 200);
  assert.strictEqual((await call("GET", "/api/admin/listings/" + id)).status, 404);
});

test("public inquiry is stored and visible to admin", async () => {
  const saved = cookie; cookie = "";
  const r = await call("POST", "/api/public/inquiries", { kind: "viewing", listingId: 101, name: "أحمد", phone: "0999 123 456", fields: [["اليوم", "السبت"]] });
  assert.strictEqual(r.status, 201);
  cookie = saved;
  const list = await call("GET", "/api/admin/inquiries");
  assert.strictEqual(list.data.inquiries[0].name, "أحمد");
  assert.strictEqual(list.data.inquiries[0].status, "new");
});

test("agent with listings cannot be deleted", async () => {
  assert.strictEqual((await call("DELETE", "/api/admin/agents/1")).status, 409);
});

test("data and server files are not served", async () => {
  for (const u of ["/data/users.json", "/server/app.js", "/package.json", "/../data/users.json"]) {
    const r = await fetch(base + u);
    assert.strictEqual(r.status, 404, u);
  }
  assert.strictEqual((await fetch(base + "/properties.html")).status, 200);
  assert.strictEqual((await fetch(base + "/admin/")).status, 200);
  assert.strictEqual((await fetch(base + "/admin/admin.js")).status, 200);
});

test("email notifications for new inquiries", async () => {
  // standard: av, og e-postadressene er aldri offentlige
  let r = await call("GET", "/api/admin/settings");
  const base = r.data.settings;
  assert.strictEqual(base.notifyEnabled, false);

  r = await call("PUT", "/api/admin/settings", Object.assign({}, base, { notifyEnabled: true, notifyEmails: "" }));
  assert.strictEqual(r.status, 400, "enabled without recipients is rejected");
  r = await call("PUT", "/api/admin/settings", Object.assign({}, base, { notifyEnabled: true, notifyEmails: "office@aqar.example\nikke-en-adresse" }));
  assert.ok(r.data.errors.notifyEmails.includes("ikke-en-adresse"));
  r = await call("PUT", "/api/admin/settings", Object.assign({}, base, { notifyEnabled: true, notifyAgent: true, notifyEmails: "office@aqar.example, Office@aqar.example; boss@aqar.example" }));
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.data.settings.notifyEmails, ["office@aqar.example", "boss@aqar.example"]);

  const pub = await call("GET", "/api/public/data");
  assert.ok(!("notifyEmails" in pub.data.settings) && !("notifyEnabled" in pub.data.settings));

  // megleren for bolig 101 får også e-post; e-posten vises ikke offentlig
  const listing = (await call("GET", "/api/admin/listings/101")).data.listing;
  const agent = (await call("GET", "/api/admin/agents")).data.agents.find((a) => a.id === listing.agent);
  r = await call("PUT", "/api/admin/agents/" + agent.id, Object.assign({}, agent, { email: "agent@aqar.example" }));
  assert.strictEqual(r.status, 200);
  assert.ok(!("email" in (await call("GET", "/api/public/data")).data.agents[0]));

  const saved = cookie; cookie = "";
  sent.length = 0;
  r = await call("POST", "/api/public/inquiries", { kind: "viewing", listingId: 101, name: "<b>سامي</b>", phone: "0944 555 666", fields: [["ملاحظات", "سطر 1\nسطر 2"]] });
  assert.strictEqual(r.status, 201);
  await tick();
  assert.strictEqual(sent.length, 1);
  const m = sent[0];
  assert.deepStrictEqual(m.to, ["office@aqar.example", "boss@aqar.example", "agent@aqar.example"]);
  assert.match(m.subject, /^طلب معاينة جديد: <b>سامي<\/b> — العقار #101$/);
  assert.ok(!m.html.includes("<b>سامي</b>") && m.html.includes("&lt;b&gt;سامي&lt;/b&gt;"), "user input is escaped in html");
  assert.ok(m.html.includes("https://aqar.example/property.html?id=101") && m.html.includes("https://aqar.example/admin/#/inquiries"));
  assert.ok(m.html.includes("https://wa.me/963944555666"));
  assert.ok(m.text.includes("سطر 1\nسطر 2"));

  // feil hos e-posttjenesten lagres på henvendelsen
  fakeMailer.fail = true;
  r = await call("POST", "/api/public/inquiries", { kind: "contact", name: "ليلى", phone: "0933 111 222", fields: [] });
  await tick();
  fakeMailer.fail = false;
  cookie = saved;
  const list = (await call("GET", "/api/admin/inquiries")).data.inquiries;
  assert.strictEqual(list.find((q) => q.name === "ليلى").email, "failed");
  assert.strictEqual(list.find((q) => q.name === "<b>سامي</b>").email, "sent");

  // testknappen
  r = await call("POST", "/api/admin/notify/test", { to: "x" });
  assert.strictEqual(r.status, 400);
  sent.length = 0;
  r = await call("POST", "/api/admin/notify/test", { to: "office@aqar.example" });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual((await call("GET", "/api/admin/notify/status")).data.siteUrl, "https://aqar.example");

  // slått av: ingen e-post
  await call("PUT", "/api/admin/settings", Object.assign({}, base, { notifyEnabled: false, notifyEmails: "office@aqar.example" }));
  cookie = "";
  sent.length = 0;
  await call("POST", "/api/public/inquiries", { kind: "contact", name: "عمر", phone: "0933 111 333", fields: [] });
  await tick();
  assert.strictEqual(sent.length, 0);
  cookie = saved;
});

test("logout ends the session", async () => {
  await call("POST", "/api/admin/logout");
  assert.strictEqual((await call("GET", "/api/admin/me")).status, 401);
});
