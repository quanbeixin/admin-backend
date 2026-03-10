require('dotenv').config();

module.exports = {
  browser: {
    headless: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    timeout: 30000,
  },
  scheduler: {
    // cron 表达式，默认每小时执行一次
    interval: process.env.CRAWLER_INTERVAL || '0 * * * *',
  },
  tiktok: {
    proxy: process.env.TIKTOK_PROXY || process.env.PROXY_URL || null,
    maxItems: parseInt(process.env.TIKTOK_MAX_ITEMS) || 30,
  },
  dreamina: {
    proxy: process.env.PROXY_URL || null,
    maxItems: parseInt(process.env.DREAMINA_MAX_ITEMS) || 30,
    // Dreamina 需要非 headless 模式才能正常渲染
    headless: process.env.DREAMINA_HEADLESS !== 'false' ? false : true,
  },
midjourney: {
    proxy: process.env.PROXY_URL || null,
    maxItems: parseInt(process.env.MIDJOURNEY_MAX_ITEMS) || 30,
  },
  lexica: {
    maxItems: parseInt(process.env.LEXICA_MAX_ITEMS) || 30,
  },
  tiktok_ai: {
    proxy: process.env.TIKTOK_PROXY || process.env.PROXY_URL || null,
    maxItems: parseInt(process.env.TIKTOK_AI_MAX_ITEMS) || 30,
  },
};
