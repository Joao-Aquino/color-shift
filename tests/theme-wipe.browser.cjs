/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://127.0.0.1:3001';
const output = '/tmp/color-shift-theme-wipe';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/api/photos?*', route => route.fulfill({ json: { photos: Array.from({ length: 10 }, (_, id) => ({
      id: `wipe-${id}`, url: '/figma/photo.jpg', tinyUrl: '/figma/photo.jpg', thumbUrl: '/figma/photo.jpg',
      color: '#f7b955', width: 1200, height: 900, alt: 'Reference landscape', photographer: 'Mara Vale',
      photographerUrl: 'https://unsplash.com/@test', photoUrl: 'https://unsplash.com/photos/test',
    })) } }));
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-color-field]');
    const light = page.getByRole('button', { name: 'Light', exact: true });
    const dark = page.getByRole('button', { name: 'Dark', exact: true });
    const theme = () => page.locator('html').getAttribute('data-theme');
    const pseudo = '::view-transition-new(root)';
    async function idle(expected) {
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
      assert.equal(await theme(), expected);
      assert.equal(await page.locator('html').getAttribute('data-theme-wipe'), null);
      assert.equal(await page.locator('html').getAttribute('data-theme-wipe-phase'), null);
      assert.equal(await page.evaluate(pseudo => document.getAnimations().filter(animation => animation.effect?.pseudoElement === pseudo).length, pseudo), 0);
    }
    async function pauseReveal() {
      await page.waitForFunction(() => document.documentElement.dataset.themeWipePhase === 'revealing');
      return page.evaluate(async pseudo => {
        const animation = document.getAnimations().find(animation => animation.effect?.pseudoElement === pseudo);
        animation.pause();
        animation.currentTime = 350;
        await animation.ready;
        const timing = animation.effect.getTiming();
        return { duration: timing.duration, easing: timing.easing,
          frames: animation.effect.getKeyframes().map(frame => frame.clipPath),
          clip: getComputedStyle(document.documentElement, pseudo).clipPath,
          direction: document.documentElement.dataset.themeWipe,
          blend: getComputedStyle(document.documentElement, pseudo).mixBlendMode,
          selected: document.querySelector('[data-theme-choice="light"]').getAttribute('aria-pressed') };
      }, pseudo);
    }
    const resume = () => page.evaluate(pseudo => document.getAnimations().find(animation => animation.effect?.pseudoElement === pseudo).play(), pseudo);

    await page.getByRole('textbox', { name: 'Specimen text' }).fill('Preserved text');
    await page.locator('[data-color-field="foreground"]').click();
    const colors = await page.locator('[data-color-field]').allTextContents();
    await light.click();
    const wipe = await pauseReveal();
    assert.equal(wipe.duration, 700);
    assert.equal(wipe.easing, 'ease-in-out');
    assert.equal(wipe.direction, 'right');
    assert.deepEqual(wipe.frames, ['inset(0px 0px 0px 100%)', 'inset(0px)']);
    assert.equal(wipe.clip, 'inset(0px 0px 0px 50%)');
    assert.equal(wipe.blend, 'normal');
    assert.equal(wipe.selected, 'true', 'React theme controls commit before the new snapshot');
    assert.equal(await theme(), 'light');
    await page.screenshot({ path: path.join(output, 'half-light.png') });
    await resume();
    await idle('light');
    assert.deepEqual(await page.locator('[data-color-field]').allTextContents(), colors);
    assert.equal(await page.getByRole('textbox', { name: 'Specimen text' }).inputValue(), 'Preserved text');
    assert.equal(await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => localStorage.getItem('color-shift-theme')), 'light');
    assert.ok(await light.evaluate(node => document.activeElement === node));
    console.log('PASS supplied horizontal clip reveal, 700ms timing and synchronous React snapshot');

    await dark.click();
    const darkWipe = await pauseReveal();
    assert.equal(darkWipe.direction, 'left');
    assert.deepEqual(darkWipe.frames, ['inset(0px 100% 0px 0px)', 'inset(0px)']);
    assert.equal(darkWipe.clip, 'inset(0px 50% 0px 0px)');
    await page.screenshot({ path: path.join(output, 'half-dark.png') });
    // Native snapshot participants are not hit-tested while the reveal is paused.
    // Exercise an already-dispatched theme request to verify cancellation ownership.
    await light.evaluate(node => node.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
    await idle('light');
    await page.waitForTimeout(750);
    assert.equal(await theme(), 'light');
    // Same-task clicks interrupt before the first snapshot callback can run.
    await page.evaluate(() => {
      for (const choice of ['dark', 'light']) {
        document.querySelector(`[data-theme-choice="${choice}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      }
    });
    await idle('light');
    await page.waitForTimeout(100);
    assert.equal(await theme(), 'light');
    console.log('PASS rapid theme requests during capture/reveal cannot apply a stale theme');

    await dark.click();
    await pauseReveal();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await idle('dark');
    await light.click();
    await idle('light');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await dark.focus();
    await page.keyboard.press('Enter');
    await idle('dark');
    await page.locator('.cs-header h1').click();
    await page.keyboard.press('t');
    await idle('light');
    console.log('PASS reduced motion and keyboard theme changes remain immediate');

    await dark.click();
    await pauseReveal();
    await page.evaluate(() => {
      localStorage.setItem('color-shift-theme', 'light');
      window.dispatchEvent(new StorageEvent('storage', { key: 'color-shift-theme', newValue: 'light' }));
    });
    await idle('light');
    await page.waitForTimeout(750);
    assert.equal(await theme(), 'light');
    await page.setViewportSize({ width: 393, height: 852 });
    await dark.click();
    await pauseReveal();
    await page.setViewportSize({ width: 393, height: 650 });
    await idle('dark');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    console.log('PASS external storage and mobile resize cancel snapshots cleanly');

    await page.evaluate(() => {
      window.realViewTransition = document.startViewTransition;
      document.startViewTransition = undefined;
    });
    await light.click();
    await idle('light');
    await page.evaluate(() => { document.startViewTransition = () => { throw Error('Unavailable transition'); }; });
    await dark.click();
    await idle('dark');
    await page.evaluate(() => { document.startViewTransition = window.realViewTransition; });
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => { throw Error('Storage blocked'); };
      Storage.prototype.setItem = () => { throw Error('Storage blocked'); };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-color-field]');
    await light.click();
    await idle('light');
    assert.deepEqual(errors, []);
    console.log('PASS missing/failing View Transition API and blocked storage; no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
