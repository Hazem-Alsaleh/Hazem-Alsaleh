"use strict";
/*
 * Leser nettsidens egne JS-filer (config.js, locations.js, listings.js) i en isolert vm-kontekst.
 * Brukes til:
 *  - startdata første gang serveren kjøres (eksempelboliger, meglere, innstillinger)
 *  - lister over provinser/byer, boligtyper osv. til validering
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const JS = path.join(ROOT, "assets", "js");

function loadBrowserGlobals(files) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), sandbox, { filename: f });
  }
  return JSON.parse(JSON.stringify(sandbox.window));
}

const W = loadBrowserGlobals(["config.js", "locations.js", "listings.js"]);

const reference = {
  governorates: W.GOVERNORATES,
  propertyTypes: W.PROPERTY_TYPES,
  finishLevels: W.FINISH_LEVELS,
  ownershipTypes: W.OWNERSHIP_TYPES,
  directions: W.DIRECTIONS || [],
  commonFeatures: W.COMMON_FEATURES || []
};

function seedData() {
  const now = new Date().toISOString();
  const agentIds = {};
  const agents = W.AGENTS.map((a, i) => {
    agentIds[a.id] = i + 1;
    return Object.assign({}, a, { id: i + 1, phone: "", whatsapp: "" });
  });
  return {
    settings: Object.assign({ showSampleNotice: true }, W.SITE_CONFIG),
    agents,
    listings: W.LISTINGS.map((l) => Object.assign({}, l, {
      agent: agentIds[l.agent] || null,
      status: "published",
      createdAt: l.date + "T09:00:00.000Z",
      updatedAt: now
    }))
  };
}

module.exports = { reference, seedData, ROOT };
