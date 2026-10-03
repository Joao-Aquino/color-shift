/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:2520,height:1314}});
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
    await page.locator('[data-responsive-motion="photo"] img').evaluate(image => image.decode());

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
          };
        },format);
        assert.equal(aligned.labelWidth,74);
        assert.ok(aligned.channels.every(channel => channel.labelWidth === 74 && Math.abs(channel.left-aligned.inputLeft) < 1),JSON.stringify(aligned));
        assert.equal(aligned.overflow,false);
      }
      if (width === 2520) await page.locator('[data-color-field-shell="foreground"]').screenshot({path:'/tmp/color-shift-aligned-readout-desktop.png'});
      await page.keyboard.press('Escape');
    }
    console.log('PASS readout/sliders share 74px labels and aligned input starts in all formats at four widths');

    // Enable all actions, including Previous, Undo and Fix, before checking them.
    await page.setViewportSize({width:2520,height:1314});
    await page.locator('.cs-inline-actions [data-action="next"]').click();
    for (const target of ['background','foreground']) {
      await page.locator(`[data-color-field="${target}"]`).click();
      const input = page.getByRole('textbox',{name:'HEX color value',exact:true});
      await input.fill('#FFFFFF');
      await input.press('Enter');
      await page.keyboard.press('Escape');
    }

    for (const width of [393,320]) {
      await page.setViewportSize({width,height:852});
      await page.getByRole('button',{name:'Open photo actions',exact:true}).click();
      for (const theme of ['Dark','Light']) {
        // Theme interaction closes the menu; reopen before inspecting its buttons.
        await page.getByRole('button',{name:theme,exact:true}).click();
        if (await page.getByRole('button',{name:'Open photo actions',exact:true}).count()) {
          await page.getByRole('button',{name:'Open photo actions',exact:true}).click();
        }
        for (const action of ['undo','shuffle','swap','fix','previous','next']) {
          const button = page.locator(`.cs-mobile-action-list [data-action="${action}"]`);
          assert.ok(await button.isEnabled(),action);
          await button.hover();
          const tooltip = page.locator('[data-slot="tooltip-content"]').filter({hasText:await button.getAttribute('aria-label')});
          await tooltip.waitFor({state:'visible'});
          await page.waitForTimeout(200);
          const state = await tooltip.evaluate(node => ({
            side:node.dataset.side,background:getComputedStyle(node).backgroundColor,
            color:getComputedStyle(node).color,font:getComputedStyle(node).fontSize,
            lineHeight:getComputedStyle(node).lineHeight,padding:getComputedStyle(node).padding,
            pointer:getComputedStyle(node).pointerEvents,bounds:node.getBoundingClientRect().toJSON(),
            arrows:[...node.querySelectorAll('img')].filter(image => getComputedStyle(image).display !== 'none').map(image => ({
              src:image.getAttribute('src'),loaded:image.complete && image.naturalWidth > 0,
              width:image.width,height:image.height,
            })),
          }));
          const buttonBox = await button.boundingBox();
          assert.equal(state.side,'left',JSON.stringify(state));
          assert.ok(state.bounds.right < buttonBox.x && state.bounds.left >= 0,JSON.stringify(state));
          assert.equal(state.pointer,'none');
          assert.equal(state.background,theme === 'Dark' ? 'rgb(26, 26, 26)' : 'rgb(229, 229, 229)');
          assert.equal(state.color,theme === 'Dark' ? 'rgb(237, 237, 237)' : 'rgb(23, 23, 23)');
          assert.equal(state.font,'13px');
          assert.equal(state.lineHeight,'16px');
          assert.equal(state.padding,'8px 12px');
          assert.deepEqual(state.arrows,[{src:`/figma/tooltip-arrow-${theme.toLowerCase()}.svg`,loaded:true,width:14,height:6}]);
          if (action === 'swap' && width === 393) await page.screenshot({path:`/tmp/color-shift-tooltip-left-${theme.toLowerCase()}.png`});
        }
      }
      await page.keyboard.press('Escape');
    }
    console.log('PASS all mobile action tooltips appear left with exact Figma theme colors and original 14x6 arrows');

    await page.setViewportSize({width:393,height:852});
    await page.getByRole('button',{name:'Open photo actions',exact:true}).click();
    await page.locator('.cs-mobile-action-list [data-action="next"]').hover();
    const activeTooltip = page.locator('[data-slot="tooltip-content"]:not([data-state="closed"])');
    await activeTooltip.waitFor({state:'visible'});
    const previousBox = await page.locator('.cs-mobile-action-list [data-action="previous"]').boundingBox();
    await page.mouse.click(previousBox.x+previousBox.width/2,previousBox.y+previousBox.height/2);
    await page.getByRole('button',{name:'Open photo actions',exact:true}).waitFor();
    await page.setViewportSize({width:2520,height:1314});
    assert.ok(await page.locator('.cs-inline-actions [data-action="previous"]').isDisabled());
    await page.locator('.cs-inline-actions [data-action="shuffle"]').hover();
    await activeTooltip.waitFor({state:'visible'});
    assert.equal(await activeTooltip.getAttribute('data-side'),'top');
    assert.deepEqual(errors,[]);
    console.log('PASS neighboring mobile action remains clickable; desktop tooltips stay above; console errors: none');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
