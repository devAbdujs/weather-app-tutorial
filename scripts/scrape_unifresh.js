const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co/rest/v1/')) {
      console.log('Intercepted Supabase API:', url);
    }
  });

  await page.goto('https://unifresh.site', { waitUntil: 'networkidle' });
  
  const content = await page.content();
  console.log('Page loaded. Length:', content.length);
  
  await browser.close();
})();
