/* eslint-disable @typescript-eslint/no-require-imports -- Run this isolated hook harness directly in Node. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(path.resolve(__dirname, "../lib/use-collapsible-presence.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

function setup({ reduced = false, server = false } = {}) {
  const listeners = new Set();
  const query = {
    matches: reduced,
    addEventListener(type, callback) {
      assert.equal(type, "change");
      listeners.add(callback);
    },
    removeEventListener(type, callback) {
      assert.equal(type, "change");
      listeners.delete(callback);
    },
  };
  const states = [];
  let cursor;
  let pending;
  let unsubscribe;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    window: server ? undefined : {
      matchMedia(value) {
        assert.equal(value, "(prefers-reduced-motion: reduce)");
        return query;
      },
    },
    require(name) {
      assert.equal(name, "react");
      return {
        useState(initial) {
          const slot = cursor++;
          if (!(slot in states)) states[slot] = initial;
          return [states[slot], (value) => { states[slot] = value; pending = true; }];
        },
        useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          if (server) return getServerSnapshot();
          unsubscribe ??= subscribe(() => { pending = true; });
          return getSnapshot();
        },
      };
    },
  });
  return {
    listeners,
    render(open) {
      let result;
      let passes = 0;
      do {
        assert.ok(++passes < 10, "conditional state updates must converge");
        cursor = 0;
        pending = false;
        result = exports.useCollapsiblePresence(open);
      } while (pending);
      return result;
    },
    reduce(value) {
      query.matches = value;
      listeners.forEach((listener) => listener());
    },
    cleanup() { unsubscribe?.(); },
  };
}

function transition(presence, propertyName = "grid-template-rows", bubbled = false) {
  const currentTarget = {};
  presence.onTransitionEnd({ propertyName, currentTarget, target: bubbled ? {} : currentTarget });
}

const tests = {
  "content mounts immediately and remains until the closing grid transition ends"() {
    const env = setup();
    assert.equal(env.render(false).present, false);
    assert.equal(env.render(true).present, true);
    const closing = env.render(false);
    assert.equal(closing.present, true);
    transition(closing);
    assert.equal(env.render(false).present, false);
    env.cleanup();
  },
  "bubbled and unrelated transitions cannot remove closing content"() {
    const env = setup();
    env.render(true);
    const closing = env.render(false);
    transition(closing, "opacity");
    transition(closing, "grid-template-rows", true);
    assert.equal(env.render(false).present, true);
    transition(env.render(false));
    assert.equal(env.render(false).present, false);
    env.cleanup();
  },
  "a rapid reopen keeps content mounted when a transition completes"() {
    const env = setup();
    env.render(true);
    env.render(false);
    transition(env.render(true));
    assert.equal(env.render(true).present, true);
    transition(env.render(false));
    assert.equal(env.render(false).present, false);
    env.cleanup();
  },
  "reduced motion closes immediately without waiting for a CSS event"() {
    const env = setup({ reduced: true });
    assert.equal(env.render(true).present, true);
    assert.equal(env.render(false).present, false);
    env.reduce(false);
    assert.equal(env.render(false).present, false);
    env.cleanup();
  },
  "live reduced-motion changes clear retained content and unsubscribe on unmount"() {
    const env = setup();
    env.render(true);
    assert.equal(env.render(false).present, true);
    assert.equal(env.listeners.size, 1);
    env.reduce(true);
    assert.equal(env.render(false).present, false);
    env.reduce(false);
    assert.equal(env.render(false).present, false);
    env.cleanup();
    assert.equal(env.listeners.size, 0);
  },
  "server rendering does not access window or register media listeners"() {
    const env = setup({ server: true });
    assert.equal(env.render(false).present, false);
    assert.equal(env.render(true).present, true);
    assert.equal(env.listeners.size, 0);
  },
};

for (const [name, run] of Object.entries(tests)) {
  run();
  console.log(`PASS ${name}`);
}
console.log(`${Object.keys(tests).length} deterministic hook tests passed (mocked React/media queries).`);
