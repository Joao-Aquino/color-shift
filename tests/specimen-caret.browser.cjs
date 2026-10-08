/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://127.0.0.1:3001';
const output = '/tmp/color-shift-specimen-caret';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/photos?*', route => route.fulfill({ json: { photos: Array.from({ length: 10 }, (_, id) => ({
      id: `caret-${id}`, url: '/figma/photo.jpg', tinyUrl: '/figma/photo.jpg', thumbUrl: '/figma/photo.jpg',
      color: '#f7b955', width: 1200, height: 900, alt: 'Reference landscape', photographer: 'Mara Vale',
      photographerUrl: 'https://unsplash.com/@test', photoUrl: 'https://unsplash.com/photos/test',
    })) } }));
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    const input = page.getByRole('textbox', { name: 'Specimen text' });
    await input.waitFor();
    const caret = page.locator('[data-specimen-caret]');
    async function position() {
      return input.evaluate(node => ({ start: node.selectionStart, end: node.selectionEnd, length: node.value.length }));
    }
    async function geometry() {
      return page.evaluate(() => {
        const input = document.querySelector('.cs-specimen-type');
        const caret = document.querySelector('[data-specimen-caret]');
        const surface = document.querySelector('.cs-specimen-surface');
        const c = caret.getBoundingClientRect(), s = surface.getBoundingClientRect();
        return { width: c.width, height: c.height, font: parseFloat(getComputedStyle(input).fontSize),
          color: getComputedStyle(caret).backgroundColor, foreground: getComputedStyle(input).color,
          inside: c.left >= s.left - 1 && c.right <= s.right + 1 && c.top >= s.top - 1 && c.bottom <= s.bottom + 1,
          x: c.left, y: c.top, animation: getComputedStyle(caret).animationName, native: getComputedStyle(input).caretColor };
      });
    }
    // Click near the beginning, not the default midpoint of Playwright's click.
    await input.click({ position: { x: 3, y: 5 } });
    assert.deepEqual(await position(), { start: 2, end: 2, length: 2 });
    await caret.waitFor({ state: 'visible' });
    const initial = await geometry();
    assert.ok(Math.abs(initial.width / initial.font - 14 / 240) < 0.002, JSON.stringify(initial));
    assert.ok(Math.abs(initial.height / initial.font - 202 / 240) < 0.002, JSON.stringify(initial));
    assert.equal(initial.color, initial.foreground);
    assert.equal(initial.native, 'rgba(0, 0, 0, 0)');
    await input.click({ position: { x: 3, y: 5 } });
    assert.deepEqual(await position(), { start: 0, end: 0, length: 2 }, 'Later clicks can place the caret freely');
    await input.press('End');
    await input.press('!');
    assert.equal(await input.inputValue(), 'Aa!');
    await input.press('ArrowLeft');
    assert.deepEqual(await position(), { start: 2, end: 2, length: 3 });
    const moved = await geometry();
    assert.ok(moved.x < initial.x + 40);
    await input.press('Shift+ArrowLeft');
    assert.equal(await caret.getAttribute('hidden'), '');
    await input.press('ArrowRight');
    await caret.waitFor({ state: 'visible' });
    await input.press('Escape');
    assert.equal(await caret.getAttribute('hidden'), '');
    await input.focus();
    assert.deepEqual(await position(), { start: 3, end: 3, length: 3 });
    await input.press('Escape');
    await input.fill('Replacement text');
    assert.equal(await input.inputValue(), 'Replacement text', 'Explicit selection before focus must remain replaceable');
    console.log('PASS first click/keyboard focus starts at end; insertion, navigation and native selection remain usable');

    for (const width of [1440, 640, 393, 320]) {
      await page.setViewportSize({ width, height: 980 });
      await page.waitForTimeout(300);
      for (const value of ['Aa', 'First line\nSecond line\n', 'Long text with spaces and emoji 👩🏽‍💻 that wraps inside the specimen. '.repeat(1), '']) {
        await input.fill(value);
        await input.press('End');
        await caret.waitFor({ state: 'visible' });
        const result = await geometry();
        assert.ok(result.inside, JSON.stringify({ width, value, result }));
        assert.ok(Math.abs(result.width / result.font - 14 / 240) < 0.003, JSON.stringify(result));
      }
    }
    console.log('PASS caret follows automatic font fit and wrapped, empty and trailing-newline text at desktop/tablet/mobile sizes');
    await page.setViewportSize({ width: 1440, height: 980 });
    await input.fill('Aa');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${output}/caret-desktop.png` });
    await input.evaluate(node => node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    assert.equal(await caret.getAttribute('hidden'), '');
    assert.notEqual(await input.evaluate(node => getComputedStyle(node).caretColor), 'rgba(0, 0, 0, 0)');
    await input.evaluate(node => node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    await caret.waitFor({ state: 'visible' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal((await geometry()).animation, 'none');
    await page.screenshot({ path: `${output}/caret-reduced-motion.png` });
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await caret.evaluate(node => getComputedStyle(node).display), 'none');
    assert.notEqual(await input.evaluate(node => getComputedStyle(node).caretColor), 'rgba(0, 0, 0, 0)');
    assert.deepEqual(errors, []);
    console.log('PASS native composition/forced-colors fallback, stationary reduced-motion caret and no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
