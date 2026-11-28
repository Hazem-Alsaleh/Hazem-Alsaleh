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
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    this.cache = new Map();
  }

  file(name) { return path.join(this.dir, name + ".json"); }

  exists(name) { return fs.existsSync(this.file(name)); }

  /* Leser fra minnet, men laster filen på nytt hvis den er endret utenfra
     (for eksempel når «npm run create-admin» bytter passord mens serveren kjører). */
  read(name, fallback) {
    const f = this.file(name);
    let mtime = 0;
    try { mtime = fs.statSync(f).mtimeMs; } catch (e) { mtime = 0; }
    const c = this.cache.get(name);
    if (c && c.mtime === mtime) return c.value;
    const value = mtime ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback;
    this.cache.set(name, { value, mtime });
    return value;
  }

  write(name, value) {
    const f = this.file(name);
    const tmp = f + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, f);
    this.cache.set(name, { value, mtime: fs.statSync(f).mtimeMs });
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
