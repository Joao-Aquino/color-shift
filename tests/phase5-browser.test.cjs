/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://localhost:3001';
const verifyMobileReveal = require('./mobile-editor-reveal.browser.cjs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 402, height: 874 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    let sequence = 0;
    const mockPhotos = async route => {
      const count = Number(new URL(route.request().url()).searchParams.get('count') ?? 10);
      const photos = Array.from({length: count}, () => ({
        id: `phase5-${sequence++}`, url: '/figma/photo.jpg', thumbUrl: '/figma/photo.jpg', tinyUrl: '/figma/photo.jpg',
        color: '#f7b955', width: 1200, height: 900, alt: 'Reference landscape', photographer: 'Mara Vale',
        photographerUrl: 'https://unsplash.com/@test', photoUrl: 'https://unsplash.com/photos/test',
      }));
      await route.fulfill({json: {photos}});
    };
    await page.route('**/api/photos?*', mockPhotos);
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-color-field]');
    await page.locator('[data-responsive-motion="photo"] img').evaluate(img => img.decode());
    await page.waitForTimeout(350);
    console.log('PASS loads and renders a real bitmap with deterministic photo API');
    await page.screenshot({path: '/tmp/color-shift-mobile-dark.png', fullPage: true});
    const geometry = await page.evaluate(() => ({
      footer: document.querySelector('[data-control-footer]').getBoundingClientRect().toJSON(),
      preview: document.querySelector('.cs-preview-panels').getBoundingClientRect().toJSON(),
      previewPageTop: document.querySelector('.cs-preview-panels').getBoundingClientRect().top + scrollY,
      type: getComputedStyle(document.querySelector('.cs-specimen-type')).fontSize,
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    }));
    console.log('GEOMETRY', JSON.stringify(geometry));
    assert.equal(geometry.preview.height, 240);
    assert.equal(geometry.type, '48px');
    assert.ok(geometry.footer.height >= 96 && geometry.footer.height <= 98);
    assert.ok(geometry.scrollWidth <= 402);

    const themeStyles = await page.locator('.cs-theme-option').evaluateAll(nodes => nodes.map(n => {
      const style = getComputedStyle(n);
      const bounds = n.getBoundingClientRect();
      return {top:style.paddingTop,bottom:style.paddingBottom,minHeight:style.minHeight,minWidth:style.minWidth,height:bounds.height,width:bounds.width};
    }));
    assert.ok(themeStyles.every(n => n.top === '4px' && n.bottom === '4px' && n.minHeight === 'auto' && n.minWidth === 'auto' && n.height === 24 && n.width > n.height));
    const mobileBackdrop = await page.locator('.cs-footer-backdrop').evaluate(n => ({
      display:getComputedStyle(n).display,
      pointer:getComputedStyle(n).pointerEvents,
      gradient:getComputedStyle(n,'::after').backgroundImage,
      layers:[...n.children].map(layer => getComputedStyle(layer).backdropFilter),
      border:getComputedStyle(n.parentElement).borderTopWidth,
    }));
    assert.equal(mobileBackdrop.display,'block');
    assert.equal(mobileBackdrop.pointer,'none');
    assert.equal(mobileBackdrop.border,'0px');
    assert.ok(mobileBackdrop.gradient.startsWith('linear-gradient'));
    assert.deepEqual(mobileBackdrop.layers,['blur(2.5px)','blur(5px)','blur(10px)','blur(20px)']);
    console.log('PASS compact intrinsic theme pills with 4px vertical padding and mobile progressive backdrop');

    await page.locator('[data-color-field="foreground"]').click();
    await page.getByRole('tab', {name: 'HSL', exact: true}).click();
    const targetBefore = await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded');
    await page.getByRole('button', {name: 'Open photo actions', exact: true}).click();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded'), targetBefore);
    assert.equal(await page.locator('.cs-preview-panels').evaluate(n => n.getBoundingClientRect().top + scrollY), geometry.previewPageTop);
    assert.equal(await page.getByRole('tab', {name: 'HSL', exact: true}).getAttribute('data-state'), 'active');
    const order = await page.locator('.cs-mobile-action-list [data-action]').evaluateAll(nodes => nodes.map(n => n.dataset.action));
    assert.deepEqual(order, ['undo', 'shuffle', 'swap', 'fix', 'previous', 'next']);
    const actionPill = await page.locator('.cs-mobile-action-list').evaluate(n => ({
      width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,
      border:getComputedStyle(n).borderTopWidth,radius:getComputedStyle(n).borderRadius,
      buttons:[...n.querySelectorAll('button')].map(button => ({
        width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height,
        border:getComputedStyle(button).borderTopWidth,background:getComputedStyle(button).backgroundColor,
      })),
    }));
    assert.equal(actionPill.width,48);
    assert.equal(actionPill.height,310);
    assert.equal(actionPill.border,'1px');
    assert.equal(actionPill.radius,'9999px');
    assert.ok(actionPill.buttons.every(n => n.width === 46 && n.height === 48 && n.border === '0px' && n.background === 'rgba(0, 0, 0, 0)'));
    console.log('PASS shared action pill border/background with Figma 48x310 geometry');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', {name: 'Open photo actions', exact: true}).getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded'), 'false');
    console.log('PASS action order, editor preservation, Escape priority and focus');

    await page.getByRole('button', {name: 'Light', exact: true}).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    assert.equal(await page.evaluate(() => localStorage.getItem('color-shift-theme')), 'light');
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.waitForSelector('[data-color-field]');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.getByRole('button', {name: 'Open photo actions', exact: true}).click();
    await page.locator('[data-color-field="foreground"]').click();
    await page.getByRole('button', {name: 'Open photo actions', exact: true}).click();
    await page.waitForTimeout(350);
    await page.screenshot({path: '/tmp/color-shift-mobile-light-open.png', fullPage: true});
    await page.locator('[data-export-button]').click();
    await page.waitForSelector('#export-actions');
    assert.equal(await page.getByRole('button', {name: 'Open photo actions', exact: true}).getAttribute('aria-expanded'), 'false');
    assert.ok(await page.getByRole('button', {name: 'COPY', exact: true}).isVisible());
    await page.getByRole('button', {name: 'COPY', exact: true}).click();
    await page.waitForSelector('[data-export-button]');
    assert.ok((await page.evaluate(() => navigator.clipboard.readText())).includes('Color Shift'));
    await page.waitForFunction(() => document.querySelector('[data-export-button]') === document.activeElement);
    console.log('PASS theme persistence and export/menu integration with real clipboard');

    for (const width of [320,390,393,402,639,640,1024,1179,1180,1360]) {
      await page.setViewportSize({width, height: 874});
      await page.waitForTimeout(300);
      const data = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth, footer: getComputedStyle(document.querySelector('[data-control-footer]')).position, hidden: [...document.querySelectorAll('[data-responsive-motion]')].filter(n=>!n.getBoundingClientRect().height).map(n=>n.dataset.responsiveMotion)}));
      assert.ok(data.scroll <= width, JSON.stringify(data));
      assert.equal(data.footer, width < 640 ? 'fixed' : 'static');
      assert.equal(await page.locator('.cs-footer-backdrop').evaluate(n => getComputedStyle(n).display),width < 640 ? 'block' : 'none');
      console.log('PASS layout', width, JSON.stringify(data));
    }
    await page.screenshot({path: '/tmp/color-shift-desktop-light.png', fullPage: true});
    await page.setViewportSize({width:320,height:500});
    await page.locator('[data-export-button]').click();
    await page.waitForSelector('#export-actions');
    const state = await page.evaluate(() => ({footerHeight:document.querySelector('[data-control-footer]').getBoundingClientRect().height,reserved:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cs-footer-height')),buttons:[...document.querySelectorAll('#export-actions button')].map(n=>({width:n.clientWidth,scroll:n.scrollWidth,height:n.clientHeight}))}));
    assert.ok(state.footerHeight >= 148, JSON.stringify(state));
    assert.ok(state.buttons.every(n=>n.width>=n.scroll && n.height>=46),JSON.stringify(state));
    await page.getByRole('button',{name:'Open photo actions',exact:true}).click();
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#export-actions').isVisible());
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-export-button]');
    console.log('PASS narrow export sizing and Escape with export open');

    const fields = () => page.locator('[data-color-field]').evaluateAll(nodes => nodes.map(n => n.textContent.match(/#[0-9A-F]{6}/i)[0]));
    const edit = async (target, value) => {
      await page.locator(`[data-color-field="${target}"]`).click();
      await page.getByRole('tab',{name:'HEX',exact:true}).click();
      await page.getByRole('textbox',{name:'HEX color value',exact:true}).fill(value);
      await page.getByRole('textbox',{name:'HEX color value',exact:true}).press('Enter');
    };
    const action = async key => {
      if (await page.getByRole('button',{name:'Open photo actions',exact:true}).isVisible()) await page.getByRole('button',{name:'Open photo actions',exact:true}).click();
      await page.locator(`.cs-mobile-action-list [data-action="${key}"]`).click();
      await page.waitForFunction(() => document.querySelector('[data-mobile-actions] > button') === document.activeElement);
    };
    await page.setViewportSize({width:402,height:874});
    await edit('foreground','#888888');
    await edit('background','#888888');
    const beforeFix = await fields();
    await action('fix');
    const afterFix = await fields();
    assert.notEqual(afterFix[0], beforeFix[0]);
    assert.equal(afterFix[1], beforeFix[1]);
    assert.equal(await page.locator('[data-color-field="background"]').getAttribute('aria-expanded'),'true');
    await action('undo');
    assert.deepEqual(await fields(), beforeFix);
    await edit('foreground','#083A33');
    const beforeSwap=await fields();
    await action('swap');
    assert.deepEqual(await fields(), [...beforeSwap].reverse());
    assert.equal(await page.locator('[data-color-field="background"]').getAttribute('aria-expanded'),'true');
    await action('undo');
    assert.deepEqual(await fields(), beforeSwap);
    await action('next');
    await page.getByRole('button',{name:'Open photo actions',exact:true}).click();
    assert.ok(await page.locator('.cs-mobile-action-list [data-action="undo"]').isDisabled());
    await page.locator('.cs-mobile-action-list [data-action="previous"]').click();
    assert.deepEqual(await fields(), beforeSwap);
    await action('shuffle');
    await page.waitForFunction(()=>document.querySelector('[data-color-field]') && !document.querySelector('[data-export-button]').disabled);
    console.log('PASS all six actions, active-target Fix/Swap, history and navigation');

    await edit('background','#FFFFFF');
    for(const [color,grade] of [['#000000','AAA'],['#767676','AA'],['#888888','AA Large'],['#DDDDDD','Fail']]) {
      await edit('foreground',color);
      const label=await page.locator('#contrast-score-panel > button').getAttribute('aria-label');
      assert.ok(label.endsWith(grade),label);
      await page.getByRole('button',{name:'Dark',exact:true}).click();
      await page.getByRole('button',{name:'Light',exact:true}).click();
    }
    await page.getByRole('tab',{name:'APCA'}).click();
    assert.ok((await page.locator('#contrast-score-panel > button').getAttribute('aria-label')).startsWith('Lc'));
    await page.getByRole('tab',{name:'WCAG'}).click();
    console.log('PASS Light/Dark score grades and APCA switching');

    await page.getByRole('textbox',{name:'HEX color value',exact:true}).focus();
    const themeBefore=await page.locator('html').getAttribute('data-theme');
    await page.keyboard.press('t');
    assert.equal(await page.locator('html').getAttribute('data-theme'),themeBefore);
    await page.getByRole('textbox',{name:'HEX color value',exact:true}).fill('#DDDDDD');
    await page.getByRole('textbox',{name:'HEX color value',exact:true}).press('Enter');
    await page.locator('body').click({position:{x:2,y:2}});
    await page.keyboard.press('t');
    assert.notEqual(await page.locator('html').getAttribute('data-theme'),themeBefore);
    console.log('PASS T shortcut with editable-control isolation');

    await page.getByRole('button',{name:'Open photo actions',exact:true}).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('.cs-mobile-action-list button:not(:disabled)') === document.activeElement);
    assert.ok(await page.locator('.cs-mobile-action-list button:not(:disabled)').first().evaluate(n=>n===document.activeElement));
    await page.locator('.cs-mobile-action-list [data-action="next"]').focus();
    await page.setViewportSize({width:640,height:874});
    await page.waitForTimeout(350);
    assert.ok(await page.locator('.cs-inline-actions [data-action="next"]').evaluate(n=>n===document.activeElement));
    console.log('PASS keyboard opening and corresponding focus on breakpoint crossing');

    await page.setViewportSize({width:320,height:320});
    await page.getByRole('button',{name:'Open photo actions',exact:true}).click();
    await page.locator('.cs-mobile-action-list [data-action="next"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    const shortBounds=await page.locator('.cs-mobile-action-list').boundingBox();
    assert.ok(shortBounds.y >= 0 && shortBounds.height < 310, JSON.stringify(shortBounds));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.cs-mobile-action-list button').count(),0);
    console.log('PASS short-viewport menu scrolling and reduced-motion dismissal');

    await page.setViewportSize({width:402,height:874});
    const beforeTheme = await fields();
    await page.locator('[data-export-button]').click();
    await page.waitForSelector('#export-actions');
    await page.getByRole('button',{name:'Light',exact:true}).click();
    assert.deepEqual(await fields(), beforeTheme);
    assert.ok(await page.locator('#export-actions').isVisible());
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button',{name:'DOWNLOAD .MD',exact:true}).click();
    const download = await downloadEvent;
    assert.match(download.suggestedFilename(), /^color-shift-[0-9a-f]{6}-[0-9a-f]{6}\.md$/i);
    await page.waitForSelector('[data-export-button]');
    console.log('PASS theme changes during export and real Markdown download');

    await page.getByRole('button',{name:'Show circle specimen',exact:true}).click();
    for (const width of [320,402,640,1180,1360]) {
      await page.setViewportSize({width,height:874});
      await page.waitForTimeout(300);
      const circle = await page.locator('[data-responsive-circle-shape] > span').boundingBox();
      assert.ok(circle.width > 0 && Math.abs(circle.width-circle.height) < 1,JSON.stringify(circle));
    }
    console.log('PASS round, nonzero circle across mobile/tablet/desktop');

    await page.setViewportSize({width:320,height:500});
    await edit('background','#FFFFFF');
    const validPair = await fields();
    const readout = page.getByRole('textbox',{name:'HEX color value',exact:true});
    await readout.fill('invalid');
    await readout.press('Enter');
    assert.equal(await readout.getAttribute('aria-invalid'),'true');
    assert.deepEqual(await fields(),validPair);
    await readout.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const inputBounds = await readout.boundingBox();
    const footerBounds = await page.locator('[data-control-footer]').boundingBox();
    assert.ok(inputBounds.y+inputBounds.height < footerBounds.y,JSON.stringify({inputBounds,footerBounds}));
    console.log('PASS invalid input preservation and last-readout reachability above footer');

    await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('Clipboard blocked for test')};});
    await page.locator('[data-export-button]').click();
    await page.getByRole('button',{name:'COPY',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Unable to copy'}).waitFor();
    assert.ok(await page.getByRole('button',{name:'COPY',exact:true}).isEnabled());
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-export-button]');
    console.log('PASS clipboard failure remains announced and recoverable');

    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
    assert.equal(await page.locator('.cs-footer-backdrop').evaluate(n => getComputedStyle(n).display),'none');
    const solidFooter = await page.locator('html').getAttribute('data-theme') === 'light' ? 'rgb(255, 255, 255)' : 'rgb(10, 10, 10)';
    await page.waitForFunction(color => getComputedStyle(document.querySelector('.cs-footer')).backgroundColor === color,solidFooter);
    await cdp.send('Emulation.setEmulatedMedia',{features:[]});
    await cdp.detach();
    console.log('PASS reduced-transparency solid footer fallback');

    const blockedContext=await browser.newContext({viewport:{width:402,height:874}});
    const blockedPage=await blockedContext.newPage();
    blockedPage.on('pageerror',e=>errors.push(e.message));
    await blockedPage.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked for test')}})});
    await blockedPage.route('**/api/photos?*',mockPhotos);
    await blockedPage.goto(baseURL,{waitUntil:'domcontentloaded'});
    await blockedPage.getByRole('button',{name:'Light',exact:true}).click();
    assert.equal(await blockedPage.locator('html').getAttribute('data-theme'),'light');
    await blockedContext.close();
    console.log('PASS theme switching with blocked browser storage');

    await verifyMobileReveal(browser, baseURL, mockPhotos, errors);

    for (const reducedMotion of ['no-preference', 'reduce']) {
      const revealContext = await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true,reducedMotion});
      const revealPage = await revealContext.newPage();
      revealPage.on('pageerror', e => errors.push(e.message));
      await revealPage.route('**/api/photos?*', mockPhotos);
      for (const theme of ['Dark', 'Light']) {
        await revealPage.goto(baseURL, {waitUntil:'domcontentloaded'});
        await revealPage.getByRole('button', {name:theme,exact:true}).tap();
        await revealPage.waitForSelector('[data-color-field]');
        await revealPage.evaluate(() => window.scrollTo(0,0));
        for (const target of ['background', 'foreground']) {
          await revealPage.locator(`[data-color-field="${target}"]`).tap();
          for (const format of ['HEX', 'RGB', 'HSL', 'HSB', 'OKLCH']) {
            await revealPage.getByRole('tab', {name:format,exact:true}).tap();
            await revealPage.waitForTimeout(500);
            await revealPage.waitForFunction(target => {
              const bounds = document.querySelector(`[data-color-field-shell="${target}"]`).getBoundingClientRect();
              const footer = document.querySelector('[data-control-footer]').getBoundingClientRect();
              return bounds.top >= 15 && bounds.bottom <= footer.top - 15;
            }, target);
          }
        }
        assert.ok(await revealPage.evaluate(() => scrollY > 0));
        await revealPage.screenshot({path:`/tmp/color-shift-editor-reveal-${theme.toLowerCase()}-${reducedMotion}.png`});
      }
      await revealPage.setViewportSize({width:320,height:320});
      await revealPage.reload({waitUntil:'domcontentloaded'});
      await revealPage.locator('[data-color-field="foreground"]').tap();
      await revealPage.getByRole('tab', {name:'HSL',exact:true}).tap();
      await revealPage.waitForTimeout(700);
      assert.ok(Math.abs((await revealPage.locator('[data-color-field-shell="foreground"]').boundingBox()).y - 16) < 2);
      await revealContext.close();
    }
    console.log('PASS automatic editor reveal for both targets, all formats/themes, reduced motion and short viewports');

    await page.setViewportSize({width:2520,height:1314});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-color-field="foreground"]').click();
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => scrollY),0);
    await page.locator('.cs-header').screenshot({path:'/tmp/color-shift-theme-pill-desktop.png'});
    console.log('PASS desktop editor does not trigger page scrolling');
    console.log('ERRORS', JSON.stringify(errors));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
