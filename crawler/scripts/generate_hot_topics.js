/**
 * 热点话题生成脚本（手动运行 / 定时触发）
 *
 * 用法：
 *   node crawler/scripts/generate_hot_topics.js              # 全平台 Top20
 *   node crawler/scripts/generate_hot_topics.js --top 10    # 只取 Top10
 *   node crawler/scripts/generate_hot_topics.js --platform midjourney
 *   node crawler/scripts/generate_hot_topics.js --days 7    # 只统计最近 7 天数据
 */
require('dotenv').config();

const { generateHotTopics } = require('../core/hotTopics');
const logger = require('../core/logger').child('generate_hot_topics');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const topN = parseInt(get('--top')) || 20;
const platform = get('--platform') || undefined;
const days = parseInt(get('--days')) || null;
const since = days ? new Date(Date.now() - days * 86400000) : undefined;

(async () => {
  logger.info(`Generating hot topics: top=${topN}, platform=${platform || 'all'}, since=${since ? since.toISOString() : 'all time'}`);
  try {
    const results = await generateHotTopics({ platform, topN, since });

    console.log('\n── 热词列表 ──────────────────────────────');
    results.forEach((r, i) => {
      console.log(`${String(i + 1).padStart(2)}. [${r.score.toFixed(1)}] ${r.keyword}`);
    });

    console.log('\n── 热点话题 ──────────────────────────────');
    results.forEach((r, i) => {
      console.log(`${String(i + 1).padStart(2)}. ${r.topic}`);
    });
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }
})();
