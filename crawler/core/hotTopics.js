/**
 * 热点话题生成模块
 * 1. 从 trend_keywords 聚合关键词热度（次数 + 点赞/评论加权）
 * 2. 取 Top N 关键词
 * 3. 翻译为中文，套模板生成可读热点话题
 * 4. 写入 trend_hot_topics 表
 */

const supabase = require('../../config/supabase');
const { isChinese } = require('./translator');
const logger = require('./logger').child('hotTopics');

// ── 常用 AI 创作 / 社媒关键词词典（英文 → 中文）──────────────────────
const KW_DICT = {
  // AI 工具与平台
  ai: 'AI', 'ai art': 'AI艺术', 'ai generated': 'AI生成', 'aiart': 'AI绘画',
  midjourney: 'Midjourney', 'stable diffusion': '稳定扩散', 'dall-e': 'DALL-E',
  'comfy ui': 'ComfyUI', lora: 'LoRA', controlnet: 'ControlNet',
  dreamina: 'Dreamina', tiktok: 'TikTok', lexica: 'Lexica',
  // 风格
  anime: '动漫', manga: '漫画', cyberpunk: '赛博朋克', fantasy: '奇幻',
  realistic: '写实', photorealistic: '超写实', portrait: '人像',
  landscape: '风景', abstract: '抽象', surreal: '超现实', 'pixel art': '像素艺术',
  watercolor: '水彩', illustration: '插画', concept: '概念艺术',
  'concept art': '概念设计', 'digital art': '数字艺术', '3d': '3D',
  'character design': '角色设计', cinematic: '电影感',
  // 主题
  girl: '少女', woman: '女性', man: '男性', dragon: '龙', cat: '猫',
  robot: '机器人', space: '太空', city: '城市', nature: '自然',
  dark: '暗黑', light: '光影', neon: '霓虹', vintage: '复古',
  minimalist: '极简', aesthetic: '美学风', magical: '魔幻',
  warrior: '战士', princess: '公主', wizard: '巫师', monster: '怪物',
  flower: '花卉', water: '水景', fire: '火焰', forest: '森林',
  // 修饰词
  'ultra detailed': '超精细', 'highly detailed': '高度细节',
  'high quality': '高品质', '4k': '4K', '8k': '8K',
  'cinematic lighting': '电影灯光', 'golden hour': '��金时刻',
  'soft light': '柔光', 'dramatic': '戏剧感', trending: '热门趋势',
  // 情绪/互动
  viral: '病毒式传播', popular: '爆款',
  satisfying: '解压治愈', creative: '创意', beautiful: '精美',
  stunning: '震撼', epic: '史诗级', cute: '可爱', cool: '酷炫',
  // TikTok 常见标签
  fyp: '为你推荐', foryou: '为你页面', foryoupage: '推荐流',
  viral: '爆款', trending: '热门趋势', art: '艺术创作',
  drawing: '手绘', sketch: '素描', painting: '绘画',
  animation: '动画', video: '视频', shorts: '短视频',
  mukbang: '吃播', asmr: 'ASMR',
  // 其他平台 tag / 俚语类直接过滤掉（在停用词里处理更合适）
};

// ── 话题模板（按关键词类型分组）────────────────────────────────────────
// 占位符 {kw} 会被替换为翻译后的关键词
const TEMPLATES = [
  '{kw}风格席卷全网',
  '{kw}创作热潮来袭',
  '{kw}审美正在爆发',
  '{kw}成为最热选题',
  '{kw}话题引爆社交',
  '{kw}内容大量涌现',
  '{kw}正在占领创作圈',
  '{kw}吸引百万眼球',
  '{kw}风潮持续升温',
  '{kw}成为当下最热标签',
];

/**
 * 轮换取模板（根据 index 避免所有话题用同一个）
 */
function pickTemplate(index) {
  return TEMPLATES[index % TEMPLATES.length];
}

/**
 * 把关键词填入模板，生成可读话题
 * 如果关键词本身已够长（≥4字），直接返回
 */
function buildTopic(kwZh, templateIndex) {
  const tpl = pickTemplate(templateIndex);
  return tpl.replace('{kw}', kwZh);
}

/**
 * 从数据库聚合关键词热度
 * 热度公式：出现次数 × (1 + avg_likes/1000 + avg_comments/100)
 *
 * @param {{ platform?: string, limit?: number, since?: Date }} opts
 * @returns {Promise<Array<{ keyword, platform, count, avg_likes, avg_comments, score }>>}
 */
