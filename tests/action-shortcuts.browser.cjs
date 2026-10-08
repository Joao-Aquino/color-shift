/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://localhost:3002';

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:1440,height:980}});
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/photos?*', route => route.fulfill({json:{photos:Array.from({length:10},(_,id) => ({
      id:`shortcut-${id}`,url:'/figma/photo.jpg',thumbUrl:'/figma/photo.jpg',tinyUrl:'/figma/photo.jpg',
      color:'#f7b955',width:1200,height:900,alt:'Reference landscape',photographer:'Mara Vale',
      photographerUrl:'https://unsplash.com/@test',photoUrl:'https://unsplash.com/photos/test',
    }))}}));
    await page.goto(baseURL,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('[data-color-field]');
    const pair = () => page.locator('[data-color-field]').allTextContents();
    const fix = page.locator('[data-action="fix"]');
    const slot = page.locator('[data-export-slot]');
    for (const target of ['background','foreground']) {
      await page.locator(`[data-color-field="${target}"]`).click();
      const input = page.getByRole('textbox',{name:'HEX color value',exact:true});
      await input.fill('#FFFFFF');
      await input.press('Enter');
      await page.keyboard.press('Escape');
    }
    await page.locator('h1').click();
    const lowContrast = await pair();
    assert.ok(await fix.isEnabled());
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown',{key:'f',repeat:true,bubbles:true,cancelable:true})));
    assert.deepEqual(await pair(),lowContrast);
    const specimen = page.getByRole('textbox',{name:'Specimen text'});
    await specimen.fill('Draft');
    await specimen.press('f');
    assert.equal(await specimen.inputValue(),'Draftf');
    assert.deepEqual(await pair(),lowContrast,'F must remain text during typing');
    await specimen.press('Escape');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.querySelector('[data-action="fix"]').disabled);
    const fixed = await pair();
    assert.notDeepEqual(fixed,lowContrast);
    await page.keyboard.press('Control+z');
    assert.deepEqual(await pair(),lowContrast);
    await fix.click();
    assert.deepEqual(await pair(),fixed,'F and clicking must apply the same correction');
    await page.locator('h1').click();
    await page.keyboard.press('F');
    assert.deepEqual(await pair(),fixed,'Already passing contrast remains unchanged');
    console.log('PASS F matches Fix click, respects typing, repeat and unavailable correction, and retains Undo');

    await specimen.focus();
    await page.keyboard.press('Meta+s');
    await page.waitForFunction(() => document.querySelector('[data-export-slot]').dataset.state === 'loading');
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown',{key:'s',metaKey:true,repeat:true,bubbles:true,cancelable:true})));
    await page.waitForFunction(() => document.querySelector('[data-export-slot]').dataset.state === 'open');
    await page.getByRole('button',{name:'COPY',exact:true}).waitFor({state:'visible'});
    assert.equal(await specimen.inputValue(),'Draftf');
    assert.equal(await page.getByRole('button',{name:'COPY',exact:true}).evaluate(node => document.activeElement === node),true);
    await page.keyboard.press('Meta+s');
    assert.equal(await slot.getAttribute('data-state'),'open');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('[data-export-slot]').dataset.state === 'closed');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.keyboard.press('Control+s');
    await page.waitForFunction(() => document.querySelector('[data-export-slot]').dataset.state === 'open');
    assert.equal(await page.locator('[data-layout-moving]').count(),0);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('[data-export-slot]').dataset.state === 'closed');
    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent('keydown',{key:'s',ctrlKey:true,repeat:true,bubbles:true,cancelable:true});
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    assert.equal(prevented,true);
    assert.equal(await slot.getAttribute('data-state'),'closed');
    assert.deepEqual(errors,[]);
    console.log('PASS Command/Control+S opens Export with shared animation/focus, repeat protection, Escape and reduced motion');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
