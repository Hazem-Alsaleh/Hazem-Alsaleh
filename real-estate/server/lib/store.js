"use strict";
/*
 * Enkel lagring i JSON-filer (én fil per samling) i datamappen.
 * Holder alt i minnet og skriver hele filen atomisk (tmp + rename) ved hver endring.
 * Passer for et meglerkontor med noen tusen boliger; kan byttes mot en database senere.
 */
const fs = require("fs");
const path = require("path");

class Store {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.cache = new Map();
  }

  file(name) { return path.join(this.dir, name + ".json"); }

  exists(name) { return fs.existsSync(this.file(name)); }

  read(name, fallback) {
    if (this.cache.has(name)) return this.cache.get(name);
    let value = fallback;
    const f = this.file(name);
    if (fs.existsSync(f)) value = JSON.parse(fs.readFileSync(f, "utf8"));
    this.cache.set(name, value);
    return value;
  }

  write(name, value) {
    this.cache.set(name, value);
    const f = this.file(name);
    const tmp = f + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, f);
    return value;
  }

  /* samling = liste med objekter som har numerisk id */
  list(name) { return this.read(name, []); }

  get(name, id) {
    id = Number(id);
    return this.list(name).find((x) => x.id === id) || null;
  }

  insert(name, obj) {
    const items = this.list(name);
    const id = items.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    const row = Object.assign({ id }, obj);
    this.write(name, items.concat([row]));
    return row;
  }

  update(name, id, patch) {
    id = Number(id);
    let out = null;
    const items = this.list(name).map((x) => {
      if (x.id !== id) return x;
      out = Object.assign({}, x, patch, { id });
      return out;
    });
    if (out) this.write(name, items);
    return out;
  }

  remove(name, id) {
    id = Number(id);
    const items = this.list(name);
    const next = items.filter((x) => x.id !== id);
    if (next.length === items.length) return false;
    this.write(name, next);
    return true;
  }
}

module.exports = { Store };
