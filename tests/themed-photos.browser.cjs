/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {converter,wcagContrast} = require('culori');
const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://localhost:3002';
const oklch = converter('oklch');
const svg = (background,accent) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${background}"/><rect x="300" width="100" height="300" fill="${accent}"/></svg>`;
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:980}});
  const errors=[],requests=[];
  let sequence=0,metadataOnly=false,delayRequest=false;
  page.on('pageerror',e=>errors.push(e.message));
  const photo=(id,kind,color)=>({id,url:`/themed-${kind}.svg`,thumbUrl:`/themed-${kind}.svg`,tinyUrl:`/themed-${kind}.svg`,color,width:400,height:300,alt:kind,photographer:'Test',photographerUrl:'https://unsplash.com/@test',photoUrl:'https://unsplash.com/photos/test'});
  await page.route('**/api/photos?*',async route=>{
   const query=new URL(route.request().url()).searchParams;
   const count=Number(query.get('count'));const theme=query.get('theme');
   requests.push({count,theme});
   if(!theme) return route.fulfill({json:{photos:Array.from({length:count},(_,i)=>photo(`initial-${i}`,'middle','#777777'))}});
   const id=sequence++;
   if(delayRequest)await new Promise(resolve=>setTimeout(resolve,400));
   return route.fulfill({json:{photos:metadataOnly ? [photo(`fallback-light-${id}`,'invalid','#EEEEEE'),photo(`fallback-dark-${id}`,'invalid','#111111')] : [
    photo(`dark-${id}`,'dark','#FFFFFF'),photo(`bright-${id}`,'bright','#000000'),photo(`middle-${id}`,'middle','#888888'),
    photo(`invalid-${id}`,'invalid','#FFFFFF'),
   ]}});
  });
  await page.route('**/themed-*.svg',route=>{
   const kind=route.request().url().match(/themed-(\w+)\.svg/)[1];
   return route.fulfill({contentType:'image/svg+xml',body:kind==='bright'?svg('#F5EEDD','#EBAA66'):kind==='dark'?svg('#101521','#006050'):kind==='middle'?svg('#777777','#CFB84E'):'invalid image'});
  });
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('[data-color-field="background"]')?.textContent.includes('#'));
  const pair=()=>page.locator('[data-color-field]').allTextContents();
  const current=()=>page.locator('[data-photo-layer][data-current="true"]').getAttribute('data-photo-id');
  async function idleTheme(theme){await page.getByRole('button',{name:theme==='light'?'Light':'Dark',exact:true}).click();await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-theme-transition'));}
  async function verify(theme,id,requestedTheme=theme){
   await page.waitForFunction(id=>document.querySelector('[data-photo-layer][data-current="true"]')?.dataset.photoId===id,id);
   const colors=(await pair()).map(text=>text.match(/#[\dA-F]{6}/)[0]);
   const bg=oklch(colors[0]).l,fg=oklch(colors[1]).l;
   assert.ok(theme==='light'?bg>=.815&&fg<=.355:bg<=.285&&fg>=.815,JSON.stringify({theme,colors,bg,fg}));
   assert.ok(wcagContrast(...colors)>=4.5);
   assert.equal(requests.at(-1).theme,requestedTheme);assert.equal(requests.at(-1).count,4);
   return colors;
  }
  const original=await pair(),initial=await current();
  await idleTheme('light');assert.deepEqual(await pair(),original);assert.equal(await current(),initial);
  await page.locator('[data-action="shuffle"]').click();
  await verify('light','bright-0');
  await page.locator('[data-current="true"] [data-photo-full]').evaluate(image=>image.decode());
  await page.waitForTimeout(250);await page.screenshot({path:'/tmp/color-shift-themed-light.png'});
  const lightPair=await pair();
  await idleTheme('dark');assert.deepEqual(await pair(),lightPair);assert.equal(await current(),'bright-0');
  await page.locator('h1').click();await page.keyboard.press('Space');
  await verify('dark','dark-1');
  await page.locator('[data-current="true"] [data-photo-full]').evaluate(image=>image.decode());
  await page.waitForTimeout(250);await page.screenshot({path:'/tmp/color-shift-themed-dark.png'});
  const darkPair=await pair();
  await page.locator('[data-action="previous"]').click();assert.equal(await current(),'bright-0');assert.deepEqual(await pair(),lightPair);
  await page.locator('[data-action="next"]').click();assert.equal(await current(),'dark-1');assert.deepEqual(await pair(),darkPair);
  console.log('PASS Light/Dark pixel-based selection beats misleading metadata, click/Space share generation and history remains intact');
  await page.emulateMedia({reducedMotion:'reduce'});
  await idleTheme('light');delayRequest=true;
  await page.locator('[data-action="shuffle"]').click();
  await idleTheme('dark');
  await verify('dark','dark-2','light');delayRequest=false;
  console.log('PASS a theme change during an in-flight request selects/colors for the latest visible theme');
  metadataOnly=true;
  await idleTheme('light');await page.locator('[data-action="shuffle"]').click();
  await verify('light','fallback-light-3');
  await idleTheme('dark');await page.locator('[data-action="shuffle"]').click();
  await verify('dark','fallback-dark-4');
  metadataOnly=false;
  await page.setViewportSize({width:393,height:852});
  await idleTheme('light');await page.locator('[data-action="shuffle"]').click();
  await verify('light','bright-5');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  console.log('PASS thumbnail/palette fallback, valid-image priority and mobile themed generation remain usable');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
