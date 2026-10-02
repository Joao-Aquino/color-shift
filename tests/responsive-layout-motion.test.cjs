/* eslint-disable @typescript-eslint/no-require-imports -- This CommonJS harness runs directly in Node. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const repo = path.resolve(__dirname, '..');
const ts = require(path.join(repo, 'node_modules/typescript'));
const source = ts.transpileModule(fs.readFileSync(path.join(repo, 'lib/use-responsive-layout-motion.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;

function setup(initialWidth = 641, showCircle = false) {
  class Events {
    listeners = new Map();
    addEventListener(type, callback) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(callback);
    }
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
    fire(type) { [...(this.listeners.get(type) || [])].forEach(callback => callback()); }
    count() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
  }
  const win = new Events();
  win.innerWidth = initialWidth;
  win.innerHeight = 900;
  const frames = new Map();
  let frameId = 0;
  win.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  win.cancelAnimationFrame = id => frames.delete(id);
  const media = ['(min-width: 40rem)', '(min-width: 73.75rem)', '(prefers-reduced-motion: reduce)'].map(query => {
    const events = new Events();
    events.query = query;
    events.matches = query.includes('40rem') ? initialWidth >= 640 : query.includes('73.75rem') ? initialWidth >= 1180 : false;
    return events;
  });
  win.matchMedia = query => media.find(item => item.query === query);
  class Style {
    values = new Map();
    priorities = new Map();
    getPropertyValue(key) { return this.values.get(key) || ''; }
    getPropertyPriority(key) { return this.priorities.get(key) || ''; }
    setProperty(key, value, priority = '') { this.values.set(key, value); this.priorities.set(key, priority); }
    removeProperty(key) { this.values.delete(key); this.priorities.delete(key); }
    set overflow(value) { this.setProperty('overflow', value); }
  }
  class Element {
    style = new Style();
    isConnected = true;
    constructor(name) { this.dataset = { responsiveMotion: name }; }
    matches() { return !!this.dataset.responsiveMotion; }
    querySelector() { return null; }
    getBoundingClientRect() {
      const pose = this.style.getPropertyValue('transform');
      const x = pose.startsWith('visual:') ? Number(pose.slice(7)) : win.innerWidth;
      const width = this.dataset.responsiveMotion === 'controls'
        ? (win.innerWidth >= 1180 ? 320 : win.innerWidth) : win.innerWidth / 2;
      return { x, y: 0, left: x, top: 0, width, height: 200, ...this.boundsOverride };
    }
  }
  const targets = ['controls', 'preview', 'specimen', showCircle ? 'circle' : 'type', 'photo'].map(name => new Element(name));
  const circleShape = new Element('circle-shape');
  const pressCircle = new Element('press-circle');
  if (showCircle) {
    targets[3].querySelector = selector => selector === '[data-responsive-circle-shape]' ? circleShape : null;
    circleShape.style.setProperty('transform', 'shape-original', 'important');
    pressCircle.style.setProperty('transform', 'scale(.95)');
  }
  const root = new Element('root');
  root.querySelectorAll = () => targets;
  targets[2].style.setProperty('background-color', 'red');
  targets[0].style.setProperty('transform', 'original', 'important');
  targets[1].style.setProperty('overflow', 'hidden');
  const observers = [];
  class Observer {
    elements = new Set();
    disconnected = false;
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(element) { this.elements.add(element); }
    unobserve(element) { this.elements.delete(element); }
    disconnect() { this.disconnected = true; this.elements.clear(); }
  }
  const animations = [];
  const captures = [];
  const gsap = {
    registerPlugin() {},
    set(element, options) {
      if (options.clearProps) {
        assert.equal(options.clearProps, 'transform');
        element.style.removeProperty('transform');
      } else {
        assert.equal(element, circleShape);
        assert.deepEqual(Object.keys(options).sort(), ['scaleX', 'scaleY']);
        circleShape.scales = { ...options };
        element.style.setProperty('transform', `scale(${options.scaleX},${options.scaleY})`);
      }
    },
  };
  const Flip = {
    getState(elements, options) {
      assert.equal(options.kill, false, 'capture must not force completion');
      const state = {
        targets: [...elements],
        poses: elements.map(element => element.getBoundingClientRect().x),
        elementStates: elements.map(element => ({ element, bounds: element.getBoundingClientRect() })),
      };
      captures.push(state);
      return state;
    },
    from(state, options) {
      assert.equal(options.duration, 0.2);
      assert.equal(options.scale, true);
      assert.equal(options.nested, true);
      assert.equal(options.clearProps, false);
      assert.ok(!options.targets.includes(targets[0]), 'controls must never be scaled by Flip');
      const animation = {
        state, options, killed: false, translations: [],
        kill() { this.killed = true; },
        fromTo(element, from, to, time) {
          assert.equal(element, targets[0]);
          assert.deepEqual(Object.keys(from).sort(), ['transformOrigin', 'x', 'y']);
          assert.deepEqual(Object.keys(to).sort(), ['duration', 'ease', 'x', 'y']);
          assert.equal(from.transformOrigin, '0 0');
          assert.equal(to.x, 0);
          assert.equal(to.y, 0);
          assert.equal(to.duration, 0.2);
          assert.equal(to.ease, options.ease);
          assert.equal(time, 0);
          const current = element.getBoundingClientRect();
          element.style.setProperty('transform', `visual:${current.x + from.x}`);
          this.translations.push({ from, to });
          return this;
        },
      };
      options.targets.forEach(element => element.style.setProperty('transform', `visual:${state.poses[state.targets.indexOf(element)]}`));
      animations.push(animation);
      return animation;
    },
  };
  let effect;
  const exports = {};
  vm.runInNewContext(source, {
    exports, window: win, HTMLElement: Element, ResizeObserver: Observer, MutationObserver: Observer,
    require(name) {
      if (name === 'react') return { useRef: () => ({ current: root }), useEffect: callback => { effect = callback; } };
      if (name === 'gsap') return gsap;
      if (name === 'gsap/Flip') return { Flip };
      if (name === 'gsap/CustomEase') return { CustomEase: { create(name, curve) { assert.equal(curve, '0.77,0,0.175,1'); return curve; } } };
      throw new Error(name);
    },
  });
  exports.useResponsiveLayoutMotion();
  const cleanup = effect();
  function flush() {
    const queued = [...frames.values()];
    frames.clear();
    queued.forEach(callback => callback());
  }
  function resize(width) {
    win.innerWidth = width;
    media[0].matches = width >= 640;
    media[1].matches = width >= 1180;
    win.fire('resize');
    media[0].fire('change');
    media[1].fire('change');
  }
  function restored() {
    assert.equal(targets[0].style.getPropertyValue('transform'), 'original');
    assert.equal(targets[0].style.getPropertyPriority('transform'), 'important');
    assert.equal(targets[1].style.getPropertyValue('overflow'), 'hidden');
    assert.equal(targets[2].style.getPropertyValue('background-color'), 'red');
    assert.equal(targets[2].style.getPropertyValue('transform'), '');
  }
  return { win, media, frames, targets, circleShape, pressCircle, observers, animations, captures, cleanup, flush, resize, restored };
}

const tests = {
  'crossings retain geometry from before CSS reflow and coalesce notifications'() {
    const env = setup();
    assert.equal(env.animations.length, 0);
    env.resize(639);
    assert.equal(env.frames.size, 1);
    env.flush();
    assert.equal(env.animations.length, 1);
    assert.equal(env.animations[0].state.poses[2], 641);
    env.cleanup(); env.restored();
  },
  'same-band resizing is immediate and cancels old motion without another Flip'() {
    const env = setup();
    env.resize(700); env.flush();
    assert.equal(env.animations.length, 0);
    env.resize(639); env.flush();
    env.resize(620); env.flush();
    assert.equal(env.animations.length, 1);
    assert.equal(env.animations[0].killed, true);
    env.restored(); env.cleanup();
  },
  'rapid reversals retain the visual frame even if onUpdate runs after reflow'() {
    const env = setup(1181);
    env.resize(1179); env.flush();
    env.targets.forEach(element => element.style.setProperty('transform', 'visual:1100'));
    env.animations[0].options.onUpdate();
    env.resize(1181);
    env.animations[0].options.onUpdate();
    env.flush();
    assert.equal(env.animations.length, 2);
    assert.equal(env.animations[0].killed, true);
    assert.equal(env.animations[1].state.poses[2], 1100);
    assert.equal(env.animations[1].translations[0].from.x, 1100 - 1181);
    env.cleanup(); env.restored();
  },
  'live reduced-motion change cancels and restores; future crossings skip'() {
    const env = setup();
    env.resize(639); env.flush();
    env.media[2].matches = true; env.media[2].fire('change');
    assert.equal(env.animations[0].killed, true);
    env.restored();
    env.resize(641); env.flush();
    assert.equal(env.animations.length, 1);
    env.media[2].matches = false; env.media[2].fire('change'); env.flush();
    env.resize(639); env.flush();
    assert.equal(env.animations.length, 2);
    env.cleanup();
  },
  'cleanup removes listeners, observers, pending rAF, and motion; remount stays idle'() {
    const env = setup();
    env.resize(639); env.flush();
    env.resize(641);
    env.cleanup();
    assert.equal(env.frames.size, 0);
    assert.equal(env.win.count(), 0);
    env.media.forEach(item => assert.equal(item.count(), 0));
    env.observers.forEach(item => assert.equal(item.disconnected, true));
    assert.equal(env.animations[0].killed, true);
    env.restored();
    env.observers[0].callback();
    assert.equal(env.frames.size, 0);
    const remount = setup();
    assert.equal(remount.frames.size, 0);
    assert.equal(remount.animations.length, 0);
    remount.cleanup();
  },
  'completion after a new reflow cannot replace the prior visual baseline'() {
    const env = setup();
    env.resize(639); env.flush();
    env.targets.forEach(element => element.style.setProperty('transform', 'visual:650'));
    env.animations[0].options.onUpdate();
    env.resize(641);
    env.animations[0].options.onComplete();
    env.flush();
    assert.equal(env.animations[1].state.poses[2], 650);
    env.cleanup();
  },
  'controls retain live CSS dimensions and translate on the shared timeline'() {
    const env = setup(1179);
    env.resize(1181); env.flush();
    assert.equal(env.targets[0].getBoundingClientRect().width, 320);
    assert.equal(env.targets[0].getBoundingClientRect().x, 1179);
    assert.equal(env.animations[0].translations.length, 1);
    assert.equal(env.animations[0].translations[0].from.x, -2);
    assert.equal(env.animations[0].translations[0].from.y, 0);
    env.animations[0].options.onComplete();
    env.restored();
    env.cleanup();
  },
  'circle counter-scaling keeps geometric-mean diameter and restores only its wrapper'() {
    for (const finish of ['complete', 'resize', 'reduced', 'cleanup']) {
      const env = setup(641, true);
      env.resize(639); env.flush();
      function round(width, height) {
        const { scaleX, scaleY } = env.circleShape.scales;
        const diameter = Math.sqrt(width * height);
        assert.ok(Math.abs(width * scaleX - diameter) < 1e-9);
        assert.ok(Math.abs(height * scaleY - diameter) < 1e-9);
      }
      round(639 / 2, 200);
      env.targets[3].boundsOverride = { width: 90, height: 160 };
      env.animations[0].options.onUpdate();
      round(90, 160);
      assert.equal(env.pressCircle.style.getPropertyValue('transform'), 'scale(.95)');
      if (finish === 'complete') env.animations[0].options.onComplete();
      else if (finish === 'resize') { env.resize(620); env.flush(); }
      else if (finish === 'reduced') { env.media[2].matches = true; env.media[2].fire('change'); }
      else env.cleanup();
      assert.equal(env.circleShape.style.getPropertyValue('transform'), 'shape-original');
      assert.equal(env.circleShape.style.getPropertyPriority('transform'), 'important');
      assert.equal(env.pressCircle.style.getPropertyValue('transform'), 'scale(.95)');
      if (finish !== 'cleanup') env.cleanup();
    }
  },
};
for (const [name, run] of Object.entries(tests)) { run(); console.log(`PASS ${name}`); }
console.log(`${Object.keys(tests).length} deterministic tests passed (mocked React/GSAP/DOM/MQL; no browser emulation).`);