async function aggregateKeywords({ platform, limit = 20, since } = {}) {
  // 1. 拉取 trend_keywords
  let kwQuery = supabase
    .from('trend_keywords')
    .select('keyword, platform, post_id');

  if (platform) kwQuery = kwQuery.eq('platform', platform);
  if (since) kwQuery = kwQuery.gte('created_at', since.toISOString());

  const { data: kwData, error: kwErr } = await kwQuery;
  if (kwErr) throw kwErr;
  if (!kwData || kwData.length === 0) return [];

  // 2. 拉取相关 trend_posts 的点赞/评论
  const postIds = [...new Set(kwData.map((r) => r.post_id))];
  const { data: postsData, error: postsErr } = await supabase
    .from('trend_posts')
    .select('id, likes, comments')
    .in('id', postIds);
  if (postsErr) throw postsErr;

  const postMap = new Map((postsData || []).map((p) => [p.id, p]));

  // 3. 本地聚合
  const map = new Map();
  for (const row of kwData) {
    const post = postMap.get(row.post_id) || {};
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    const key = `${row.keyword}__${row.platform || ''}`;

    if (!map.has(key)) {
      map.set(key, { keyword: row.keyword, platform: row.platform, count: 0, totalLikes: 0, totalComments: 0 });
    }
    const entry = map.get(key);
    entry.count += 1;
    entry.totalLikes += likes;
    entry.totalComments += comments;
  }

  const results = [];
  for (const entry of map.values()) {
    const avgLikes = entry.count > 0 ? entry.totalLikes / entry.count : 0;
    const avgComments = entry.count > 0 ? entry.totalComments / entry.count : 0;
    const score = entry.count * (1 + avgLikes / 1000 + avgComments / 100);
    results.push({
      keyword: entry.keyword,
      platform: entry.platform,
      count: entry.count,
      avg_likes: Math.round(avgLikes),
      avg_comments: Math.round(avgComments),
      score: Math.round(score * 100) / 100,
    });
  }

  results.sort((a, b) => b.score - a.score);

  // 去掉被更长短语完全包含的子短语（保留更具体的短语）
  const deduped = results.filter((item, idx) => {
    const kw = item.keyword.toLowerCase();
    return !results.some((other, otherIdx) => {
      if (otherIdx === idx) return false;
      const ok = other.keyword.toLowerCase();
      return ok !== kw && ok.includes(kw) && other.score >= item.score;
    });
  });

  return deduped.slice(0, limit);
}

/**
 * 主函数：聚合 → 翻译 → 生成话题 → 写库
 *
 * @param {{ platform?: string, topN?: number, since?: Date }} opts
 */
async function generateHotTopics({ platform, topN = 20, since } = {}) {
  logger.info(`Aggregating top ${topN} keywords...${platform ? ` platform=${platform}` : ''}`);

  const topKeywords = await aggregateKeywords({ platform, limit: topN, since });
  if (topKeywords.length === 0) {
    logger.warn('No keywords found, skipping.');
    return [];
  }
  logger.info(`Got ${topKeywords.length} keywords. Top: ${topKeywords[0].keyword} (score=${topKeywords[0].score})`);

  // 翻译关键词到中文
  logger.info('Translating keywords...');
  const rows = [];
  for (let i = 0; i < topKeywords.length; i++) {
    const item = topKeywords[i];
    const kwLower = item.keyword.toLowerCase();

    // 优先词典查找，其次保留原文
    const kwZh = isChinese(item.keyword)
      ? item.keyword
      : (KW_DICT[kwLower] || item.keyword);

    const topic = buildTopic(kwZh, i);
    rows.push({
      keyword: item.keyword,
      score: item.score,
      topic,
      platform: item.platform || platform || null,
    });

    logger.debug(`[${i + 1}] ${item.keyword} → ${kwZh} → "${topic}" (score=${item.score})`);
  }

  // 写入 trend_hot_topics
  const { error } = await supabase.from('trend_hot_topics').insert(rows);
  if (error) {
    logger.error(`Insert trend_hot_topics failed: ${error.message}`);
    throw error;
  }

  logger.info(`Saved ${rows.length} hot topics to trend_hot_topics`);
  return rows;
}

module.exports = { generateHotTopics, aggregateKeywords };
