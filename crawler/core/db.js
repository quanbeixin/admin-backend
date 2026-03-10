const supabase = require('../../config/supabase');
const logger = require('./logger').child('db');

/**
 * 批量写入 trend_posts，已存在的 url 跳过（忽略冲突）
 * @param {object[]} rows
 */
async function saveTrendPosts(rows) {
  if (!rows || rows.length === 0) return;

  // upsert：url 冲突时合并更新所有字段（含 image_url）
  let { error } = await supabase
    .from('trend_posts')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: false });

  if (error && error.message.includes('no unique or exclusion constraint')) {
    logger.warn('url unique constraint not found, falling back to insert');
    ({ error } = await supabase.from('trend_posts').insert(rows));
  }

  if (error) {
    logger.error(`saveTrendPosts failed: ${error.message}`);
    throw error;
  }

  logger.info(`Saved ${rows.length} rows to trend_posts`);
}

module.exports = { saveTrendPosts };
