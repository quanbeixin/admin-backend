const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const config = require('../core/config');
const logger = require('../core/logger').child('google_trends_india');
const { saveTrendPosts } = require('../core/db');

const SOURCE_NAME = 'google_trends_india';
const TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=IN';

function buildAgent(proxyUrl) {
  if (!proxyUrl) return undefined;
  return proxyUrl.startsWith('socks')
    ? new SocksProxyAgent(proxyUrl)
    : new HttpsProxyAgent(proxyUrl);
}

/**
 * 用正则从 RSS XML 中提取 <item> 列表
 */
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const get = (pattern) => (pattern.exec(block) || [])[1] || '';

    const title = get(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || get(/<title>(.*?)<\/title>/);
    const pubDate = get(/<pubDate>(.*?)<\/pubDate>/);
    const traffic = get(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/);
    const description = get(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || get(/<description>(.*?)<\/description>/);
    const imageUrl = get(/<ht:picture>(.*?)<\/ht:picture>/) || null;

    // 相关新闻标题
    const newsItems = [];
    const newsRegex = /<ht:news_item_title><!\[CDATA\[(.*?)\]\]><\/ht:news_item_title>/g;
    let nm;
    while ((nm = newsRegex.exec(block)) !== null) {
      if (nm[1]) newsItems.push(nm[1]);
    }

    if (title) items.push({ title, pubDate, traffic, description, newsItems, imageUrl });
  }
  return items;
}

function parseTraffic(str) {
  if (!str) return 0;
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  if (/B/i.test(str)) return Math.round(num * 1e9);
  if (/M/i.test(str)) return Math.round(num * 1e6);
  if (/K/i.test(str)) return Math.round(num * 1e3);
  return Math.round(num);
}

async function run() {
  logger.info('Start crawling Google Trends India (RSS)');
  const maxItems = config.google_trends_india?.maxItems || 20;
  const proxyUrl = process.env.PROXY_URL || null;
  const httpsAgent = buildAgent(proxyUrl);
  if (proxyUrl) logger.info(`Using proxy: ${proxyUrl}`);

  try {
    const { data: xml } = await axios.get(TRENDS_RSS_URL, {
      httpsAgent,
      timeout: 20000,
      headers: {
        'User-Agent': config.browser.userAgent,
        Accept: 'application/rss+xml, application/xml, text/xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const items = parseRssItems(xml);
    logger.info(`Parsed ${items.length} trending items`);

    // 用标题构造唯一 URL，保证同批次无重复
    const seenUrls = new Set();
    const results = [];
    for (const item of items) {
      if (results.length >= maxItems) break;
      const url = `https://trends.google.com/trending?geo=IN&q=${encodeURIComponent(item.title)}`;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      results.push({
        platform: SOURCE_NAME,
        title: item.title,
        description: item.description || item.newsItems[0] || '',
        prompt: '',
        url,
        author: 'Google Trends IN',
        likes: 0,
        comments: 0,
        views: parseTraffic(item.traffic),
        tags: item.newsItems.slice(0, 5),
        publish_time: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        image_url: item.imageUrl || null,
      });
    }

    logger.info(`Crawl finished. Total: ${results.length}`);
    if (results.length > 0) await saveTrendPosts(results);
    return results;
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    return [];
  }
}

module.exports = { run, name: SOURCE_NAME };
