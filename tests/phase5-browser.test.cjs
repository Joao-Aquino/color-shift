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
    assert.equal(await page.locator('[data-responsive-motion="photo"] button').count(), 3);
    assert.equal(await page.getByRole('button', {name:'Load a new Unsplash photo'}).count(), 0);
    await page.locator('[data-photo-layer][data-current="true"] [data-photo-full]').evaluate(img => img.decode());
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

    await page.setViewportSize({width:1440,height:980});
    await page.waitForFunction(() => {
      const sizeMatches = innerWidth === 1440 && [...document.querySelectorAll('.cs-panel-actions [data-action]')].every(node => {
        const bounds = node.getBoundingClientRect();
        return Math.abs(bounds.width - 48) < 0.01 && Math.abs(bounds.height - 48) < 0.01;
      });
      const moving = [...document.querySelectorAll('[data-responsive-motion]')].some(node => node.style.transform);
      window.phase5LayoutStableCount = sizeMatches && !moving ? (window.phase5LayoutStableCount || 0) + 1 : 0;
      return window.phase5LayoutStableCount >= 3;
    }, null, { polling: 'raf' });
    const desktopActions = await page.evaluate(() => {
      const specimen = document.querySelector('.cs-specimen-panel').getBoundingClientRect();
      const photo = document.querySelector('[data-responsive-motion="photo"]').getBoundingClientRect();
      const credit = document.querySelector('.cs-credit').getBoundingClientRect();
      return ['specimen','photo'].map((group, index) => {
        const panel = index === 0 ? specimen : photo;
        const root = document.querySelector(`.cs-panel-actions[aria-label="${index === 0 ? 'Color actions' : 'Photo controls'}"]`);
        const bounds = root.getBoundingClientRect();
        return {
          group,
          actions:[...root.querySelectorAll('[data-action]')].map(button => ({
            name:button.dataset.action,
            width:button.getBoundingClientRect().width,
            height:button.getBoundingClientRect().height,
            background:getComputedStyle(button).backgroundColor,
            iconWidth:button.querySelector('svg').getBoundingClientRect().width,
          })),
          centered:Math.abs((bounds.left+bounds.right)/2-(panel.left+panel.right)/2)<1,
          bottom:Math.abs(panel.bottom-bounds.bottom),
          creditAbove:credit.bottom < bounds.top,
        };
      });
    });
    assert.deepEqual(desktopActions.map(group => group.actions.map(action => action.name)),[['undo','swap','fix'],['previous','shuffle','next']]);
    assert.ok(desktopActions.every(group => group.centered && group.bottom === 16 && group.creditAbove),JSON.stringify(desktopActions));
    assert.ok(desktopActions.every(group => group.actions.every(action => action.width === 48 && action.height === 48 && action.iconWidth === 16 && action.background === 'rgb(26, 26, 26)')),JSON.stringify(desktopActions));
    await page.screenshot({path:'/tmp/color-shift-relocated-desktop.png'});
    const specimenLabel = await page.locator('[data-responsive-motion="specimen"]').getAttribute('aria-label');
    const originalColors = await page.locator('[data-color-field]').evaluateAll(nodes => nodes.map(node => node.textContent.match(/#[0-9A-F]{6}/i)[0]));
    await page.locator('.cs-panel-actions [data-action="swap"]').click();
    assert.deepEqual(await page.locator('[data-color-field]').evaluateAll(nodes => nodes.map(node => node.textContent.match(/#[0-9A-F]{6}/i)[0])),[...originalColors].reverse());
    assert.equal(await page.locator('[data-responsive-motion="specimen"]').getAttribute('aria-label'),specimenLabel);
    await page.locator('.cs-panel-actions [data-action="undo"]').click();
    assert.deepEqual(await page.locator('[data-color-field]').evaluateAll(nodes => nodes.map(node => node.textContent.match(/#[0-9A-F]{6}/i)[0])),originalColors);
    await page.locator('.cs-panel-actions [data-action="next"]').click();
    assert.ok(await page.locator('.cs-panel-actions [data-action="previous"]').isEnabled());
    await page.locator('.cs-panel-actions [data-action="previous"]').click();
    assert.ok(await page.locator('.cs-panel-actions [data-action="previous"]').isDisabled());
    await page.setViewportSize({width:402,height:874});
    console.log('PASS Figma desktop action placement, specimen click isolation, undo, and photo navigation');

    await page.locator('[data-color-field="foreground"]').click();
    await page.getByRole('tab', {name: 'HSL', exact: true}).click();
    const targetBefore = await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded');
    await page.locator('.cs-panel-actions [data-action="next"]').focus();
    assert.equal(await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded'), targetBefore);
    assert.equal(await page.locator('.cs-preview-panels').evaluate(n => n.getBoundingClientRect().top + scrollY), geometry.previewPageTop);
    assert.equal(await page.getByRole('tab', {name: 'HSL', exact: true}).getAttribute('data-state'), 'active');
    assert.deepEqual(await page.locator('.cs-panel-actions').evaluateAll(groups => groups.map(group => [...group.querySelectorAll('[data-action]')].map(button => button.dataset.action))),[['undo','swap','fix'],['previous','shuffle','next']]);
    assert.equal(await page.locator('.cs-panel-actions [data-action="next"]').evaluate(node => node === document.activeElement),true);
    console.log('PASS visible mobile action groups preserve editor state and focus');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded'), 'false');

    await page.getByRole('button', {name: 'Light', exact: true}).click();
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    assert.equal(await page.evaluate(() => localStorage.getItem('color-shift-theme')), 'light');
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.waitForSelector('[data-color-field]');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.locator('[data-color-field="foreground"]').click();
    await page.waitForTimeout(350);
    await page.screenshot({path: '/tmp/color-shift-mobile-light-actions.png', fullPage: true});
    await page.locator('[data-export-button]').click();
    await page.waitForSelector('#export-actions');
    assert.ok(await page.locator('.cs-panel-actions [data-action="next"]').isVisible());
    assert.ok(await page.getByRole('button', {name: 'COPY', exact: true}).isVisible());
    await page.getByRole('button', {name: 'COPY', exact: true}).click();
    await page.waitForSelector('[data-export-button]');
    assert.ok((await page.evaluate(() => navigator.clipboard.readText())).includes('Color Shift'));
    await page.waitForFunction(() => document.querySelector('[data-export-button]') === document.activeElement);
    console.log('PASS theme persistence, visible actions, and export with real clipboard');

    for (const width of [320,390,393,402,639,640,1024,1179,1180,1360]) {
      await page.setViewportSize({width, height: 874});
      await page.waitForTimeout(300);
      const data = await page.evaluate(() => ({
        width:innerWidth,
        scroll:document.documentElement.scrollWidth,
        footer:getComputedStyle(document.querySelector('[data-control-footer]')).position,
        hidden:[...document.querySelectorAll('[data-responsive-motion]')].filter(n=>!n.getBoundingClientRect().height).map(n=>n.dataset.responsiveMotion),
        groups:[...document.querySelectorAll('.cs-panel-actions')].map(group => {
          const panel=group.parentElement.getBoundingClientRect(), bounds=group.getBoundingClientRect();
          return {fit:bounds.left>=panel.left-1 && bounds.right<=panel.right+1,centered:Math.abs((bounds.left+bounds.right)/2-(panel.left+panel.right)/2)<1,bottom:Math.round(panel.bottom-bounds.bottom),sizes:[...group.querySelectorAll('button')].map(button=>Math.round(button.getBoundingClientRect().width))};
        }),
      }));
      assert.ok(data.scroll <= width, JSON.stringify(data));
      assert.equal(data.footer, width < 640 ? 'fixed' : 'static');
      assert.equal(await page.locator('.cs-footer-backdrop').evaluate(n => getComputedStyle(n).display),width < 640 ? 'block' : 'none');
      assert.ok(data.groups.every(group=>group.fit && group.centered && group.bottom===(width<640?8:16) && group.sizes.every(size=>size===(width<360?40:width<640?44:48))),JSON.stringify(data));
      console.log('PASS layout', width, JSON.stringify(data));
    }
    await page.screenshot({path: '/tmp/color-shift-desktop-light.png', fullPage: true});
    await page.setViewportSize({width:320,height:500});
    await page.locator('[data-export-button]').click();
    await page.waitForSelector('#export-actions');
    const state = await page.evaluate(() => ({footerHeight:document.querySelector('[data-control-footer]').getBoundingClientRect().height,reserved:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cs-footer-height')),buttons:[...document.querySelectorAll('#export-actions button')].map(n=>({width:n.clientWidth,scroll:n.scrollWidth,height:n.clientHeight}))}));
    assert.ok(state.footerHeight >= 148, JSON.stringify(state));
    assert.ok(state.buttons.every(n=>n.width>=n.scroll && n.height>=46),JSON.stringify(state));
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
    const action = async key => page.locator(`.cs-panel-actions [data-action="${key}"]`).click();
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
    assert.ok(await page.locator('.cs-panel-actions [data-action="undo"]').isDisabled());
    await action('previous');
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
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
      await page.getByRole('button',{name:'Light',exact:true}).click();
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
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
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    assert.notEqual(await page.locator('html').getAttribute('data-theme'),themeBefore);
    console.log('PASS T shortcut with editable-control isolation');

    await page.locator('.cs-panel-actions [data-action="next"]').focus();
    await page.setViewportSize({width:640,height:874});
    await page.waitForTimeout(350);
    assert.ok(await page.locator('.cs-panel-actions [data-action="next"]').evaluate(n=>n===document.activeElement));
    await page.setViewportSize({width:402,height:874});
    assert.ok(await page.locator('.cs-panel-actions [data-action="next"]').evaluate(n=>n===document.activeElement));
    console.log('PASS action focus persists across mobile and desktop breakpoints');

    await page.setViewportSize({width:320,height:320});
    // Resize/matchMedia schedule the breakpoint Flip on the next frame.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(() => [...document.querySelectorAll('[data-responsive-motion]')].every(node => !node.style.transform));
    await page.evaluate(() => window.scrollBy(0,120));
    const shortBounds=await page.locator('.cs-panel-actions [data-action="next"]').boundingBox();
    const shortFooter=await page.locator('[data-control-footer]').boundingBox();
    assert.ok(shortBounds.y>=0 && shortBounds.y+shortBounds.height<=shortFooter.y,JSON.stringify({shortBounds,shortFooter}));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('.cs-panel-actions [data-action="next"]').click();
    console.log('PASS short-viewport actions remain reachable above the fixed footer');

    await page.setViewportSize({width:402,height:874});
    const beforeTheme = await fields();
    await page.locator('[data-export-button]').click();
    await page.waitForSelector('#export-actions');
    await page.getByRole('button',{name:'Light',exact:true}).click();
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    assert.deepEqual(await fields(), beforeTheme);
    assert.ok(await page.locator('#export-actions').isVisible());
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button',{name:'DOWNLOAD .MD',exact:true}).click();
    const download = await downloadEvent;
    assert.match(download.suggestedFilename(), /^color-shift-[0-9a-f]{6}-[0-9a-f]{6}\.md$/i);
    await page.waitForSelector('[data-export-button]');
    console.log('PASS theme changes during export and real Markdown download');

    const specimenText = page.getByRole('textbox', { name: 'Specimen text' });
    await specimenText.fill('A long specimen with multiple lines\n' + 'color '.repeat(14));
    await specimenText.press('Escape');
    for (const width of [320,402,640,1180,1360]) {
      await page.setViewportSize({width,height:874});
      await page.waitForTimeout(300);
      const fitting = await specimenText.evaluate(node => ({
        width: node.clientWidth, height: node.clientHeight,
        contentWidth: node.scrollWidth, contentHeight: node.scrollHeight,
        panel: node.closest('[data-responsive-motion="specimen"]').clientHeight,
      }));
      assert.ok(fitting.width > 0 && fitting.height > 0 && fitting.height < fitting.panel * 0.7, JSON.stringify(fitting));
      assert.ok(fitting.contentWidth <= fitting.width + 2 && fitting.contentHeight <= fitting.height + 2, JSON.stringify(fitting));
    }
    await specimenText.fill('Aa');
    await specimenText.press('Escape');
    console.log('PASS inline specimen text fits across mobile/tablet/desktop');

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
    await blockedPage.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    assert.equal(await blockedPage.locator('html').getAttribute('data-theme'),'light');
    await blockedContext.close();
    console.log('PASS theme switching with blocked browser storage');

    const retryContext=await browser.newContext({viewport:{width:402,height:874}});
    const retryPage=await retryContext.newPage();
    retryPage.on('pageerror',e=>errors.push(e.message));
    let failInitialLoad=true;
    await retryPage.route('**/api/photos?*',async route=>{
      if(failInitialLoad){
        failInitialLoad=false;
        await route.fulfill({status:502,json:{error:'Temporary photo failure'}});
      } else {
        await mockPhotos(route);
      }
    });
    await retryPage.goto(baseURL,{waitUntil:'domcontentloaded'});
    await retryPage.getByRole('button',{name:'Retry'}).click();
    await retryPage.waitForSelector('[data-color-field]');
    assert.equal(await retryPage.locator('[data-photo-layer][data-current="true"] [data-photo-full]').count(),1);
    assert.equal(await retryPage.locator('.cs-credit').count(),1);
    assert.ok(await retryPage.locator('[data-action="shuffle"]').isEnabled());
    await retryPage.waitForFunction(()=>!document.querySelector('[data-action="next"]').disabled);
    assert.equal(await retryPage.getByRole('button',{name:'Retry'}).count(),0);
    await retryContext.close();
    console.log('PASS initial photo failure recovers after Retry');

    await verifyMobileReveal(browser, baseURL, mockPhotos, errors);

    for (const reducedMotion of ['no-preference', 'reduce']) {
      const revealContext = await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true,reducedMotion});
      const revealPage = await revealContext.newPage();
      revealPage.on('pageerror', e => errors.push(e.message));
      await revealPage.route('**/api/photos?*', mockPhotos);
      for (const theme of ['Dark', 'Light']) {
        await revealPage.goto(baseURL, {waitUntil:'domcontentloaded'});
        await revealPage.getByRole('button', {name:theme,exact:true}).tap();
        await revealPage.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
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
