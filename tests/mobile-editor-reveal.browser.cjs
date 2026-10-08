/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function verifyMobileReveal(browser, baseURL, mockPhotos, errors) {
  const output = process.env.COLOR_SHIFT_TEST_ARTIFACT_DIR || '/tmp/color-shift-007';
  fs.mkdirSync(output, {recursive:true});
  const context = await browser.newContext({
    viewport:{width:393,height:852}, hasTouch:true, isMobile:true,
    reducedMotion:'no-preference',
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.route('**/api/photos?*', mockPhotos);
  await page.addInitScript(() => {
    window.revealTrace = null;
    const gestureListeners = [];
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    const capture = options => typeof options === 'boolean' ? options : !!options?.capture;
    window.addEventListener = (type, callback, options) => {
      if (['wheel','touchmove'].includes(type) && !gestureListeners.some(l => l.type === type && l.callback === callback && l.capture === capture(options))) {
        gestureListeners.push({type,callback,capture:capture(options)});
      }
      add(type,callback,options);
    };
    window.removeEventListener = (type, callback, options) => {
      const index = gestureListeners.findIndex(l => l.type === type && l.callback === callback && l.capture === capture(options));
      if (index >= 0) gestureListeners.splice(index,1);
      remove(type,callback,options);
    };
    window.revealGestureListenerCount = () => gestureListeners.length;
    for (const method of ['scrollTo','scrollBy']) {
      const original = window[method].bind(window);
      window[method] = (...args) => {
        const trace = window.revealTrace;
        const call = {time:performance.now(),method,before:scrollY,options:args[0],
          target:document.querySelector('[data-color-field][aria-expanded="true"]')?.dataset.colorField};
        original(...args);
        if (trace) trace.calls.push({...call,after:scrollY});
      };
    }
    for (const event of ['wheel','touchmove','keydown']) {
      window.addEventListener(event, e => {
        const shell = document.querySelector('[data-color-field][aria-expanded="true"]')?.parentElement;
        window.revealTrace?.events.push({time:performance.now(),type:event,key:e.key,trusted:e.isTrusted,
          height:shell?.getBoundingClientRect().height,
          expandedHeight:document.querySelector('#color-editor')?.getBoundingClientRect().height + 66});
      }, {capture:true,passive:true});
    }
    window.startRevealTrace = () => {
      const trace = window.revealTrace = {start:performance.now(),samples:[],calls:[],events:[]};
      function sample(time) {
        if (window.revealTrace !== trace) return;
        trace.samples.push({time,y:scrollY,fields:[...document.querySelectorAll('[data-color-field-shell]')].map(n => {
          const b = n.getBoundingClientRect();
          return {target:n.dataset.colorFieldShell,height:b.height,top:b.top,bottom:b.bottom,
            active:n.querySelector('button').getAttribute('aria-expanded') === 'true'};
        })});
        if (time - trace.start < 800) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    };
  });
  const evidence = {};
  const recording = [];
  const recorder = await context.newCDPSession(page);
  recorder.on('Page.screencastFrame', event => {
    recording.push({data:event.data,time:event.metadata.timestamp});
    void recorder.send('Page.screencastFrameAck',{sessionId:event.sessionId});
  });
  async function reset(reducedMotion = 'no-preference', size = {width:393,height:852}) {
    await page.emulateMedia({reducedMotion});
    await page.setViewportSize(size);
    await page.goto(baseURL, {waitUntil:'domcontentloaded'});
    await page.waitForSelector('[data-color-field]');
    await page.locator('[data-photo-layer][data-current="true"] [data-photo-full]').evaluate(img => img.decode());
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(50);
  }
  async function rawOpen(target, touch = false) {
    const b = await page.locator(`[data-color-field="${target}"]`).boundingBox();
    const footer = await page.locator('[data-control-footer]').boundingBox();
    assert.ok(b.y >= 0 && b.y + b.height/2 < footer.y, `Raw ${target} trigger is visible: ${JSON.stringify(b)}`);
    if (touch) await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
    else await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
  }
  async function trace(name) {
    await page.waitForTimeout(850);
    const result = await page.evaluate(() => window.revealTrace);
    evidence[name] = result;
    assert.ok(result.calls.filter(c => c.target).every(c => c.options.behavior === 'instant'), name);
    return result;
  }
  async function bounds(target) {
    return page.evaluate(target => {
      const field = document.querySelector(`[data-color-field-shell="${target}"]`).getBoundingClientRect();
      const footer = document.querySelector('[data-control-footer]').getBoundingClientRect();
      return {top:field.top,bottom:field.bottom,footer:footer.top};
    }, target);
  }
  function noRevealAfter(result, time, message) {
    assert.equal(result.calls.filter(c => c.method === 'scrollTo' && c.time > time).length,0,message);
  }
  try {
    await reset();
    await recorder.send('Page.startScreencast',{format:'jpeg',quality:85,everyNthFrame:1});
    await page.evaluate(() => window.startRevealTrace());
    await rawOpen('foreground', true);
    const overlap = await trace('scale-expansion-reveal');
    await recorder.send('Page.stopScreencast');
    const samples = overlap.samples.filter(s => s.fields.find(f => f.target === 'foreground').active);
    const finalHeight = samples.at(-1).fields.find(f => f.target === 'foreground').height;
    assert.ok(samples.length > 0);
    assert.ok(samples.some(s => s.fields.find(f => f.target === 'foreground').height < finalHeight - 10), 'Reveal follows the expanding field scale');
    assert.ok(overlap.calls.some(c => c.method === 'scrollTo' && c.after > c.before), 'Expanded editor is revealed');
    console.log('PASS animated editor expansion and mobile reveal');
    const fit = await bounds('foreground');
    assert.ok(fit.top >= 15 && fit.bottom <= fit.footer - 15,JSON.stringify(fit));
    await page.screenshot({path:path.join(output,'foreground-dark.png')});
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.getByRole('button',{name:'Light',exact:true}).tap();
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    await rawOpen('foreground',true);
    await page.waitForTimeout(350);
    await page.screenshot({path:path.join(output,'foreground-light.png')});
    await page.evaluate(() => window.startRevealTrace());
    await page.locator('[data-control-footer]').evaluate(n => { n.style.height = '136px'; });
    const footerResize = await trace('footer-resize');
    assert.ok(footerResize.calls.some(c => c.method === 'scrollTo'));
    const footerFit = await bounds('foreground');
    assert.ok(footerFit.top >= 15 && footerFit.bottom <= footerFit.footer-15,JSON.stringify(footerFit));
    console.log('PASS observed footer geometry changes reveal an already-open field');

    await reset();
    await page.evaluate(() => window.startRevealTrace());
    await rawOpen('foreground');
    await page.waitForFunction(() => window.revealTrace.calls.some(c => c.method === 'scrollTo' && c.after > c.before), null, {polling:'raf'});
    await page.keyboard.press('Escape');
    const escape = await trace('escape-after-expansion');
    const escapeTime = escape.events.find(e => e.key === 'Escape').time;
    const closeEvent = escape.events.find(e => e.key === 'Escape');
    assert.ok(escape.calls.some(c => c.time < escapeTime && c.after > c.before), 'Scroll must start before interruption');
    assert.ok(closeEvent.height > 48 && closeEvent.height <= closeEvent.expandedHeight + 2, 'Escape interrupts a visible expanding editor');
    noRevealAfter(escape,escapeTime,'Escape leaves no stale reveal');
    assert.equal(await page.locator('#color-editor').count(),0);
    assert.ok(await page.locator('[data-color-field="foreground"]').evaluate(n => n === document.activeElement));
    console.log('PASS Escape during expansion cancels reveal and restores trigger focus');

    await reset();
    const idleListeners = await page.evaluate(() => window.revealGestureListenerCount());
    let imageRoute;
    await page.route('**/reveal-unmount-photo.jpg', route => { imageRoute = route; });
    await page.route('**/api/photos?count=1', route => route.fulfill({json:{photos:[{
      id:'reveal-unmount',url:'/figma/photo.jpg',thumbUrl:'/reveal-unmount-photo.jpg',tinyUrl:'/figma/photo.jpg',
      color:'#f7b955',width:1200,height:900,alt:'Reference landscape',photographer:'Mara Vale',
      photographerUrl:'https://unsplash.com/@test',photoUrl:'https://unsplash.com/photos/test',
    }]}}));
    await page.evaluate(() => window.startRevealTrace());
    await rawOpen('foreground');
    await page.waitForFunction(() => window.revealTrace.calls.some(c => c.method === 'scrollTo' && c.after > c.before));
    assert.equal(await page.evaluate(() => window.revealGestureListenerCount()),idleListeners+2);
    await page.evaluate(() => {
      window.previousRevealShell = document.querySelector('[data-color-field-shell="foreground"]');
      document.activeElement.blur();
    });
    // A pending new palette genuinely unmounts ColorField without navigation.
    await page.keyboard.press('Space');
    await page.waitForFunction(() => !window.previousRevealShell.isConnected);
    const unmountedAt = await page.evaluate(() => performance.now());
    const unmounted = await trace('pending-photo-unmount');
    noRevealAfter(unmounted,unmountedAt,'Unmount cancels pending reveal');
    assert.equal(await page.evaluate(() => window.revealGestureListenerCount()),idleListeners);
    assert.ok(imageRoute, 'Hold the real bitmap until after cleanup is checked');
    await imageRoute.fulfill({path:path.resolve(__dirname,'../public/figma/photo.jpg')});
    await page.unroute('**/reveal-unmount-photo.jpg');
    await page.unroute('**/api/photos?count=1');
    await page.waitForSelector('[data-color-field]');
    console.log('PASS pending-photo unmount cancels reveal and removes owned gesture listeners');

    // Headers remain physically reachable during layout transitions.
    await reset('no-preference',{width:393,height:1100});
    await page.evaluate(() => window.startRevealTrace());
    await rawOpen('foreground');
    await page.waitForFunction(() => document.querySelector('[data-color-field="foreground"]').getAttribute('aria-expanded') === 'true');
    const switchTime = await page.evaluate(() => performance.now());
    await rawOpen('background');
    const switched = await trace('sibling-collapse-switch');
    assert.ok(switched.samples.some(s => s.fields.find(f => f.target === 'background').active), 'The new field owns the reveal during sibling collapse');
    assert.equal(switched.calls.filter(c => c.time > switchTime && c.target !== 'background').length,0);
    const switchedBounds = await bounds('background');
    assert.ok(switchedBounds.top >= 15 && switchedBounds.bottom <= switchedBounds.footer - 15,JSON.stringify(switchedBounds));
    await page.getByRole('tab',{name:'HSL',exact:true}).tap();
    const colors = await page.locator('[data-color-field] .tabular-nums').allTextContents();
    await rawOpen('foreground');
    await page.waitForTimeout(40);
    await rawOpen('background');
    await page.waitForTimeout(40);
    // Confirm keyboard activation retains single-editor ownership.
    await page.locator('[data-color-field="foreground"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
    assert.equal(await page.getByRole('tab',{name:'HSL',exact:true}).getAttribute('data-state'),'active');
    assert.deepEqual(await page.locator('[data-color-field] .tabular-nums').allTextContents(),colors);
    assert.equal(await page.locator('[data-color-editor]').count(),1);
    console.log('PASS rapid switches, sibling collapse alignment, format/colors and single-editor ownership');

    for (const gesture of ['wheel','touch']) {
      await reset();
      await page.evaluate(() => window.startRevealTrace());
      await rawOpen('foreground', gesture === 'touch');
      await page.waitForTimeout(35);
      if (gesture === 'wheel') {
        await page.mouse.move(10,400);
        await page.mouse.wheel(0,110);
      } else {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:10,y:450}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:10,y:340}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await cdp.detach();
      }
      // Exercise notifications after cancellation, including a live preference
      // change and a content-size change; none may revive this opening.
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.setViewportSize({width:393,height:800});
      await page.getByRole('tab',{name:'HSL',exact:true}).tap();
      await page.locator('[data-control-footer]').evaluate(n => { n.style.paddingBottom = '40px'; });
      const cancelled = await trace(`${gesture}-cancellation`);
      const event = cancelled.events.find(e => e.type === (gesture === 'wheel' ? 'wheel' : 'touchmove'));
      assert.ok(event?.trusted, 'Use a real browser gesture');
      noRevealAfter(cancelled,event.time,'Manual scroll owns the remainder of the opening');
      await page.setViewportSize({width:640,height:800});
      await page.waitForTimeout(200);
      await page.setViewportSize({width:393,height:800});
      await page.evaluate(() => { window.visualViewport.dispatchEvent(new Event('scroll')); window.visualViewport.dispatchEvent(new Event('resize')); });
      await page.waitForTimeout(100);
      const afterEvents = await page.evaluate(() => window.revealTrace);
      noRevealAfter(afterEvents,event.time,'Viewport events cannot revive cancelled reveal');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
      await page.evaluate(() => window.startRevealTrace());
      await rawOpen('foreground');
      const renewed = await trace(`${gesture}-new-activation`);
      assert.ok(renewed.calls.some(c => c.target === 'foreground' && c.after > c.before));
    }
    console.log('PASS trusted wheel/touch cancellation remains latched across notifications; a new activation reveals');

    await reset();
    await page.evaluate(() => window.startRevealTrace());
    await rawOpen('foreground');
    await page.waitForTimeout(35);
    await page.emulateMedia({reducedMotion:'reduce'});
    const live = await trace('live-reduced-motion');
    const liveBounds = await bounds('foreground');
    assert.ok(liveBounds.top >= 15 && liveBounds.bottom <= liveBounds.footer-15,JSON.stringify(liveBounds));
    assert.ok(live.calls.every(c => c.options.behavior === 'instant'));
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForTimeout(250);

    await reset('reduce');
    await page.locator('[data-color-field="foreground"]').focus();
    await page.evaluate(() => window.startRevealTrace());
    await page.keyboard.press('Enter');
    const keyboard = await trace('keyboard-reduced-motion');
    assert.ok(keyboard.calls.length > 0);
    assert.ok(keyboard.calls.every(c => c.options.behavior === 'instant'));
    assert.ok(await page.locator('[data-color-field="foreground"]').evaluate(n => n === document.activeElement));
    const input = page.getByRole('textbox',{name:'HEX color value',exact:true});
    await input.focus();
    const inputFocus = await page.evaluate(() => performance.now());
    await page.setViewportSize({width:393,height:500});
    await page.waitForTimeout(350);
    const focused = await page.evaluate(() => window.revealTrace);
    noRevealAfter(focused,inputFocus,'Focused-input protection takes ownership');
    assert.ok(await input.evaluate(n => n === document.activeElement));
    const inputBox = await input.boundingBox(), footerBox = await page.locator('[data-control-footer]').boundingBox();
    assert.ok(inputBox.y+inputBox.height <= footerBox.y-15,JSON.stringify({inputBox,footerBox}));
    console.log('PASS live reduced motion, keyboard activation/focus and footer input-protection priority');

    await reset();
    await page.evaluate(() => window.startRevealTrace());
    await rawOpen('foreground');
    await page.waitForTimeout(35);
    await page.setViewportSize({width:640,height:852});
    const crossed = await page.evaluate(() => performance.now());
    await page.waitForTimeout(300);
    const suspended = await page.evaluate(() => window.revealTrace);
    noRevealAfter(suspended,crossed,'Leaving mobile cancels pending reveal');
    await page.setViewportSize({width:393,height:650});
    const crossing = await trace('mobile-tablet-reentry');
    assert.ok(crossing.calls.some(c => c.time > crossed && c.method === 'scrollTo'));
    const reentryBounds = await bounds('foreground');
    assert.ok(reentryBounds.top >= 15 && reentryBounds.bottom <= reentryBounds.footer-15,JSON.stringify(reentryBounds));
    assert.equal(await page.locator('[data-color-field="foreground"]').getAttribute('aria-expanded'),'true');
    await reset('no-preference',{width:1000,height:852});
    await page.evaluate(() => window.startRevealTrace());
    await page.locator('[data-color-field="foreground"]').click();
    await page.waitForTimeout(250);
    assert.equal((await page.evaluate(() => window.revealTrace)).calls.length,0);
    await page.setViewportSize({width:393,height:650});
    const desktopEntry = await trace('desktop-opening-mobile-entry');
    assert.ok(desktopEntry.calls.some(c => c.method === 'scrollTo'));
    const entryBounds = await bounds('foreground');
    assert.ok(entryBounds.top >= 15 && entryBounds.bottom <= entryBounds.footer-15,JSON.stringify(entryBounds));
    console.log('PASS breakpoint suspension/reentry and desktop-opened field reveal on entering mobile');

    await reset('no-preference',{width:320,height:320});
    // At this height the trigger starts offscreen, so manually expose it first.
    await page.locator('[data-color-field="foreground"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    await page.evaluate(() => window.startRevealTrace());
    await rawOpen('foreground',true);
    const oversized = await trace('oversized-top-alignment');
    const oversizedBounds = await bounds('foreground');
    assert.ok(Math.abs(oversizedBounds.top-16) < 2,JSON.stringify(oversizedBounds));
    const openingSamples = oversized.samples.filter(s => s.fields.find(f => f.target === 'foreground').active);
    assert.ok(openingSamples.every(s => s.fields.find(f => f.target === 'foreground').top >= 14), 'No bottom/top policy jump with an oversized editor');
    await page.getByRole('textbox',{name:'HEX color value',exact:true}).scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const lastInput = await page.getByRole('textbox',{name:'HEX color value',exact:true}).boundingBox();
    const shortFooter = await page.locator('[data-control-footer]').boundingBox();
    assert.ok(lastInput.y+lastInput.height <= shortFooter.y-15);
    await page.screenshot({path:path.join(output,'oversized-manual-scroll.png')});
    console.log('PASS oversized top alignment after expansion and manual last-input reachability');
  } finally {
    fs.writeFileSync(path.join(output,'frame-traces.json'),JSON.stringify(evidence,null,2));
    recording.forEach((frame,i) => fs.writeFileSync(path.join(output,`opening-${String(i).padStart(3,'0')}.jpg`),Buffer.from(frame.data,'base64')));
    fs.writeFileSync(path.join(output,'opening-frames.json'),JSON.stringify(recording.map((f,i) => ({file:`opening-${String(i).padStart(3,'0')}.jpg`,time:f.time})),null,2));
    await recorder.detach();
    await context.close();
  }
};
