const { chromium } = require('playwright');
const config = require('../core/config');
const logger = require('../core/logger').child('tiktok_ai');
const { saveTrendPosts } = require('../core/db');
const { batchTranslate } = require('../core/translator');

const SOURCE_NAME = 'tiktok_ai';
const TIKTOK_API_HOST = /tiktok\.com/;

// 依次爬取的 AI 话题标签页
const AI_TAG_URLS = [
  'https://www.tiktok.com/tag/ai',
  'https://www.tiktok.com/tag/aiart',
  'https://www.tiktok.com/tag/aiartwork',
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay(min = 1000, max = 3000) {
  return sleep(Math.floor(Math.random() * (max - min) + min));
}

function isVideoItem(item) {
  return item && item.id && item.author && item.stats;
}

function extractItems(json) {
  const candidates = [
    json?.itemList,
    json?.item_list,
    json?.data?.itemList,
    json?.data?.item_list,
    json?.data?.items,
  ];
  for (const list of candidates) {
    if (Array.isArray(list) && list.length > 0 && isVideoItem(list[0])) {
      return list;
    }
  }
  return [];
}

/**
 * 解析 TikTok 视频条目，映射到 trend_posts 表字段
 * platform 标记为 tiktok_ai，区别于通用 tiktok 爬虫
 */
function parseVideoItem(item) {
  try {
    const author = item.author || {};
    const stats = item.stats || {};
    const video = item.video || {};

    return {
      platform: 'tiktok_ai',
      title: item.desc || '',
      description: item.desc || '',
      prompt: '',
      url: `https://www.tiktok.com/@${author.uniqueId}/video/${item.id}`,
      author: author.uniqueId || author.nickname || '',
      likes: stats.diggCount || 0,
      comments: stats.commentCount || 0,
      views: stats.playCount || 0,
      tags: (item.challenges || []).map((c) => c.title),
      publish_time: item.createTime ? new Date(item.createTime * 1000).toISOString() : null,
      image_url: video.originCover || video.cover || video.dynamicCover || null,
    };
  } catch {
    return null;
  }
}

/**
 * 从页面内嵌脚本提取数据（SSR 注水）
 */
async function extractFromPageScript(page) {
  try {
    const data = await page.evaluate(() => {
      const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (!el) return null;
      return JSON.parse(el.textContent);
    });
    if (!data) return [];

    const results = [];
    const search = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val) && val.length > 0 && isVideoItem(val[0])) {
          val.forEach((item) => {
            const parsed = parseVideoItem(item);
            if (parsed) results.push(parsed);
          });
        } else if (typeof val === 'object') {
          search(val);
        }
      }
    };
    search(data);
    return results;
  } catch {
    return [];
  }
}

/**
 * 爬取入口：依次访问 AI 话题标签页，采集视频数据
 */
async function run() {
  logger.info('Start crawling TikTok AI trending');

  const maxItems = config.tiktok_ai?.maxItems || 30;

  const launchOptions = {
    headless: config.browser.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  };

  if (config.tiktok_ai?.proxy || config.tiktok?.proxy) {
    launchOptions.proxy = { server: config.tiktok_ai?.proxy || config.tiktok?.proxy };
    logger.info(`Using proxy: ${launchOptions.proxy.server}`);
  }

  const browser = await chromium.launch(launchOptions);
  const results = [];
  const seenUrls = new Set();

  try {
    const context = await browser.newContext({
      userAgent: config.browser.userAgent,
      viewport: config.browser.viewport,
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    for (const tagUrl of AI_TAG_URLS) {
      if (results.length >= maxItems) break;

      logger.info(`Navigating to ${tagUrl}...`);
      const page = await context.newPage();
      page.setDefaultTimeout(config.browser.timeout);

      // 拦截 API 响应
      page.on('response', async (response) => {
        if (results.length >= maxItems) return;
        const url = response.url();
        if (!TIKTOK_API_HOST.test(url)) return;
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;

        try {
          const json = await response.json();
          const items = extractItems(json);
          if (items.length > 0) {
            logger.info(`API hit: ${url.split('?')[0]} → ${items.length} items`);
            items.map(parseVideoItem).filter(Boolean).forEach((item) => {
              if (results.length >= maxItems || seenUrls.has(item.url)) return;
              seenUrls.add(item.url);
              results.push(item);
              logger.debug(`Captured: @${item.author} - ${item.title.slice(0, 40)}`);
            });
          }
        } catch { /* 非 JSON 忽略 */ }
      });

      try {
        await page.goto(tagUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      } catch {
        logger.warn(`goto ${tagUrl} timeout, continuing...`);
      }

      await randomDelay(2000, 3000);

      // 优先尝试页面内嵌脚本
      if (results.length === 0) {
        const scriptItems = await extractFromPageScript(page);
        if (scriptItems.length > 0) {
          logger.info(`Page script → ${scriptItems.length} items`);
          scriptItems.forEach((item) => {
            if (results.length >= maxItems || seenUrls.has(item.url)) return;
            seenUrls.add(item.url);
            results.push(item);
          });
        }
      }

      // 滚动触发更多
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await randomDelay(1500, 2500);
      }

      await page.close();
    }

    logger.info(`Crawl finished. Total: ${results.length}`);

    if (results.length > 0) {
      logger.info('Translating titles to Chinese...');
      const translations = await batchTranslate(results.map((r) => r.title));
      translations.forEach((zh, i) => { results[i].title_zh = zh; });
      logger.info('Translation done.');

      try {
        await saveTrendPosts(results);
      } catch (dbErr) {
        logger.error(`DB save failed: ${dbErr.message}`);
      }
    }

    return results;
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    return results;
  } finally {
    await browser.close();
  }
}

module.exports = { run, name: SOURCE_NAME };
