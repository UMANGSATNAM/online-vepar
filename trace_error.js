const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000');
  
  // Login
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'merchant@store.com');
  await page.type('input[type="password"]', 'merchant123');
  
  // Click login button (it's the primary button)
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Sign In')) {
      await btn.click();
      break;
    }
  }
  
  // Wait for dashboard to load (look for Orders tab)
  await page.waitForTimeout(3000);
  
  console.log("Navigating to Orders tab...");
  // Find the Orders button
  const navButtons = await page.$$('button, div');
  let clicked = false;
  for (const btn of navButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.trim() === 'Orders') {
      await btn.click();
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.log("Failed to find Orders tab. Trying text search.");
    const els = await page.$x("//span[contains(text(), 'Orders')]");
    if (els.length > 0) {
      await els[0].click();
    }
  }
  
  await page.waitForTimeout(3000);
  console.log("Test finished.");
  await browser.close();
})();
