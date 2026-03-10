/**
 * 关键词提取模块
 * 从 trend_posts 的 title / tags / description / prompt 中提取关键词
 * 优先提取短语（2-3词），再补充单词，结果写入 trend_keywords 表
 */

const supabase = require('../../config/supabase');
const logger = require('./logger').child('keywords');

// ── 停用词（英文 + 常见中文虚词）──────────────────────────────────────
const STOP_WORDS = new Set([
  // 英文基础停用词
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may',
  'might','shall','can','that','this','these','those','it','its','into',
  'about','above','after','before','between','during','through','while',
  'i','my','me','we','our','you','your','he','his','she','her','they',
  'their','what','which','who','whom','when','where','why','how','if',
  'then','than','so','not','no','nor','yet','both','either','each',
  'very','just','also','too','up','down','out','over','under','off',
  'some','any','all','more','most','other','such','only','same','than',
  'cm','px','k','mm','fps','dpi','rgb','s','m','l','xl',
  // 高频但无意义的动词/形容词
  'need','needs','needed','like','likes','liked','want','wants','wanted',
  'see','seen','saw','get','got','make','made','use','used','go','goes',
  'come','comes','look','looks','know','think','say','said','take','give',
  'good','great','best','new','old','big','small','long','high','low',
  'one','two','three','first','last','next','many','much','little','few',
  'really','actually','basically','literally','seriously','totally',
  'lol','omg','wow','yep','yes','hey','hi','ok','okay',
  // 中文虚词
  '的','了','和','是','在','有','我','他','她','它','这','那','也','都',
  '与','以','及','对','就','但','而','等','被','由','从','到','给','其',
]);

// 只保留有实际意义的词（过滤纯数字、单字符、常见无意义后缀）
function isMeaningful(word) {
  if (!word || word.length < 2) return false;
  if (/^\d+$/.test(word)) return false;                        // 纯数字
  if (/^[^a-zA-Z\u4e00-\u9fa5]+$/.test(word)) return false;   // 纯符号
  if (/^(.)\1{2,}$/.test(word)) return false;                  // 重复字符 aaaa / grrr
  if (/\d/.test(word) && word.length <= 3) return false;       // 短数字混合词 u5a
  return !STOP_WORDS.has(word.toLowerCase());
}

/**
 * 从 tags 中提取关键词（兼容数组和逗号分隔字符串两种格式）
 */
function extractFromTags(tags) {
  if (!tags) return [];
  const list = Array.isArray(tags)
    ? tags
    : tags.split(/[,，、;；\n]/);
  return list
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * 从自由文本中提取关键短语和单词
 * 策略：先提取 2-3 词短语，再提取剩余有意义单词
 */
function extractFromText(text) {
  if (!text) return [];

  // 统一处理：小写、去掉特殊字符保留空格和连字符
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5 -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  const results = new Set();

  // 优先提取 3 词短语
  for (let i = 0; i <= words.length - 3; i++) {
    const w1 = words[i], w2 = words[i + 1], w3 = words[i + 2];
    if (isMeaningful(w1) && isMeaningful(w2) && isMeaningful(w3)) {
      results.add(`${w1} ${w2} ${w3}`);
    }
  }

  // 提取 2 词短语
  for (let i = 0; i <= words.length - 2; i++) {
    const w1 = words[i], w2 = words[i + 1];
    if (isMeaningful(w1) && isMeaningful(w2)) {
      results.add(`${w1} ${w2}`);
    }
  }

  // 提取有意义的单词（短语里没覆盖到的）
  for (const w of words) {
    if (isMeaningful(w)) results.add(w);
  }

  return [...results];
}

/**
 * 对单条 post 提取去重关键词列表
 */
function extractKeywords(post) {
  const all = new Set();

  // 1. tags 直接切分（优先级最高，原样保留大小写 → 统一小写）
  for (const kw of extractFromTags(post.tags)) all.add(kw);

  // 2. prompt 短语提取
  for (const kw of extractFromText(post.prompt)) all.add(kw);

  // 3. title 补充
  for (const kw of extractFromText(post.title)) all.add(kw);

  // 4. description 补充（避免与 prompt/title 重复，Set 自动去重）
  for (const kw of extractFromText(post.description)) all.add(kw);

  return [...all].filter((kw) => kw.length >= 2);
}

/**
 * 批量处理 trend_posts，将关键词写入 trend_keywords
 * @param {object[]} posts - trend_posts 记录（含 id, title, tags, description, prompt）
 */
async function saveKeywordsForPosts(posts) {
  if (!posts || posts.length === 0) return;

  const rows = [];
  for (const post of posts) {
    const keywords = extractKeywords(post);
    for (const keyword of keywords) {
      rows.push({ post_id: post.id, keyword, platform: post.platform || null });
    }
  }

  if (rows.length === 0) return;

  // 分批插入，避免单次请求过大（每批 500 条）
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('trend_keywords')
      .insert(batch);
    if (error) {
      logger.error(`Insert keywords failed: ${error.message}`);
      throw error;
    }
  }

  logger.info(`Saved ${rows.length} keywords for ${posts.length} posts`);
}

/**
 * 处理尚未提取关键词的 trend_posts（增量模式）
 * 通过 LEFT JOIN trend_keywords 找出没有关键词的 post
 */
async function processUnextractedPosts({ limit = 200 } = {}) {
  logger.info('Fetching unprocessed posts...');

  // 查找在 trend_keywords 中没有记录的 post_id
  const { data: extracted, error: e1 } = await supabase
    .from('trend_keywords')
    .select('post_id');
  if (e1) throw e1;

  const extractedIds = new Set((extracted || []).map((r) => r.post_id));

  const { data: posts, error: e2 } = await supabase
    .from('trend_posts')
    .select('id, platform, title, tags, description, prompt')
    .limit(limit * 5); // 多取一些，过滤后够用
  if (e2) throw e2;

  const unprocessed = (posts || [])
    .filter((p) => !extractedIds.has(p.id))
    .slice(0, limit);

  logger.info(`Found ${unprocessed.length} unprocessed posts`);
  if (unprocessed.length === 0) return;

  await saveKeywordsForPosts(unprocessed);
}

module.exports = { extractKeywords, saveKeywordsForPosts, processUnextractedPosts };
