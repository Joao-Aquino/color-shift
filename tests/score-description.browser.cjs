/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://127.0.0.1:3001';
(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:980}});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.route('**/api/photos?*',route=>route.fulfill({json:{photos:Array.from({length:10},(_,id)=>({id:`description-${id}`,url:'/figma/photo.jpg',tinyUrl:'/figma/photo.jpg',thumbUrl:'/figma/photo.jpg',color:'#f7b955',width:1200,height:900,alt:'Reference',photographer:'Mara Vale',photographerUrl:'https://unsplash.com/@test',photoUrl:'https://unsplash.com/photos/test'}))}}));
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-color-field]');
  await page.waitForFunction(()=>!document.querySelector('[data-description-moving]'));
  const description=page.locator('[data-score-description]');
  await description.locator('p').evaluate(p=>{p.style.width='320px';});
  await page.waitForTimeout(250);
  assert.equal(await description.evaluate(node=>node.offsetHeight),20);
  const trace=await page.evaluate(async()=>{
   const root=document.querySelector('[data-score-description]'),text=root.querySelector('p');
   const fields=document.querySelector('[data-color-field-shell]');
   const samples=[];
   text.style.width='200px';
   const start=performance.now();
   await new Promise(resolve=>{function sample(){
    samples.push({height:root.getBoundingClientRect().height,natural:text.offsetHeight,fieldTop:fields.getBoundingClientRect().top,transform:getComputedStyle(text).transform});
    if(performance.now()-start<280)requestAnimationFrame(sample);else resolve();
   }requestAnimationFrame(sample)});
   return samples;
  });
  assert.ok(trace.some(s=>s.height>20.5&&s.height<39.5),JSON.stringify(trace));
  assert.ok(trace.every(s=>s.transform==='none'),'Description text must not scale');
  assert.equal(trace.at(-1).height,40);
  const baseline=trace.at(-1).fieldTop-40;
  assert.ok(trace.every(s=>Math.abs(s.fieldTop-s.height-baseline)<1),'Following controls must move with the description height');
  assert.equal(await description.evaluate(n=>n.style.height),'');
  console.log('PASS one/two-line description height eases without glyph scale and following controls move continuously');
  await description.locator('p').evaluate(async p=>{
   p.style.width='320px';
   await new Promise(resolve=>setTimeout(resolve,35));
   p.style.width='200px';
   await new Promise(resolve=>setTimeout(resolve,35));
   p.style.width='320px';
  });
  await page.waitForFunction(()=>!document.querySelector('[data-description-moving]'));
  assert.equal(await description.evaluate(n=>n.offsetHeight),20);
  assert.equal(await description.evaluate(n=>n.style.height),'');
  await description.locator('p').evaluate(p=>{p.style.width='200px';});
  await page.waitForFunction(()=>!!document.querySelector('[data-description-moving]'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>!document.querySelector('[data-description-moving]'));
  assert.equal(await description.evaluate(n=>n.offsetHeight),40);
  assert.equal(await description.getAttribute('data-description-moving'),null);
  await description.locator('p').evaluate(p=>{p.style.width='320px';});
  await page.waitForTimeout(30);
  assert.equal(await description.evaluate(n=>n.offsetHeight),20);
  assert.equal(await description.getAttribute('data-description-moving'),null);
  assert.deepEqual(errors,[]);
  console.log('PASS interrupted wrapping restores natural height and live reduced motion settles immediately');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
