"use strict";
/*
 * Setter firmanavn og Open Graph-tagger i HTML-sidene før de sendes.
 * Det gir pen forhåndsvisning (bilde, tittel, pris) når en bolig deles på WhatsApp, Facebook eller Telegram,
 * og riktige titler for søkemotorer. Alle verdier escapes før de settes inn.
 */
const { reference } = require("./seed");

function escAttr(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function oneLine(s, max) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, max || 200); }
function fmtNum(n) { return Number(n).toLocaleString("en-US"); }

const TYPES = reference.propertyTypes;
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
function imagePath(name) {
  if (!name) return "";
  return name.indexOf("/") !== -1 ? name : "assets/img/" + name + ".jpg";
}

/* meta: { title, description, image (relativ sti), path (relativ sti), type } */
function renderPage(html, meta, ctx) {
  const company = oneLine(ctx.companyName || "", 80);
  const siteUrl = ctx.siteUrl || "";
  let out = html.replace(/اسم الشركة/g, escAttr(company));
  if (meta.title) out = out.replace(/<title>[^<]*<\/title>/, "<title>" + escAttr(meta.title) + "</title>");
  if (meta.description) out = out.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escAttr(meta.description) + '">');

  const titleMatch = out.match(/<title>([^<]*)<\/title>/);
  const descMatch = out.match(/<meta name="description" content="([^"]*)">/);
  const tags = [
    ["og:type", meta.type || "website"],
    ["og:site_name", company],
    ["og:locale", "ar_SY"],
    ["og:title", titleMatch ? titleMatch[1] : ""],
    ["og:description", descMatch ? descMatch[1] : ""]
  ];
  // Absolutte adresser krever SITE_URL (adressen hentes aldri fra forespørselen)
  if (siteUrl) {
    if (meta.path) tags.push(["og:url", siteUrl + "/" + meta.path]);
    if (meta.image) tags.push(["og:image", siteUrl + "/" + meta.image]);
  }
  const html2 = tags.filter((t) => t[1]).map((t) => '<meta property="' + t[0] + '" content="' + (t[0] === "og:title" || t[0] === "og:description" ? t[1] : escAttr(t[1])) + '">').join("\n") +
    '\n<meta name="twitter:card" content="' + (siteUrl && meta.image ? "summary_large_image" : "summary") + '">\n';
  return out.replace("</head>", html2 + "</head>");
}

function listingMeta(l, company) {
  const deal = l.deal === "rent" ? "للإيجار" : "للبيع";
  return {
    type: "article",
    title: oneLine(l.title, 120) + " | " + oneLine(company, 80),
    description: oneLine([TYPES[l.type] + " " + deal, locationOf(l), priceOf(l), l.size ? fmtNum(l.size) + " م²" : ""].filter(Boolean).join(" · ") + ". " + (l.description || ""), 200),
    image: imagePath((l.images || [])[0]),
    path: "property.html?id=" + l.id
  };
}

module.exports = { renderPage, listingMeta, imagePath };
