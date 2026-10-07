/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://127.0.0.1:3001';
const photoBytes = fs.readFileSync(path.join(__dirname, '../public/figma/photo.jpg')).toString('base64');

async function dropFile(page, name, mimeType, bytes) {
  await page.locator('[data-responsive-motion="photo"]').evaluate((target, fileData) => {
    const binary = atob(fileData.bytes);
    const data = Uint8Array.from(binary, character => character.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([data], fileData.name, { type: fileData.mimeType }));
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
  }, { name, mimeType, bytes });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 402, height: 874 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    let nextId = 0;
    await page.route('**/api/photos?*', async route => {
      const count = Number(new URL(route.request().url()).searchParams.get('count') ?? 10);
      const photos = Array.from({ length: count }, () => ({
        id: `phase6-${nextId++}`, url: '/figma/photo.jpg', thumbUrl: '/figma/photo.jpg', tinyUrl: '/figma/photo.jpg',
        color: '#f7b955', width: 1200, height: 900, alt: 'Reference landscape', photographer: 'Mara Vale',
        photographerUrl: 'https://unsplash.com/@test', photoUrl: 'https://unsplash.com/photos/test',
      }));
      await route.fulfill({ json: { photos } });
    });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-color-field]');

    await page.getByRole('button', { name: 'Edit specimen text' }).click();
    const input = page.getByRole('textbox', { name: 'Specimen text' });
    await input.fill('Sample content');
    await input.press('s');
    assert.equal(await input.inputValue(), 'Sample contents');
    await input.press('Escape');
    assert.equal(await page.locator('.cs-specimen-type').innerText(), 'Sample contents');
    await page.locator('[data-action="next"]').click();
    assert.equal(await page.locator('.cs-specimen-type').innerText(), 'Sample contents');
    await page.locator('[data-responsive-motion="specimen"]').click();
    assert.ok(await page.locator('[data-responsive-motion="circle"]').isVisible());
    await page.getByRole('button', { name: 'Edit specimen text' }).click();
    assert.equal(await input.inputValue(), 'Sample contents');
    await input.press('Escape');

    await page.locator('[data-responsive-motion="photo"]').evaluate(target => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['preview'], 'my-image.jpg', { type: 'image/jpeg' }));
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
    });
    const dropState = page.locator('.cs-photo-drop');
    await page.waitForFunction(() => document.querySelector('.cs-photo-drop').dataset.active === 'true');
    assert.deepEqual(await dropState.evaluate(node => {
      const style = getComputedStyle(node);
      return [style.transitionProperty, style.transitionDuration];
    }), ['opacity, transform, visibility', '0.2s, 0.2s, 0s']);
    await page.waitForTimeout(260);
    assert.ok((await dropState.locator('.cs-photo-drop-icon').evaluate(node => getComputedStyle(node).backgroundImage)).includes('/figma/icon-upload.svg'));
    assert.equal(await dropState.locator('.cs-photo-drop-title').innerText(), 'Drag your image to extract the colors');
    assert.equal(await dropState.locator('.cs-photo-drop-formats').innerText(), 'JPEG, PNG, WebP, AVIF and GIF up to 20 MB');
    assert.equal(await dropState.evaluate(node => getComputedStyle(node).backdropFilter), 'blur(5px)');
    assert.equal(await page.locator('[aria-label="Photo controls"]').evaluate(node => getComputedStyle(node).visibility), 'hidden');
    assert.equal(await page.locator('.cs-credit').evaluate(node => getComputedStyle(node).visibility), 'hidden');
    await page.screenshot({ path: '/tmp/color-shift-phase6-drop-mobile.png' });
    await dropFile(page, 'my-image.jpg', 'image/jpeg', photoBytes);
    await page.waitForFunction(() => document.querySelector('.cs-photo-drop').dataset.active === 'false');
    assert.equal(await dropState.evaluate(node => getComputedStyle(node).transitionDuration), '0.15s, 0.15s, 0s');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.cs-photo-drop')).visibility === 'hidden');
    assert.equal(await page.locator('[aria-label="Photo controls"]').evaluate(node => getComputedStyle(node).visibility), 'visible');
    await page.getByText('Your photo · my-image.jpg').waitFor();
    await page.screenshot({ path: '/tmp/color-shift-phase6-mobile.png' });
    const localImage = page.locator('[data-responsive-motion="photo"] img');
    assert.ok((await localImage.getAttribute('src')).startsWith('blob:'));
    assert.equal(await page.locator('.cs-import-error').count(), 0);
    assert.ok(await page.locator('[data-action="previous"]').isEnabled());
    await page.locator('[data-action="previous"]').click();
    await page.locator('[data-action="next"]').click();
    await page.getByText('Your photo · my-image.jpg').waitFor();

    await page.getByRole('button', { name: 'EXPORT' }).click();
    await page.getByRole('button', { name: 'COPY' }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.includes('Personal photo: my-image.jpg.'));
    assert.ok(!copied.includes('Unsplash'));

    await dropFile(page, 'invalid.txt', 'text/plain', Buffer.from('not an image').toString('base64'));
    await page.getByRole('alert').getByText('Use a JPEG, PNG, WebP, AVIF, or GIF image.').waitFor();
    await page.getByRole('button', { name: 'Dismiss image error' }).click();
    assert.equal(await page.locator('.cs-import-error').count(), 0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.cs-specimen-type').innerText(), 'Sample contents');
    assert.ok((await page.locator('[data-responsive-motion="photo"] img').getAttribute('src')).startsWith('blob:'));
    await page.screenshot({ path: '/tmp/color-shift-phase6-desktop.png' });
    await page.locator('[data-responsive-motion="photo"]').evaluate(target => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['preview'], 'another.jpg', { type: 'image/jpeg' }));
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
    });
    await page.waitForFunction(() => document.querySelector('.cs-photo-drop').dataset.active === 'true');
    await page.waitForTimeout(260);
    const dropGeometry = await dropState.evaluate(node => {
      const bounds = node.getBoundingClientRect();
      const panel = node.parentElement.getBoundingClientRect();
      const icon = node.querySelector('.cs-photo-drop-icon').getBoundingClientRect();
      return { inset: bounds.left - panel.left, iconWidth: icon.width, iconHeight: icon.height, border: getComputedStyle(node).borderStyle };
    });
    assert.deepEqual(dropGeometry, { inset: 16, iconWidth: 32, iconHeight: 32, border: 'dashed' });
    await page.screenshot({ path: '/tmp/color-shift-phase6-drop-desktop.png' });
    await page.locator('[data-responsive-motion="photo"]').evaluate(target => {
      target.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
    });
    await page.waitForFunction(() => document.querySelector('.cs-photo-drop').dataset.active === 'false');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.cs-photo-drop')).visibility === 'hidden');
    const stableDropNode = await dropState.elementHandle();
    await page.locator('[data-responsive-motion="photo"]').evaluate(target => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['preview'], 'rapid.jpg', { type: 'image/jpeg' }));
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
    });
    await page.waitForTimeout(50);
    await page.locator('[data-responsive-motion="photo"]').evaluate(target => target.dispatchEvent(new DragEvent('dragleave', { bubbles: true })));
    await page.locator('[data-responsive-motion="photo"]').evaluate(target => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['preview'], 'rapid.jpg', { type: 'image/jpeg' }));
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
    });
    assert.equal(await stableDropNode.evaluate(node => node === document.querySelector('.cs-photo-drop')), true);
    await page.waitForTimeout(260);
    assert.equal(await dropState.evaluate(node => getComputedStyle(node).opacity), '1');
    await page.locator('[data-responsive-motion="photo"]').evaluate(target => target.dispatchEvent(new DragEvent('dragleave', { bubbles: true })));
    assert.deepEqual(errors, []);

    const recoveryPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await recoveryPage.route('**/api/photos?*', route => route.fulfill({ status: 503, json: { error: 'Photos unavailable.' } }));
    await recoveryPage.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await recoveryPage.getByText('Photos unavailable.').waitFor();
    await recoveryPage.emulateMedia({ reducedMotion: 'reduce' });
    await recoveryPage.locator('[data-responsive-motion="photo"]').evaluate(target => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['preview'], 'still.jpg', { type: 'image/jpeg' }));
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
    });
    assert.equal(await recoveryPage.locator('.cs-photo-drop').evaluate(node => getComputedStyle(node).transform), 'none');
    assert.equal(await recoveryPage.locator('.cs-photo-drop').evaluate(node => getComputedStyle(node).transitionProperty), 'opacity, visibility');
    await dropFile(recoveryPage, 'offline.jpg', 'image/jpeg', photoBytes);
    await recoveryPage.getByText('Your photo · offline.jpg').waitFor();
    assert.ok(await recoveryPage.locator('[data-color-field="background"]').isEnabled());
    assert.equal(await recoveryPage.getByText('Photos unavailable.').count(), 0);
    console.log('PASS editable specimen, local photo palette/navigation/export, invalid file handling, no console errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
