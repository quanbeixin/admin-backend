/**
 * 关键词提取脚本（手动运行）
 *
 * 用法：
 *   node crawler/scripts/extract_keywords.js            # 增量模式（只处理没有关键词的 post）
 *   node crawler/scripts/extract_keywords.js --all      # 全量重新处理（先清空 trend_keywords）
 *   node crawler/scripts/extract_keywords.js --sql      # 只输出 SQL，不写入数据库
 *   node crawler/scripts/extract_keywords.js --limit 50 # 限制处理条数
 */
require('dotenv').config();

const supabase = require('../../config/supabase');
const { extractKeywords, processUnextractedPosts } = require('../core/keywords');
const logger = require('../core/logger').child('extract_keywords');

const args = process.argv.slice(2);
const SQL_ONLY = args.includes('--sql');
const ALL_MODE = args.includes('--all');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) || 200 : 200;

async function run() {
  if (ALL_MODE) {
    logger.info('ALL mode: clearing trend_keywords...');
    const { error } = await supabase.from('trend_keywords').delete().neq('id', 0);
    if (error) { logger.error(error.message); process.exit(1); }
    logger.info('Cleared.');
  }

  if (SQL_ONLY) {
    // 输出 SQL 模式：读取数据，本地提取，打印 INSERT 语句
    logger.info(`Fetching up to ${LIMIT} posts...`);
    const { data: posts, error } = await supabase
      .from('trend_posts')
      .select('id, platform, title, tags, description, prompt')
      .limit(LIMIT);
    if (error) { logger.error(error.message); process.exit(1); }

    const lines = [];
    for (const post of posts) {
      const keywords = extractKeywords(post);
      for (const kw of keywords) {
        const escaped = kw.replace(/'/g, "''");
        const platform = post.platform ? `'${post.platform}'` : 'NULL';
        lines.push(`('${post.id}', '${escaped}', ${platform})`);
      }
    }

    if (lines.length === 0) {
      console.log('-- No keywords extracted.');
    } else {
      console.log(`INSERT INTO trend_keywords (post_id, keyword, platform) VALUES`);
      console.log(lines.join(',\n') + ';');
      logger.info(`Generated ${lines.length} rows for ${posts.length} posts`);
    }
    return;
  }

  // 默认：增量写入数据库
  await processUnextractedPosts({ limit: LIMIT });
  logger.info('Done.');
}

run().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
