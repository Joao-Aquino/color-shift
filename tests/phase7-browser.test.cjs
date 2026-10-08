/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://127.0.0.1:3001';
const bitmap = path.join(__dirname, '../public/figma/photo.jpg');
const output = process.env.COLOR_SHIFT_TEST_ARTIFACT_DIR || '/tmp/color-shift-phase7';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    let sequence = 0;
    await page.route('**/api/photos?*', async route => {
      const count = Number(new URL(route.request().url()).searchParams.get('count') || 10);
      const photos = Array.from({ length: count }, () => {
        const id = sequence++;
        return { id: `motion-${id}`, url: `/motion-full-${id}.jpg`, tinyUrl: `/motion-tiny-${id}.jpg`,
          thumbUrl: '/figma/photo.jpg', color: '#f7b955', width: 1200, height: 900,
          alt: `Motion photo ${id}`, photographer: 'Mara Vale',
          photographerUrl: 'https://unsplash.com/@test', photoUrl: 'https://unsplash.com/photos/test' };
      });
      await route.fulfill({ json: { photos } });
    });
    await page.route('**/motion-tiny-*.jpg', async route => {
      await new Promise(resolve => setTimeout(resolve, 50));
      await route.fulfill({ path: bitmap });
    });
    await page.route('**/motion-full-*.jpg', route => route.fulfill({ path: bitmap }));
    // Preserve a visible placeholder while the full image is delayed.
    await page.route('**/_next/image?*', async route => {
      await new Promise(resolve => setTimeout(resolve, 320));
      await route.fulfill({ path: bitmap });
    });
    async function reset(size = { width: 1440, height: 980 }, reducedMotion = 'no-preference') {
      await page.emulateMedia({ reducedMotion });
      await page.setViewportSize(size);
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-color-field]');
      await page.waitForFunction(() => {
        const image = document.querySelector('[data-current="true"] [data-photo-full]');
        return image?.complete && Number(getComputedStyle(image).opacity) === 1;
      });
    }
    await reset();
    async function assertSidebarResize(action) {
      await page.evaluate(() => {
        window.fieldDimensionSamples = [];
        const start = performance.now();
        function sample() {
          document.querySelectorAll('[data-color-field-shell], #contrast-score-panel').forEach(node => {
            if (!node.getClientRects().length) return;
            const rect = node.getBoundingClientRect();
            const computed = getComputedStyle(node);
            const matrix = new DOMMatrix(computed.transform);
            const borderRadius = parseFloat(computed.borderRadius) || 0;
            window.fieldDimensionSamples.push({ 
              height: rect.height,
              scaleX: matrix.a, 
              scaleY: matrix.d,
              borderRadius,
              tag: node.tagName,
            });
          });
          if (performance.now() - start < 300) requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      await action();
      await page.waitForTimeout(320);
      const samples = await page.evaluate(() => window.fieldDimensionSamples);
      assert.ok(samples.length > 0, 'Should capture dimension samples during animation');
      assert.ok(samples.some(s => s.height > 48 && s.height < 200), 'Should animate through intermediate heights');
      assert.ok(samples.every(s => Math.abs(s.scaleX - 1) < 0.01 && Math.abs(s.scaleY - 1) < 0.01), 
        'No scale transform distortion: all elements should maintain scale 1,1 throughout');
      const radiusSamples = samples.filter(s => s.borderRadius > 0);
      assert.ok(radiusSamples.every(s => Math.abs(s.borderRadius - 24) < 1), 
        'Border radius should remain 24px (not distorted by scale)');
      assert.equal(await page.locator('[data-layout-moving]').count(), 0);
      assert.equal(await page.locator('[data-motion-ghost]').count(), 0);
    }
    const specimen = page.getByRole('textbox', { name: 'Specimen text' });
    await specimen.click();
    assert.ok(await specimen.evaluate(node => document.activeElement === node));
    assert.equal(await page.getByRole('button', { name: 'Edit specimen text' }).count(), 0);
    const baseSize = await specimen.evaluate(node => parseFloat(getComputedStyle(node).fontSize));
    const beforePair = await page.locator('[data-color-field]').allTextContents();
    await specimen.fill('Testing text that grows and automatically fits inside the specimen panel. '.repeat(1));
    await specimen.press('s');
    assert.deepEqual(await page.locator('[data-color-field]').allTextContents(), beforePair);
    const edited = await specimen.evaluate(node => {
      const style = getComputedStyle(node);
      return { size: parseFloat(style.fontSize), border: style.borderWidth, outline: style.outlineStyle,
        background: style.backgroundColor, overflow: node.scrollHeight > node.clientHeight + 2,
        transform: style.transform, caret: node.selectionStart, text: node.value };
    });
    assert.ok(edited.size < baseSize, JSON.stringify(edited));
    assert.equal(edited.border, '0px');
    assert.equal(edited.outline, 'none');
    assert.equal(edited.background, 'rgba(0, 0, 0, 0)');
    assert.equal(edited.overflow, false);
    assert.equal(edited.transform, 'none');
    assert.equal(edited.caret, edited.text.length);
    await specimen.press('Escape');
    assert.equal(await specimen.evaluate(node => document.activeElement === node), false);
    assert.equal(await page.locator('[data-responsive-motion="circle"]').count(), 0);
    await specimen.fill('Aa');
    await specimen.press('Escape');
    console.log('PASS direct specimen editing, caret retention, automatic font fitting and no visible editor box');

    await page.locator('[data-theme-choice="light"]').click();
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    await page.mouse.move(1, 1);
    await page.waitForTimeout(250);
    const light = await page.locator('[data-action="swap"]').evaluate(node => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, border: style.borderColor, color: style.color };
    });
    assert.deepEqual(light, { background: 'rgb(242, 242, 242)', border: 'rgb(235, 235, 235)', color: 'rgb(23, 23, 23)' });
    const lightExport = await page.locator('[data-export-button]').evaluate(node => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, border: style.borderColor, color: style.color };
    });
    assert.deepEqual(lightExport, { background: 'rgb(26, 26, 26)', border: 'rgb(46, 46, 46)', color: 'rgb(237, 237, 237)' });
    await page.screenshot({ path: path.join(output, 'light.png') });
    await page.locator('[data-theme-choice="dark"]').click();
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    console.log('PASS Light controls and EXPORT colors match resolved Figma tokens');

    const original = await page.locator('[data-photo-layer][data-current="true"]').getAttribute('data-photo-id');
    await page.locator('[data-action="next"]').click();
    await page.waitForTimeout(80);
    const blend = await page.locator('[data-photo-layer]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.photoId, opacity: Number(getComputedStyle(node).opacity), current: node.dataset.current === 'true' })));
    assert.ok(blend.some(layer => layer.id === original && layer.opacity === 1), JSON.stringify(blend));
    assert.ok(blend.some(layer => layer.current && layer.opacity > 0 && layer.opacity < 1), JSON.stringify(blend));
    await page.locator('[data-action="next"]').click();
    await page.locator('[data-action="next"]').click();
    await page.waitForTimeout(600);
    assert.equal(await page.locator('[data-photo-layer]').count(), 1);
    const full = page.locator('[data-current="true"] [data-photo-full]');
    assert.equal(await full.evaluate(node => getComputedStyle(node).opacity), '1');
    assert.equal(await page.locator('[data-photo-placeholder]').evaluate(node => getComputedStyle(node).imageRendering), 'pixelated');
    console.log('PASS photo crossfade preserves the previous blend, uses a pixelated placeholder and cleans up interrupted layers');

    await assertSidebarResize(() => page.locator('[data-color-field="background"]').click());
    await assertSidebarResize(() => page.locator('[data-color-field="foreground"]').click());
    await assertSidebarResize(() => page.keyboard.press('Escape'));
    await assertSidebarResize(() => page.locator('[data-color-field="background"]').click());
    console.log('PASS ColorField real resize opens, switches and closes with no distortion');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    await page.locator('[data-color-field="background"]').click();
    await page.waitForFunction(() => !document.querySelector('[data-layout-moving]'));
    const settled = await page.locator('[data-color-field-shell="background"]').evaluate(node => ({
      height: node.getBoundingClientRect().height,
      finalHeight: node.querySelector('#color-editor').offsetHeight + 66,
      transform: getComputedStyle(node).transform,
    }));
    assert.ok(Math.abs(settled.height - settled.finalHeight) < 1, JSON.stringify(settled));
    assert.equal(settled.transform, 'none');
    console.log('PASS ColorField real resize restores natural editor geometry');
    const slider = page.locator('[data-color-slider]').first();
    await assertSidebarResize(() => page.locator('#contrast-score-panel > button').click());
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Set WCAG contrast to 1.5', exact: true }).click();
    await page.waitForTimeout(60);
    const movingThumb = await slider.locator('[data-slot="slider-thumb"]').evaluate(node => getComputedStyle(node).transform);
    assert.notEqual(movingThumb, 'none', 'Programmatic color changes should ease the handle');
    const track = await slider.boundingBox();
    await page.mouse.move(track.x + track.width * 0.3, track.y + track.height / 2);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width * 0.6, track.y + track.height / 2);
    assert.equal(await slider.locator('[data-slot="slider-thumb"]').evaluate(node => getComputedStyle(node).transform), 'none');
    await page.mouse.up();
    await page.waitForTimeout(260);
    assert.equal(await page.locator('[data-color-editor] [data-odometer-element]').count(), 0);
    assert.equal(await page.locator('[data-contrast-score] [data-odometer-element]').count(), 1);
    console.log('PASS programmatic handle easing, immediate manual drag and score-only numeral animation');

    await page.getByRole('button', { name: 'EXPORT', exact: true }).click();
    await page.getByRole('button', { name: 'COPY', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('[data-export-slot]').getAttribute('data-state'), 'closed');
    assert.equal(await page.locator('[data-export-slot] [data-layout-item]').evaluateAll(nodes => nodes.some(node => node.style.transform)), false);
    console.log('PASS export enter/exit and owned-style cleanup');

    await reset({ width: 393, height: 852 });
    await page.locator('[data-color-field="foreground"]').click();
    await page.waitForTimeout(300);
    const mobile = await page.locator('[data-color-field-shell="foreground"]').evaluate(node => ({
      bounds: node.getBoundingClientRect().toJSON(), footer: document.querySelector('[data-control-footer]').getBoundingClientRect().top,
      scrollWidth: document.documentElement.scrollWidth, width: innerWidth,
    }));
    assert.ok(mobile.bounds.left >= 0 && mobile.bounds.right <= mobile.width, JSON.stringify(mobile));
    assert.ok(mobile.bounds.bottom <= mobile.footer - 15 && mobile.bounds.top >= 15, JSON.stringify(mobile));
    assert.ok(mobile.scrollWidth <= mobile.width, JSON.stringify(mobile));
    await page.screenshot({ path: path.join(output, 'mobile.png') });
    console.log('PASS mobile editor reveal and stable page geometry');

    // Changing the preference while GSAP is running must cancel every transform.
    await page.locator('[data-color-field="background"]').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.cs-controls [data-layout-item]').evaluateAll(nodes => nodes.some(node => node.style.transform)), false);
    await page.locator('[data-responsive-motion="specimen"]').click();
    assert.equal(await page.locator('.cs-specimen-type').evaluate(node => getComputedStyle(node).transform), 'none');
    await page.locator('[data-action="swap"]').click();
    assert.equal(await page.locator('[data-color-slider] [data-slot="slider-thumb"]').evaluateAll(nodes => nodes.some(node => node.style.transform)), false);
    console.log('PASS live reduced-motion changes and immediate slider/specimen states');

    await page.setViewportSize({ width: 1440, height: 980 });
    await page.waitForTimeout(260);
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    assert.deepEqual(errors, []);
    console.log('PASS Phase 7 motion regression; no browser console errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
