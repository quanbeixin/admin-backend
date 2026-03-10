require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
    proxy: { server: 'socks5://127.0.0.1:7897' },
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  page.on('response', async (resp) => {
    const url = resp.url();
    if (!url.includes('lexica.art')) return;
    const ct = resp.headers()['content-type'] || '';
    // 打印所有请求（JSON 和 非 JSON）
    console.log('→', resp.status(), url.split('?')[0]);
    if (ct.includes('json')) {
      try {
        const json = await resp.json();
        console.log('  JSON preview:', JSON.stringify(json).slice(0, 400));
      } catch (e) { /* ignore */ }
    }
  });

  await page.goto('https://lexica.art/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 8000));
  await browser.close();
  console.log('\nDone.');
})();
