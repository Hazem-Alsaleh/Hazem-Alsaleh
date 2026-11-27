"use strict";
/* Kontroll av data som sendes fra administrasjonspanelet og skjemaene på nettsiden. */
const { reference } = require("./seed");

const STATUSES = ["published", "draft", "sold", "rented"];
const IMAGE_RE = /^(uploads\/[a-f0-9]{24}\.(jpg|png|webp)|[a-z0-9-]{1,40})$/;

function str(v, max) {
  if (v == null) return "";
  return String(v).replace(/\u0000/g, "").trim().slice(0, max);
}
function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function bool(v) { return v === true || v === "true" || v === 1 || v === "1" || v === "on"; }

function govById(id) { return reference.governorates.find((g) => g.id === id) || null; }

function validateListing(input, ctx) {
  const e = {};
  const out = {};
  input = input || {};

  out.deal = input.deal === "rent" ? "rent" : input.deal === "sale" ? "sale" : "";
  if (!out.deal) e.deal = "اختر نوع العرض";

  out.type = str(input.type, 30);
  if (!reference.propertyTypes[out.type]) e.type = "اختر نوع العقار";

  out.title = str(input.title, 120);
  if (out.title.length < 3) e.title = "اكتب عنواناً من 3 أحرف على الأقل";

  out.status = STATUSES.includes(input.status) ? input.status : "draft";
  out.featured = bool(input.featured);

  out.gov = str(input.gov, 30);
  const g = govById(out.gov);
  if (!g) e.gov = "اختر المحافظة";
  out.place = str(input.place, 80);
  if (g && !g.places.includes(out.place)) e.place = g.id === "damascus" ? "اختر الحي" : "اختر المدينة أو البلدة";
  out.district = str(input.district, 60);

  out.price = num(input.price);
  if (!(out.price > 0) || out.price > 1e13) e.price = "أدخل سعراً صحيحاً";
  out.currency = input.currency === "SYP" ? "SYP" : "USD";
  if (out.deal === "rent") out.rentPeriod = input.rentPeriod === "year" ? "year" : "month";
  out.negotiable = bool(input.negotiable);

  out.size = num(input.size);
  if (!(out.size > 0) || out.size > 1e7) e.size = "أدخل المساحة بالمتر المربع";
  const land = num(input.land);
  if (land !== null && (isNaN(land) || land < 0 || land > 1e8)) e.land = "مساحة الأرض غير صحيحة";
  else if (land) out.land = land;

  [["rooms", 0, 50], ["baths", 0, 50]].forEach(([k, min, max]) => {
    const n = num(input[k]);
    if (n === null) { out[k] = 0; return; }
    if (isNaN(n) || n < min || n > max || !Number.isInteger(n)) e[k] = "رقم غير صحيح";
    else out[k] = n;
  });
  [["floor", -5, 200], ["totalFloors", 0, 200], ["year", 1000, new Date().getFullYear() + 5]].forEach(([k, min, max]) => {
    const n = num(input[k]);
    if (n === null) return;
    if (isNaN(n) || n < min || n > max || !Number.isInteger(n)) e[k] = "رقم غير صحيح";
    else out[k] = n;
  });

  out.finish = reference.finishLevels.includes(input.finish) ? input.finish : "";
  out.direction = reference.directions.includes(input.direction) ? input.direction : "";
  out.ownership = reference.ownershipTypes.includes(input.ownership) ? input.ownership : "";
  out.furnished = bool(input.furnished);

  const feats = Array.isArray(input.features) ? input.features : [];
  out.features = [...new Set(feats.map((f) => str(f, 60)).filter(Boolean))].slice(0, 40);

  out.description = str(input.description, 5000);

  const imgs = Array.isArray(input.images) ? input.images : [];
  out.images = [...new Set(imgs.map((x) => String(x)).filter((x) => IMAGE_RE.test(x)))].slice(0, 30);
  if (out.status === "published" && !out.images.length) e.images = "أضف صورة واحدة على الأقل قبل النشر";

  const agentId = num(input.agent);
  if (agentId && ctx && ctx.agentExists(agentId)) out.agent = agentId;
  else out.agent = null;

  return { value: out, errors: e, ok: Object.keys(e).length === 0 };
}

