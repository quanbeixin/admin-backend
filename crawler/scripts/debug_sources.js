/**
 * 单独调试指定爬虫源，输出详细错误
 * 用法: node crawler/scripts/debug_sources.js civitai
 *       node crawler/scripts/debug_sources.js midjourney
 *       node crawler/scripts/debug_sources.js lexica
 */
require('dotenv').config();
process.env.LOG_LEVEL = 'debug';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node debug_sources.js <civitai|midjourney|lexica>');
  process.exit(1);
}

const source = require(`../sources/${target}`);
console.log(`\n=== Running: ${source.name} ===\n`);

source.run()
  .then((results) => {
    console.log(`\n=== Done. ${results.length} item(s) ===`);
    if (results.length > 0) console.log(JSON.stringify(results[0], null, 2));
  })
  .catch((err) => {
    console.error(`\n=== FATAL ERROR ===`);
    console.error(err);
  });
