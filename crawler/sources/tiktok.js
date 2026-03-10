const { chromium } = require('playwright');
const config = require('../core/config');
const logger = require('../core/logger').child('tiktok');
const { saveTrendPosts } = require('../core/db');
const { batchTranslate } = require('../core/translator');

const SOURCE_NAME = 'tiktok';

// 只拦截 tiktok.com 域名下的 JSON 响应，不限定路径
const TIKTOK_API_HOST = /tiktok\.com/;

/**
 * 随机延迟，模拟真实用户行为
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay(min = 1000, max = 3000) {
  return sleep(Math.floor(Math.random() * (max - min) + min));
}

/**
 * 判断一个对象是否像 TikTok 视频条目
 */
function isVideoItem(item) {
  return item && item.id && item.author && item.stats;
}

/**
 * 从 JSON 响应中提取视频列表（兼容不同字段名）
 */
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
 * 从 TikTok API 响应中解析视频数据，映射到 trend_posts 表字段
 */
function parseVideoItem(item) {
  try {
    const author = item.author || {};
    const stats = item.stats || {};
    const video = item.video || {};

    return {
      platform: 'tiktok',
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
      // 视频封面（首帧），优先取高清原图
      image_url: video.originCover || video.cover || video.dynamicCover || null,
    };
  } catch {
    return null;
  }
}

/**
 * 滚动页面以触发更多内容加载
 */
async function scrollPage(page, times = 3) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await randomDelay(1500, 2500);
  }
}

/**
 * 从页面内嵌的 __UNIVERSAL_DATA_FOR_REHYDRATION__ 脚本中提取数据
 * TikTok 会把首屏数据直接注入到 HTML 里，不需要等 XHR
 */
async function extractFromPageScript(page) {
  try {
    const data = await page.evaluate(() => {
      const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (!el) return null;
      return JSON.parse(el.textContent);
    });

    if (!data) return [];

    // 遍历所有 key 找视频列表
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
 * 爬取入口
 */
async function run() {
  logger.info('Start crawling TikTok trending');

  const launchOptions = {
    headless: config.browser.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  };

  if (config.tiktok.proxy) {
    launchOptions.proxy = { server: config.tiktok.proxy };
    logger.info(`Using proxy: ${config.tiktok.proxy}`);
  }

  const browser = await chromium.launch(launchOptions);
  const results = [];
  const seenIds = new Set();

  const addItems = (items) => {
    for (const item of items) {
      if (results.length >= config.tiktok.maxItems) break;
      if (seenIds.has(item.url)) continue;
      seenIds.add(item.url);
      results.push(item);
      logger.debug(`Captured: @${item.author} - ${item.title.slice(0, 40)}`);
    }
  };

  try {
    const context = await browser.newContext({
      userAgent: config.browser.userAgent,
      viewport: config.browser.viewport,
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    });

    // 屏蔽自动化检测
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();
    page.setDefaultTimeout(config.browser.timeout);

    // 扫描所有 tiktok.com 的 JSON 响应，不限路径
    page.on('response', async (response) => {
      if (results.length >= config.tiktok.maxItems) return;
      const url = response.url();
      if (!TIKTOK_API_HOST.test(url)) return;

      const contentType = response.headers()['content-type'] || '';
      if (!contentType.includes('json')) return;

      try {
        const json = await response.json();
        const items = extractItems(json);
        if (items.length > 0) {
          logger.info(`API hit: ${url.split('?')[0]} → ${items.length} items`);
          addItems(items.map(parseVideoItem).filter(Boolean));
        }
      } catch {
        // 非 JSON 忽略
      }
    });

    logger.info('Navigating to TikTok Explore...');
    await page.goto('https://www.tiktok.com/explore', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });

    await randomDelay(2000, 3000);

    // 优先从页面内嵌脚本提取（首屏数据，最可靠）
    if (results.length === 0) {
      logger.info('Trying page script extraction...');
      const scriptItems = await extractFromPageScript(page);
      if (scriptItems.length > 0) {
        logger.info(`Page script → ${scriptItems.length} items`);
        addItems(scriptItems);
      }
    }

    // 滚动触发更多 XHR 请求
    if (results.length < config.tiktok.maxItems) {
      logger.info('Scrolling to load more...');
      await scrollPage(page, 4);
    }

    // 最终降级：DOM 解析（数据不完整但有 url 和缩略图）
    if (results.length === 0) {
      logger.warn('All strategies failed, falling back to DOM parsing');
      const domItems = await page.$$eval(
        'a[href*="/video/"]',
        (els) => {
          const seen = new Set();
          return els
            .filter((el) => {
              const href = el.href;
              if (!href.includes('/video/') || seen.has(href)) return false;
              seen.add(href);
              return true;
            })
            .slice(0, 30)
            .map((el) => ({
              url: el.href,
              // 取同级或子级最近的 img 作为封面
              image_url: el.querySelector('img')?.src
                || el.closest('[class]')?.querySelector('img')?.src
                || null,
            }));
        }
      );
      domItems.forEach(({ url, image_url }) => {
        const match = url.match(/@([^/]+)\/video\/(\d+)/);
        results.push({
          platform: 'tiktok',
          title: '',
          url,
          author: match ? match[1] : '',
          likes: 0,
          comments: 0,
          views: 0,
          tags: [],
          publish_time: null,
          image_url: image_url || null,
        });
      });
    }

    logger.info(`Crawl finished. Total items: ${results.length}`);

    // 批量翻译标题为中文
    if (results.length > 0) {
      logger.info('Translating titles to Chinese...');
      const titles = results.map((r) => r.title);
      const translations = await batchTranslate(titles);
      translations.forEach((zh, i) => { results[i].title_zh = zh; });
      logger.info('Translation done.');
    }

    try {
      await saveTrendPosts(results);
    } catch (dbErr) {
      logger.error(`DB save failed: ${dbErr.message}`);
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
