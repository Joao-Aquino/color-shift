/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:2520,height:1314}});
    await page.addInitScript(() => Object.defineProperty(navigator, 'platform', {value:'MacIntel', configurable:true}));
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    let sequence = 0;
    await page.route('**/api/photos?*', route => route.fulfill({json:{photos:Array.from({length:10}, () => ({
      id:`annotation-${sequence++}`,url:'/figma/photo.jpg',thumbUrl:'/figma/photo.jpg',tinyUrl:'/figma/photo.jpg',
      color:'#f7b955',width:1200,height:900,alt:'Reference landscape',photographer:'Mara Vale',
      photographerUrl:'https://unsplash.com/@test',photoUrl:'https://unsplash.com/photos/test',
    }))}}));
    await page.goto(baseURL,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('[data-color-field]');
    await page.locator('[data-photo-layer][data-current="true"] [data-photo-full]').evaluate(image => image.decode());

    for (const width of [2520,640,393,320]) {
      await page.setViewportSize({width,height:width === 2520 ? 1314 : 852});
      await page.locator('[data-color-field="foreground"]').click();
      for (const format of ['HEX','RGB','HSL','HSB','OKLCH']) {
        await page.getByRole('tab',{name:format,exact:true}).click();
        await page.waitForTimeout(250);
        const aligned = await page.locator('[data-color-editor]').evaluate((editor, format) => {
          const readout = editor.querySelector(`input[aria-label="${format} color value"]`);
          const label = readout.parentElement.previousElementSibling;
          return {
            labelWidth:label.getBoundingClientRect().width,
            inputLeft:readout.getBoundingClientRect().left,
            channels:[...editor.querySelectorAll('[data-slot="slider"]')].map(slider => ({
              labelWidth:slider.parentElement.previousElementSibling.getBoundingClientRect().width,
              left:slider.getBoundingClientRect().left,
            })),
            overflow:document.documentElement.scrollWidth > innerWidth,
            inputs:[...editor.querySelectorAll('input')].map(input => getComputedStyle(input).backgroundColor),
          };
        },format);
        assert.equal(aligned.labelWidth,74);
        assert.ok(aligned.channels.every(channel => channel.labelWidth === 74 && Math.abs(channel.left-aligned.inputLeft) < 1),JSON.stringify(aligned));
        assert.equal(aligned.overflow,false);
        assert.ok(aligned.inputs.every(color => color === 'rgba(0, 0, 0, 0)'),JSON.stringify(aligned));
      }
      if (width === 2520) await page.locator('[data-color-field-shell="foreground"]').screenshot({path:'/tmp/color-shift-aligned-readout-desktop.png'});
      await page.keyboard.press('Escape');
    }
    console.log('PASS readout/sliders share 74px labels and aligned input starts in all formats at four widths');

    await page.setViewportSize({width:1440,height:980});
    for (const theme of ['Light','Dark']) {
      await page.getByRole('button',{name:theme,exact:true}).click();
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
      await page.locator('[data-color-field="foreground"]').click();
      for (const format of ['HEX','RGB','HSL','HSB','OKLCH']) {
        await page.getByRole('tab',{name:format,exact:true}).click();
        await page.waitForTimeout(250);
        const style = await page.locator('[data-color-editor]').evaluate(editor => ({
          background:getComputedStyle(editor.querySelector('[data-format-indicator]')).backgroundColor,
          text:getComputedStyle(editor.querySelector('[role="tab"][aria-selected="true"]')).color,
          inputs:[...editor.querySelectorAll('input')].map(input => getComputedStyle(input).backgroundColor),
        }));
        assert.equal(style.background,theme === 'Light' ? 'rgb(46, 46, 46)' : 'rgb(74, 74, 74)');
        assert.equal(style.text,theme === 'Light' ? 'rgb(23, 23, 23)' : 'rgb(237, 237, 237)');
        assert.ok(style.inputs.every(color => color === 'rgba(0, 0, 0, 0)'));
      }
      if (theme === 'Light') await page.locator('[data-color-field-shell="foreground"]').screenshot({path:'/tmp/color-shift-editor-light.png'});
      await page.keyboard.press('Escape');
    }
    console.log('PASS transparent editor inputs in all formats/themes and Light selected-tab tokens');

    // Enable all actions, including Previous, Undo and Fix, before checking them.
    await page.setViewportSize({width:2520,height:1314});
    await page.locator('.cs-panel-actions [data-action="next"]').click();
    for (const target of ['background','foreground']) {
      await page.locator(`[data-color-field="${target}"]`).click();
      const input = page.getByRole('textbox',{name:'HEX color value',exact:true});
      await input.fill('#FFFFFF');
      await input.press('Enter');
      await page.keyboard.press('Escape');
    }

    for (const width of [393,320]) {
      await page.setViewportSize({width,height:852});
      for (const theme of ['Dark','Light']) {
        await page.getByRole('button',{name:theme,exact:true}).click();
        await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
        for (const action of ['undo','shuffle','swap','fix','previous','next']) {
          const button = page.locator(`.cs-panel-actions [data-action="${action}"]`);
          assert.ok(await button.isEnabled(),action);
          await button.hover();
          const label = (await button.getAttribute('aria-label')).split(' (')[0];
          const tooltip = page.locator('[data-slot="tooltip-content"]').filter({hasText:label});
          await tooltip.waitFor({state:'visible'});
          await page.waitForTimeout(200);
          const state = await tooltip.evaluate(node => ({
            side:node.dataset.side,background:getComputedStyle(node).backgroundColor,
            color:getComputedStyle(node).color,font:getComputedStyle(node).fontSize,
            lineHeight:getComputedStyle(node).lineHeight,padding:getComputedStyle(node).padding,
            pointer:getComputedStyle(node).pointerEvents,bounds:node.getBoundingClientRect().toJSON(),
            gap:getComputedStyle(node).gap,
            key:[...node.querySelectorAll('[data-slot="shortcut-key"]')].map(key => ({
              label:key.getAttribute('aria-label'),padding:getComputedStyle(key).padding,
              border:getComputedStyle(key).borderTopWidth,borderColor:getComputedStyle(key).borderTopColor,
              radius:getComputedStyle(key).borderRadius,font:getComputedStyle(key).fontSize,
              lineHeight:getComputedStyle(key).lineHeight,
              icons:[...key.querySelectorAll('svg')].map(icon => ({width:icon.getBoundingClientRect().width,height:icon.getBoundingClientRect().height})),
            })),
            arrows:[...node.querySelectorAll('img')].filter(image => getComputedStyle(image).display !== 'none').map(image => ({
              src:image.getAttribute('src'),loaded:image.complete && image.naturalWidth > 0,
              width:image.width,height:image.height,
            })),
          }));
          const buttonBox = await button.boundingBox();
          assert.equal(state.side,'top',JSON.stringify(state));
          assert.ok(state.bounds.bottom <= buttonBox.y && state.bounds.left >= 0 && state.bounds.right <= width,JSON.stringify(state));
          assert.equal(state.pointer,'none');
          assert.equal(state.background,theme === 'Dark' ? 'rgb(26, 26, 26)' : 'rgb(229, 229, 229)');
          assert.equal(state.color,theme === 'Dark' ? 'rgb(237, 237, 237)' : 'rgb(23, 23, 23)');
          assert.equal(state.font,'13px');
          assert.equal(state.lineHeight,'16px');
          assert.equal(state.padding,'8px 12px');
          {
            assert.equal(state.gap,theme === 'Dark' ? '4px' : '8px');
            assert.equal(state.key.length,1);
            const key = state.key[0];
            assert.equal(key.padding,'2px');
            assert.equal(key.border,'1px');
            assert.equal(key.borderColor,theme === 'Dark' ? 'rgb(46, 46, 46)' : 'rgb(201, 201, 201)');
            assert.equal(key.radius,'4px');
            assert.equal(key.font,'13px');
            assert.equal(key.lineHeight,'16px');
            assert.deepEqual(key.icons,['undo','previous','next'].includes(action) ? [{width:16,height:16}] : []);
            if (action === 'undo') assert.equal(key.label,'Command + Z');
            if (action === 'fix') assert.equal(key.label,'F');
            assert.ok(await button.getAttribute('aria-keyshortcuts'));
          }
          assert.deepEqual(state.arrows,[{src:`/figma/tooltip-arrow-${theme.toLowerCase()}.svg`,loaded:true,width:14,height:6}]);
          if (action === 'swap' && width === 393) await page.screenshot({path:`/tmp/color-shift-tooltip-mobile-${theme.toLowerCase()}.png`});
          if (action === 'undo' && width === 393) await tooltip.screenshot({path:`/tmp/color-shift-tooltip-command-${theme.toLowerCase()}.png`});
        }
      }
    }
    console.log('PASS mobile action tooltips appear above both panels in both themes');

    await page.setViewportSize({width:393,height:852});
    await page.mouse.move(1,1);
    await page.locator('.cs-panel-actions [data-action="next"]').hover();
    const activeTooltip = page.locator('[data-slot="tooltip-content"]:not([data-state="closed"])');
    const previousBox = await page.locator('.cs-panel-actions [data-action="previous"]').boundingBox();
    await page.mouse.click(previousBox.x+previousBox.width/2,previousBox.y+previousBox.height/2);
    assert.ok(await page.locator('.cs-panel-actions [data-action="previous"]').isDisabled());
    await page.setViewportSize({width:2520,height:1314});
    await page.locator('.cs-panel-actions [data-action="shuffle"]').hover();
    await activeTooltip.waitFor({state:'visible'});
    assert.equal(await activeTooltip.getAttribute('data-side'),'top');
    await page.getByRole('button',{name:'Light',exact:true}).hover();
    const themeTooltip = page.locator('[data-slot="tooltip-content"]').filter({hasText:'Toggle theme'});
    await themeTooltip.waitFor({state:'visible'});
    assert.equal(await themeTooltip.locator('[data-slot="shortcut-key"]').textContent(),'T');
    await themeTooltip.screenshot({path:'/tmp/color-shift-tooltip-theme.png'});
    await page.locator('[data-export-button]').hover();
    const exportTooltip = page.locator('[data-slot="tooltip-content"]').filter({hasText:'Export colors'});
    await exportTooltip.waitFor({state:'visible'});
    assert.equal(await exportTooltip.locator('kbd').getAttribute('aria-label'),'Command + S');
    assert.equal(await exportTooltip.locator('kbd svg').count(),1);
    await exportTooltip.screenshot({path:'/tmp/color-shift-tooltip-export.png'});

    await page.addInitScript(() => Object.defineProperty(navigator, 'platform', {value:'Win32', configurable:true}));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-action="swap"]').click();
    await page.locator('[data-action="undo"]').hover();
    const undoTooltip = page.locator('[data-slot="tooltip-content"]').filter({hasText:'Undo color edit'});
    await undoTooltip.waitFor({state:'visible'});
    assert.equal(await undoTooltip.locator('[data-slot="shortcut-key"]').getAttribute('aria-label'),'Control + Z');
    assert.equal(await undoTooltip.locator('kbd svg').count(),1);
    await page.locator('[data-export-button]').hover();
    await exportTooltip.waitFor({state:'visible'});
    assert.equal(await exportTooltip.locator('kbd').getAttribute('aria-label'),'Control + S');
    assert.deepEqual(errors,[]);
    console.log('PASS theme shortcut box, Command/Control platform icons, neighboring mobile actions, desktop positioning and no console errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
