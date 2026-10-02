/* eslint-disable @typescript-eslint/no-require-imports -- Execute isolated browser-preference tests in Node. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(path.resolve(__dirname, "../lib/theme.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

function setup(value, blocked = false) {
  const classes = new Set(["font-sans", "dark"]);
  const root = { dataset: {}, style: {}, classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } } };
  const meta = {};
  const storage = { value };
  const sandbox = {
    exports: {},
    document: { documentElement: root, querySelector() { return { setAttribute(key, next) { meta[key] = next; } }; } },
    localStorage: {
      getItem(key) { assert.equal(key, "color-shift-theme"); if (blocked) throw Error("Blocked"); return storage.value; },
      setItem(key, next) { assert.equal(key, "color-shift-theme"); if (blocked) throw Error("Blocked"); storage.value = next; },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return { sandbox, root, classes, meta, storage, api: sandbox.exports };
}

for (const [saved, expected] of [[null, "dark"], ["light", "light"], ["dark", "dark"], ["invalid", "dark"], ['light\";throw Error()', "dark"]]) {
  const env = setup(saved);
  vm.runInContext(env.api.THEME_BOOTSTRAP, env.sandbox);
  assert.equal(env.root.dataset.theme, expected);
  assert.equal(env.root.style.colorScheme, expected);
  assert.equal(env.classes.has("dark"), expected === "dark");
  assert.ok(env.classes.has("font-sans"));
  assert.equal(env.meta.content, expected === "light" ? "#ffffff" : "#0a0a0a");
  assert.equal(env.api.readTheme(), expected);
}
console.log("PASS pre-paint theme handles persisted, missing, and invalid preferences without replacing font classes");

const env = setup("dark");
env.api.setTheme("light");
assert.equal(env.storage.value, "light");
assert.equal(env.root.dataset.theme, "light");
env.api.setTheme("dark");
assert.equal(env.storage.value, "dark");
assert.equal(env.meta.content, "#0a0a0a");
console.log("PASS explicit preference synchronizes DOM, color scheme, browser chrome, and storage");

const blocked = setup(null, true);
assert.doesNotThrow(() => vm.runInContext(blocked.api.THEME_BOOTSTRAP, blocked.sandbox));
assert.equal(blocked.root.dataset.theme, "dark");
assert.doesNotThrow(() => blocked.api.setTheme("light"));
assert.equal(blocked.root.dataset.theme, "light");
assert.equal(blocked.classes.has("dark"), false);
assert.equal(blocked.api.readTheme(), "dark");
console.log("PASS blocked storage leaves current-session theme switching usable");
