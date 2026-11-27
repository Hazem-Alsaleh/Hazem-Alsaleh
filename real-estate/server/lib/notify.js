"use strict";
/* E-postvarsel når en henvendelse kommer inn fra nettsiden. Selve e-posten er på arabisk. */
const { reference } = require("./seed");

const SUBJECT = {
  valuation: "طلب تقييم جديد",
  viewing: "طلب معاينة جديد",
  contact: "رسالة جديدة",
  sell: "طلب جديد لعرض عقار"
};
const TYPES = reference.propertyTypes;

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function oneLine(s, max) { return String(s || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max || 150); }
function fmtNum(n) { return Number(n).toLocaleString("en-US"); }
function waNumber(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "963" + d.slice(1);
  else if (d.length === 9 && d.startsWith("9")) d = "963" + d;
  return d;
}
function govName(id) { const g = reference.governorates.find((x) => x.id === id); return g ? g.name : ""; }
function locationOf(l) {
  const place = l.place === "مركز جبل سمعان (حلب)" ? "حلب" : l.place;
  const parts = [l.district, place, govName(l.gov)].filter(Boolean);
  return parts.filter((p, i) => parts.indexOf(p) === i).join("، ");
}
function priceOf(l) {
  let a = l.currency === "SYP" ? fmtNum(l.price) + " ل.س" : "$" + fmtNum(l.price);
  if (l.deal === "rent") a += l.rentPeriod === "year" ? " سنوياً" : " شهرياً";
  return a;
}

/* Mottakere: adressene fra innstillingene + megleren for boligen (hvis slått på) */
function recipientsFor(settings, agent) {
  if (!settings.notifyEnabled) return [];
  const list = (settings.notifyEmails || []).slice();
  if (settings.notifyAgent && agent && agent.email) list.push(agent.email);
  const seen = new Set();
  return list.filter((e) => {
    const k = String(e).toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function layout(title, bodyHtml, company) {
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f2f6f4;font-family:Tahoma,Arial,sans-serif;color:#12201b;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f6f4;padding:24px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="max-width:560px;background:#ffffff;border:1px solid #dce5e0;border-radius:12px;">' +
    '<tr><td style="background:#0d5443;color:#ffffff;padding:18px 22px;font-size:18px;font-weight:bold;text-align:right;border-radius:12px 12px 0 0;">' + esc(title) + "</td></tr>" +
    '<tr><td style="padding:20px 22px;text-align:right;font-size:15px;line-height:1.7;">' + bodyHtml + "</td></tr>" +
    '<tr><td style="padding:14px 22px;background:#f7f9f8;color:#586a62;font-size:12px;text-align:right;border-radius:0 0 12px 12px;">' +
    "أُرسلت هذه الرسالة تلقائياً من موقع " + esc(company) + ".</td></tr>" +
    "</table></td></tr></table></body></html>";
}

function buildInquiryEmail(inq, ctx) {
  const settings = ctx.settings || {};
  const listing = ctx.listing || null;
  const siteUrl = ctx.siteUrl || "";
  const company = settings.companyName || "";
  const title = SUBJECT[inq.kind] || SUBJECT.contact;
  const subject = oneLine(title + ": " + inq.name + (listing ? " — العقار #" + listing.id : ""), 150);
  const wa = waNumber(inq.phone);
  const rows = [["الاسم", inq.name], ["الهاتف", inq.phone, "ltr"]].concat(inq.fields || []);

  const text = [
    title,
    "",
    ...rows.map((r) => r[0] + ": " + r[1]),
    listing ? "\nالعقار: #" + listing.id + " — " + listing.title + " (" + locationOf(listing) + ") — " + priceOf(listing) : "",
    listing && siteUrl ? siteUrl + "/property.html?id=" + listing.id : "",
    wa ? "\nواتساب: https://wa.me/" + wa : "",
    siteUrl ? "\nلوحة التحكم: " + siteUrl + "/admin/#/inquiries" : "\nافتح لوحة التحكم لمتابعة الطلب.",
  ].filter((x) => x !== "").join("\n");

  let body =
    '<p style="margin:0 0 4px;font-size:20px;font-weight:bold;">' + esc(inq.name) + "</p>" +
    '<p style="margin:0 0 18px;"><a href="tel:' + esc(String(inq.phone).replace(/\s+/g, "")) + '" style="color:#0d5443;" dir="ltr">' + esc(inq.phone) + "</a>" +
    (wa ? ' &nbsp;·&nbsp; <a href="https://wa.me/' + wa + '" style="color:#1f9d55;font-weight:bold;">واتساب</a>' : "") + "</p>";
  if (listing) {
    body += '<div style="margin:0 0 18px;padding:12px 14px;background:#e2efe9;border-radius:8px;">' +
      '<div style="font-size:13px;color:#586a62;">العقار المطلوب</div>' +
      '<div style="font-weight:bold;">#' + listing.id + " — " + esc(listing.title) + "</div>" +
      "<div>" + esc((TYPES[listing.type] || "") + " · " + locationOf(listing)) + ' · <span dir="ltr">' + esc(priceOf(listing)) + "</span></div>" +
      (siteUrl ? '<div style="margin-top:6px;"><a href="' + esc(siteUrl + "/property.html?id=" + listing.id) + '" style="color:#0d5443;">عرض العقار في الموقع</a></div>' : "") +
      "</div>";
  }
  body += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px;">' +
    rows.map((r) =>
      '<tr><td style="padding:8px 0 8px 16px;color:#586a62;border-bottom:1px solid #eef2f0;white-space:nowrap;vertical-align:top;text-align:right;">' + esc(r[0]) + "</td>" +
      '<td style="padding:8px 0;border-bottom:1px solid #eef2f0;text-align:right;">' +
        (r[2] ? '<span dir="ltr" style="unicode-bidi:embed;">' + esc(r[1]) + "</span>" : esc(r[1]).replace(/\r?\n/g, "<br>")) + "</td></tr>"
    ).join("") + "</table>";
  body += siteUrl
    ? '<p style="margin:22px 0 0;"><a href="' + esc(siteUrl + "/admin/#/inquiries") + '" style="display:inline-block;background:#0d5443;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:bold;">فتح الطلب في لوحة التحكم</a></p>'
    : '<p style="margin:22px 0 0;color:#586a62;">افتح لوحة التحكم لمتابعة الطلب.</p>';

  return { subject, text, html: layout(title, body, company) };
}

function buildTestEmail(settings) {
  const company = settings.companyName || "";
  const title = "رسالة تجريبية";
  return {
    subject: "رسالة تجريبية من لوحة تحكم " + oneLine(company, 80),
    text: "إشعارات البريد تعمل. ستصلك رسالة مثل هذه عند وصول طلب جديد من الموقع.",
    html: layout(title, "<p style=\"margin:0;\">إشعارات البريد تعمل. ستصلك رسالة مثل هذه عند وصول طلب جديد من الموقع.</p>", company)
  };
}

module.exports = { buildInquiryEmail, buildTestEmail, recipientsFor };