function validateAgent(input) {
  const e = {};
  input = input || {};
  const out = {
    name: str(input.name, 80),
    role: str(input.role, 80),
    languages: str(input.languages, 120),
    phone: str(input.phone, 30),
    whatsapp: str(input.whatsapp, 20).replace(/\D/g, ""),
    govs: (Array.isArray(input.govs) ? input.govs : []).filter((id) => govById(id))
  };
  if (out.name.length < 2) e.name = "اكتب اسم الوسيط";
  if (out.phone && !/^[+\d\s()-]{6,30}$/.test(out.phone)) e.phone = "رقم الهاتف غير صحيح";
  const rawWa = str(input.whatsapp, 30);
  if ((rawWa && !/^[+\d\s()-]+$/.test(rawWa)) || (out.whatsapp && (out.whatsapp.length < 8 || out.whatsapp.length > 15))) e.whatsapp = "اكتب رقم واتساب بالصيغة الدولية، مثل 9639xxxxxxxx";
  return { value: out, errors: e, ok: Object.keys(e).length === 0 };
}

function url(v) {
  const s = str(v, 300);
  if (!s) return "";
  return /^https:\/\/[^\s<>"']+$/.test(s) ? s : null;
}

function validateSettings(input) {
  const e = {};
  input = input || {};
  const out = {
    companyName: str(input.companyName, 80),
    tagline: str(input.tagline, 80),
    slogan: str(input.slogan, 160),
    phone: str(input.phone, 30),
    whatsapp: str(input.whatsapp, 20).replace(/\D/g, ""),
    email: str(input.email, 120),
    address: str(input.address, 160),
    workingHours: str(input.workingHours, 120),
    defaultCurrency: input.defaultCurrency === "SYP" ? "SYP" : "USD",
    showSampleNotice: bool(input.showSampleNotice),
    offices: (Array.isArray(input.offices) ? input.offices : []).slice(0, 20).map((o) => ({
      name: str(o && o.name, 80), address: str(o && o.address, 160), gov: govById(o && o.gov) ? o.gov : ""
    })).filter((o) => o.name),
    social: {}
  };
  if (!out.companyName) e.companyName = "اكتب اسم الشركة";
  if (out.phone && !/^[+\d\s()-]{6,30}$/.test(out.phone)) e.phone = "رقم الهاتف غير صحيح";
  const rawWa = str(input.whatsapp, 30);
  if ((rawWa && !/^[+\d\s()-]+$/.test(rawWa)) || (out.whatsapp && (out.whatsapp.length < 8 || out.whatsapp.length > 15))) e.whatsapp = "اكتب رقم واتساب بالصيغة الدولية، مثل 9639xxxxxxxx";
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) e.email = "البريد الإلكتروني غير صحيح";
  ["facebook", "instagram", "telegram"].forEach((k) => {
    const u = url(input.social && input.social[k]);
    if (u === null) e["social." + k] = "يجب أن يبدأ الرابط بـ https://";
    else out.social[k] = u;
  });
  return { value: out, errors: e, ok: Object.keys(e).length === 0 };
}

const INQUIRY_KINDS = ["valuation", "viewing", "contact", "sell"];

function validateInquiry(input) {
  const e = {};
  input = input || {};
  const out = {
    kind: INQUIRY_KINDS.includes(input.kind) ? input.kind : "contact",
    name: str(input.name, 100),
    phone: str(input.phone, 30),
    fields: (Array.isArray(input.fields) ? input.fields : []).slice(0, 20)
      .filter((p) => Array.isArray(p) && p.length === 2)
      .map((p) => [str(p[0], 60), str(p[1], 2000)])
      .filter((p) => p[0] && p[1])
  };
  const lid = num(input.listingId);
  if (lid && Number.isInteger(lid)) out.listingId = lid;
  if (!out.name) e.name = "الاسم مطلوب";
  if (!/^[+\d\s()-]{6,30}$/.test(out.phone)) e.phone = "رقم الهاتف غير صحيح";
  return { value: out, errors: e, ok: Object.keys(e).length === 0 };
}

module.exports = { validateListing, validateAgent, validateSettings, validateInquiry, STATUSES, INQUIRY_KINDS };
