const logger = require('../core/logger').child('scheduler');
const { closeBrowser } = require('../core/browser');
const { processUnextractedPosts } = require('../core/keywords');
const { generateHotTopics } = require('../core/hotTopics');

// 注册所有爬虫 source（新增爬虫在此添加）
const sources = [
  require('../sources/tiktok'),
  require('../sources/tiktok_ai'),
  require('../sources/google_trends_india'),
];

/**
 * 运行所有爬虫（串行，避免资源争抢）
 */
async function runAll() {
  logger.info(`Running ${sources.length} source(s)...`);
  for (const source of sources) {
    try {
      logger.info(`→ ${source.name}`);
      const results = await source.run();
      logger.info(`← ${source.name} done, ${results.length} item(s)`);
    } catch (err) {
      logger.error(`${source.name} failed: ${err.message}`);
    }
  }
  await closeBrowser();
  logger.info('All sources finished.');

  // 爬完后自动提取新增帖子的关键词
  try {
    logger.info('Extracting keywords for new posts...');
    await processUnextractedPosts({ limit: 500 });
  } catch (err) {
    logger.error(`Keyword extraction failed: ${err.message}`);
  }

  // 关键词提取完后自动生成热点话题
  try {
    logger.info('Generating hot topics...');
    await generateHotTopics({ topN: 20 });
  } catch (err) {
    logger.error(`Hot topics generation failed: ${err.message}`);
  }
}

module.exports = { runAll };
