"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createApp } = require("../app");
const { hashPassword } = require("../lib/auth");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aqar-test-"));
const app = createApp({ dataDir: path.join(tmp, "data"), uploadsDir: path.join(tmp, "uploads") });
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

test("logout ends the session", async () => {
  await call("POST", "/api/admin/logout");
  assert.strictEqual((await call("GET", "/api/admin/me")).status, 401);
});
