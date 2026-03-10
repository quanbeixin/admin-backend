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

  await page.goto('https://lexica.art/', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 5000));

  // 提取图片和对应文字（找包含图片的最近父容器里的文字）
  const cards = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img[src*="lexica.art"]'));
    return imgs.slice(0, 15).map((img) => {
      const uuid = (img.src.match(/\/([a-f0-9-]{36})$/) || [])[1] || '';
      // 向上找包含文字的父容器
      let el = img;
      let prompt = '';
      for (let i = 0; i < 8; i++) {
        el = el.parentElement;
        if (!el) break;
        // 找 p 或 span 文字子节点
        const textEl = el.querySelector('p, span, div > span');
        if (textEl) {
          const t = textEl.textContent.trim();
          if (t.length > 10) { prompt = t; break; }
        }
      }
      // 找 a 链接（图片详情页）
      let el2 = img;
      let href = '';
      for (let i = 0; i < 6; i++) {
        el2 = el2.parentElement;
        if (!el2) break;
        if (el2.tagName === 'A') { href = el2.href; break; }
      }
      return { uuid, src: img.src, prompt: prompt.slice(0, 200), href };
    });
  });

  console.log(`Found ${cards.length} cards:`);
  cards.forEach((c) => console.log(JSON.stringify(c)));

  await browser.close();
})();
