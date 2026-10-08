/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
 const browser = await chromium.launch({ channel:'chrome', headless:true });
 try {
  const page = await browser.newPage({viewport:{width:1440,height:980}});
  await page.route('**/api/photos?*',route=>route.fulfill({json:{photos:Array.from({length:10},(_,id)=>({id:`ease-${id}`,url:'/figma/photo.jpg',tinyUrl:'/figma/photo.jpg',thumbUrl:'/figma/photo.jpg',color:'#f7b955',width:1200,height:900,alt:'Reference',photographer:'Mara Vale',photographerUrl:'https://unsplash.com/@test',photoUrl:'https://unsplash.com/photos/test'}))}}));
  await page.goto(process.env.COLOR_SHIFT_TEST_URL || 'http://localhost:3000/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-color-field]');
  await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--sidebar-easing') === 'easeInOutQuart');
  const panel = page.getByRole('button',{name:'Phase 7 motion',exact:true});
  if(await panel.getAttribute('aria-expanded') === 'false') await panel.click();
  const states = page.getByRole('button',{name:'States',exact:true});
  if(await states.getAttribute('aria-expanded') === 'false') await states.click();
  const trigger = page.locator('.dialkit-select-trigger').filter({hasText:'Easing'});
  async function select(value) {
   await trigger.click();
   await page.locator('.dialkit-select-option').filter({hasText:new RegExp(`^${value}$`,'i')}).click({timeout:4000});
   await page.waitForFunction(value=>document.documentElement.style.getPropertyValue('--sidebar-easing')===value,value);
  }
  async function quarterProgress(selector,button) {
   return page.evaluate(async ({selector,button})=>{
    document.documentElement.style.setProperty('--enter-duration','0.8s');
    const shell=document.querySelector(selector);
    const initial=shell.getBoundingClientRect().height;
    const seen=[];
    await new Promise(resolve=>{
     const observer=new MutationObserver(()=>{
      if(!document.querySelector('[data-layout-moving]')) return;
      observer.disconnect();
      const start=performance.now();
      function sample(){
       const time=performance.now()-start;
       if(time>=180&&time<=450) seen.push({time, height:shell.getBoundingClientRect().height});
       if(time<850)requestAnimationFrame(sample);else resolve();
      }
      requestAnimationFrame(sample);
     });
     observer.observe(document.querySelector('main'),{attributes:true,subtree:true,attributeFilter:['data-layout-moving']});
     document.querySelector(button).click();
    });
    const final=shell.getBoundingClientRect().height;
    return seen.map(s=>({t:s.time/800,progress:(s.height-initial)/(final-initial)}));
   },{selector,button});
  }
  const selector='[data-color-field-shell="background"]', button='[data-color-field="background"]';
  const quart = await quarterProgress(selector,button);
  function assertCurve(samples, inverse) {
   assert.ok(samples.length > 5, JSON.stringify(samples));
   // GSAP uses its own ticker clock; compare curve shape independent of its
   // offset from the MutationObserver that observes the committed layout.
   const offsets = samples.map(s => inverse(s.progress) - s.t);
   assert.ok(Math.max(...offsets) - Math.min(...offsets) < 0.035, JSON.stringify(samples));
  }
  const inverseQuart = p => p < 0.5 ? (p / 8) ** 0.25 : 1 - ((1 - p) / 8) ** 0.25;
  assertCurve(quart, inverseQuart);
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await select('linear');
  const linear = await quarterProgress(selector,button);
  assertCurve(linear, p => p);
  assert.ok(linear[0].progress > quart[0].progress + 0.08, 'DialKit selection changes the actual scale curve');
  await page.keyboard.press('Escape');await page.waitForTimeout(250);
  await select('easeInOutQuart');
  const score=await quarterProgress('#contrast-score-panel','#contrast-score-panel > button');
  assertCurve(score, inverseQuart);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--sidebar-easing') === 'easeInOutQuart');
  console.log('PASS DialKit live easing selection, persisted default and measured quart/linear curves for fields and score');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
