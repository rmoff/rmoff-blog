const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  // Mobile
  let context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  let page = await context.newPage();
  await page.goto('http://localhost:1313/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'mobile.png', fullPage: false });
  await context.close();
  
  // Desktop
  context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  page = await context.newPage();
  await page.goto('http://localhost:1313/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'desktop.png', fullPage: false });
  
  await browser.close();
  console.log('Done');
})();
