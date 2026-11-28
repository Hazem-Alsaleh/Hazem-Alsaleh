#!/usr/bin/env node
/*
 * Lager kartdataene i assets/map/ fra datamappen i «syria-atlas»-pakken.
 *
 *   node tools/build-map-data.js /sti/til/syria-atlas/data
 *
 * Kilder (må krediteres på kartsiden):
 *   - Grenser for provinser og underdistrikter (نواحي): OCHA COD-AB, CC BY 3.0 IGO
 *   - Stedsregister: OCHA, OpenSyria og GeoNames, CC BY 3.0 IGO / CC BY 4.0
 *   - Nabolandene: Natural Earth (fritt brukbart)
 * Skriptet beholder bare arabiske navn, runder koordinatene til fire desimaler (omtrent 11 m)
 * og legger til omtrentlige punkter for bydelene i Damaskus, som ikke finnes i stedsregisteret.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(path.join(SRC, "index.json"))) {
  console.error("Bruk: node tools/build-map-data.js /sti/til/syria-atlas/data");
  process.exit(1);
}
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "map");
fs.mkdirSync(path.join(OUT, "gov"), { recursive: true });

const CODE_TO_ID = {
  SY01: "damascus", SY02: "aleppo", SY03: "rif-dimashq", SY04: "homs", SY05: "hama", SY06: "latakia", SY07: "idlib",
  SY08: "hasakah", SY09: "deir-ez-zor", SY10: "tartus", SY11: "raqqa", SY12: "daraa", SY13: "as-suwayda", SY14: "quneitra"
};
const KIND = { city: 0, town: 1, locality: 2, neighborhood: 3 };
const CONTEXT_AR = { Turkey: "تركيا", Iraq: "العراق", Jordan: "الأردن", Lebanon: "لبنان" };

// Omtrentlige punkter for bydelene i Damaskus (stedsregisteret har bare byen som helhet).
const DAMASCUS = {
  "المزة": [33.5005, 36.2455], "الميدان": [33.4895, 36.2985], "ساروجة": [33.5160, 36.3010], "أبو رمانة": [33.5170, 36.2870],
  "المالكي": [33.5185, 36.2780], "الشعلان": [33.5140, 36.2905], "الصالحية": [33.5235, 36.2930], "المهاجرين": [33.5295, 36.2775],
  "ركن الدين": [33.5365, 36.3030], "كفرسوسة": [33.4990, 36.2700], "المزرعة": [33.5245, 36.3050], "القصاع": [33.5165, 36.3175],
  "باب توما": [33.5140, 36.3155], "باب شرقي": [33.5090, 36.3175], "الشاغور": [33.5040, 36.3075], "القنوات": [33.5070, 36.2975],
  "البرامكة": [33.5085, 36.2880], "الحلبوني": [33.5150, 36.2960], "العمارة": [33.5150, 36.3085], "شارع بغداد": [33.5210, 36.3075],
  "الجسر الأبيض": [33.5205, 36.2850], "المجتهد": [33.5010, 36.2950], "الزاهرة": [33.4870, 36.3050], "دمر": [33.5390, 36.2240],
  "مشروع دمر": [33.5300, 36.2270], "الربوة": [33.5180, 36.2600], "برزة": [33.5525, 36.3220], "القابون": [33.5435, 36.3350],
  "جوبر": [33.5230, 36.3350], "القدم": [33.4630, 36.2820], "باب مصلى": [33.4960, 36.3010], "التضامن": [33.4800, 36.3110]
};

const r4 = (n) => Math.round(n * 1e4) / 1e4;
const readJSON = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
// GeoJSON-koordinater [lon, lat] -> [lat, lon] med fire desimaler, uten like punkter etter hverandre.
function geom(g) {
  const polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
  return polys.map((poly) => poly.map((ring) => {
    const out = [];
    for (const [x, y] of ring) {
      const p = [r4(y), r4(x)];
      const last = out[out.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
    }
    return out;
  }).filter((ring) => ring.length >= 4));
}
const norm = (s) => String(s || "")
  .replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
  .replace(/\s*-\s*.*$/, "").replace(/^مركز\s+/, "").replace(/\s+/g, " ").trim();
const loose = (s) => norm(s).replace(/(^|\s)ال/g, "$1").replace(/\s+/g, "");

const index = readJSON("index.json");
const ctx = readJSON("context.json");
const sitePlacesSrc = (() => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/js/locations.js"), "utf8"), sandbox);
  return sandbox.window.GOVERNORATES;
})();

const govs = [];
const search = [];
const sitePlaces = {};
let unmatched = [];

index.governorates.forEach((gf, gi) => {
  const p = gf.properties;
  const id = CODE_TO_ID[p.id];
  const file = readJSON(p.id + ".json");
  const subs = file.subs.map((sf, si) => {
    const sp = sf.properties;
    let places = (file.places[sp.id] || []).map((pl) => [pl[1] || pl[2], r4(pl[3]), r4(pl[4]), KIND[pl[5]] == null ? 2 : KIND[pl[5]]]);
    if (id === "damascus" && si === 0) {
      places = places.filter((pl) => pl[3] === 0).concat(Object.entries(DAMASCUS).map(([n, c]) => [n, c[0], c[1], 3]));
    }
    places.forEach((pl) => search.push([pl[0], gi, si, pl[1], pl[2], pl[3]]));
    return { id: sp.id, name: sp.ar, district: sp.district_ar || "", center: [r4(sp.center[0]), r4(sp.center[1])], shape: sp.shape, geom: geom(sf.geometry), places };
  });
  fs.writeFileSync(path.join(OUT, "gov", id + ".json"), JSON.stringify({ id, subs }));

  // Koordinater for stedene som brukes i boligene (locations.js)
  const byName = new Map(), byLoose = new Map();
  subs.forEach((s) => s.places.forEach((pl) => {
    const a = norm(pl[0]), b = loose(pl[0]);
    if (!byName.has(a) || pl[3] < byName.get(a)[3]) byName.set(a, pl);
    if (!byLoose.has(b) || pl[3] < byLoose.get(b)[3]) byLoose.set(b, pl);
  }));
  subs.forEach((s) => { const a = norm(s.name); if (!byName.has(a)) byName.set(a, [s.name, s.center[0], s.center[1], 1]); });
  const site = sitePlacesSrc.find((g) => g.id === id);
  sitePlaces[id] = {};
  site.places.forEach((name) => {
    const alts = [name].concat((name.match(/\(([^)]+)\)/) || [])[1] ? [name.match(/\(([^)]+)\)/)[1]] : []).map((n) => n.replace(/\s*\(.*\)/, ""));
    let hit = null;
    for (const n of alts) { hit = byName.get(norm(n)) || byLoose.get(loose(n)); if (hit) break; }
    if (hit) sitePlaces[id][name] = [hit[1], hit[2]];
    else unmatched.push(id + ": " + name);
  });

  govs.push({ id, name: p.ar, center: [r4(p.center[0]), r4(p.center[1])], shape: p.shape, subs: subs.length, places: subs.reduce((n, s) => n + s.places.length, 0), geom: geom(gf.geometry) });
});

const context = ctx.features.filter((f) => f.properties.name !== "Syria").map((f) => ({ name: CONTEXT_AR[f.properties.name] || "", geom: geom(f.geometry) }));
fs.writeFileSync(path.join(OUT, "syria.json"), JSON.stringify({ outline: geom(index.country.geometry), govs, context, sitePlaces }));
fs.writeFileSync(path.join(OUT, "places.json"), JSON.stringify(search));

const size = (f) => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + " KB";
console.log("syria.json", size("syria.json"), "· places.json", size("places.json"), "(" + search.length + " steder)");
console.log("Steder i boligdataene uten koordinater (" + unmatched.length + "), vises ved provinsens midtpunkt:");
console.log("  " + unmatched.join("\n  "));
