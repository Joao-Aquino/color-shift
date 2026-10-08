/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseURL = process.env.COLOR_SHIFT_TEST_URL || 'http://127.0.0.1:3001';
const bitmap = path.join(__dirname, 'public/figma/photo.jpg');
const output = path.join(__dirname, 'animation-frames');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  
  let sequence = 0;
  await page.route('**/api/photos?*', async route => {
    const count = Number(new URL(route.request().url()).searchParams.get('count') || 10);
    const photos = Array.from({ length: count }, () => {
      const id = sequence++;
      return {
        id: `motion-${id}`,
        url: `/figma/photo.jpg`,
        tinyUrl: `/figma/photo.jpg`,
        thumbUrl: '/figma/photo.jpg',
        color: '#f7b955',
        width: 1200,
        height: 900,
        alt: `Motion photo ${id}`,
        photographer: 'Mara Vale',
        photographerUrl: 'https://unsplash.com/@test',
        photoUrl: 'https://unsplash.com/photos/test'
      };
    });
    await route.fulfill({ json: { photos } });
  });

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-color-field]', { timeout: 30000 });
  
  console.log('Setting slow motion...');
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--exit-duration', '2s');
    document.documentElement.style.setProperty('--enter-duration', '2s');
  });

  async function captureSequence(name, action, totalFrames = 5) {
    console.log(`Capturing ${name}...`);
    const frameDir = path.join(output, name);
    fs.mkdirSync(frameDir, { recursive: true });
    
    const frames = [];
    let captured = 0;
    
    page.on('console', msg => {
      if (msg.text().includes('CAPTURE_FRAME')) {
        captured++;
      }
    });
    
    await page.evaluate((totalFrames) => {
      window.captureFrames = [];
      window.captureCount = 0;
      window.totalCaptures = totalFrames;
      
      const startTime = performance.now();
      const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--enter-duration')) * 1000;
      
      function captureFrame() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const frameIndex = Math.floor(progress * (window.totalCaptures - 1));
        
        if (!window.captureFrames[frameIndex] && window.captureCount < window.totalCaptures) {
          window.captureFrames[frameIndex] = true;
          window.captureCount++;
          console.log('CAPTURE_FRAME', frameIndex, progress.toFixed(2));
        }
        
        if (progress < 1) {
          requestAnimationFrame(captureFrame);
        }
      }
      
      requestAnimationFrame(captureFrame);
    }, totalFrames);
    
    await action();
    
    for (let i = 0; i < totalFrames; i++) {
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(frameDir, `frame-${i}.png`) });
      console.log(`  Captured frame ${i}/${totalFrames - 1}`);
    }
    
    console.log(`${name} complete`);
  }

  await captureSequence('01-open-background', async () => {
    await page.locator('[data-color-field="background"]').click();
    await page.waitForTimeout(2000);
  });

  await page.evaluate(() => {
    document.documentElement.style.setProperty('--exit-duration', '2s');
    document.documentElement.style.setProperty('--enter-duration', '2s');
  });

  await captureSequence('02-switch-to-foreground', async () => {
    await page.locator('[data-color-field="foreground"]').click();
    await page.waitForTimeout(2000);
  });

  await page.evaluate(() => {
    document.documentElement.style.setProperty('--exit-duration', '2s');
    document.documentElement.style.setProperty('--enter-duration', '2s');
  });

  await captureSequence('03-close-escape', async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
  });

  await page.evaluate(() => {
    document.documentElement.style.setProperty('--exit-duration', '2s');
    document.documentElement.style.setProperty('--enter-duration', '2s');
  });

  await captureSequence('04-score-expand', async () => {
    await page.locator('#contrast-score-panel > button').click();
    await page.waitForTimeout(2000);
  });

  await page.evaluate(() => {
    document.documentElement.style.setProperty('--exit-duration', '2s');
    document.documentElement.style.setProperty('--enter-duration', '2s');
  });

  await captureSequence('05-score-collapse', async () => {
    await page.locator('#contrast-score-panel > button').click();
    await page.waitForTimeout(2000);
  });

  console.log('\nAll captures complete! Check', output);
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
