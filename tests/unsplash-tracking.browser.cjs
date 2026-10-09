/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://127.0.0.1:3002';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ permissions: ['clipboard-read', 'clipboard-write'] });
    const tracked = [];
    const hotlinkedUrl = 'https://images.unsplash.com/photo-test?ixid=preserved&w=2400';
    await page.route('https://images.unsplash.com/photo-test?*', route => route.fulfill({
      contentType: 'image/jpeg',
      body: fs.readFileSync(path.join(__dirname, '../public/figma/photo.jpg')),
    }));
    await page.route('**/api/photos?*', route => route.fulfill({ json: { photos: Array.from({ length: 10 }, (_, index) => ({
      id: `tracked-${index}`, url: hotlinkedUrl, thumbUrl: '/figma/photo.jpg', tinyUrl: '/figma/photo.jpg',
      color: '#f7b955', width: 1200, height: 900, alt: 'Reference landscape', photographer: 'Mara Vale',
      photographerUrl: 'https://unsplash.com/@test', photoUrl: 'https://unsplash.com/photos/test',
      downloadLocation: `https://api.unsplash.com/photos/tracked-${index}/download?ixid=preserved`,
    })) } }));
    await page.route('**/api/photos/download', async route => {
      tracked.push(route.request().postDataJSON());
      await route.fulfill({ status: 204 });
    });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-color-field]');
    assert.equal(await page.locator('[data-photo-layer][data-current="true"] [data-photo-full]').getAttribute('src'), hotlinkedUrl);
    assert.match(await page.locator('.cs-credit').innerText(), /Photo\s+by\s+Mara Vale\s+on\s+Unsplash/i);
    await page.getByRole('button', { name: 'EXPORT' }).click();
    await page.getByRole('button', { name: 'COPY' }).click();
    await page.waitForFunction(() => document.querySelector('[data-export-slot]')?.textContent.includes('COPIED'));
    await page.waitForTimeout(100);
    assert.deepEqual(tracked, [{ photoId: 'tracked-0', location: 'https://api.unsplash.com/photos/tracked-0/download?ixid=preserved' }]);

    const bytes = fs.readFileSync(path.join(__dirname, '../public/figma/photo.jpg')).toString('base64');
    await page.locator('section[aria-label="Source photo"]').evaluate((target, encoded) => {
      const data = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
      const transfer = new DataTransfer();
      transfer.items.add(new File([data], 'personal.jpg', { type: 'image/jpeg' }));
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
    }, bytes);
    await page.getByText('Your photo · personal.jpg').waitFor();
    await page.getByRole('button', { name: 'EXPORT' }).click();
    await page.getByRole('button', { name: 'COPY' }).click();
    await page.waitForTimeout(100);
    assert.equal(tracked.length, 1, 'personal photos must not call Unsplash tracking');
    console.log('PASS completed Unsplash export tracks returned location; personal export does not');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
