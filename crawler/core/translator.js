const axios = require('axios');
const logger = require('./logger').child('translator');

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

// 判断文本是否已经是中文（含中文字符超过30%则认为是中文）
function isChinese(text) {
  if (!text) return false;
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  return chineseChars.length / text.length > 0.3;
}

/**
 * 翻译单条文本到中文
 * @param {string} text
 * @returns {Promise<string|null>}
 */
async function translateToZh(text) {
  if (!text || !text.trim()) return null;
  if (isChinese(text)) return text;

  try {
    const { data } = await axios.get(MYMEMORY_URL, {
      params: { q: text.slice(0, 500), langpair: 'en|zh-CN' },
      timeout: 8000,
    });

    const translated = data?.responseData?.translatedText;
    if (!translated || translated === text) return null;

    return translated;
  } catch (err) {
    logger.warn(`Translation failed: ${err.message}`);
    return null;
  }
}

/**
 * 批量翻译，逐条处理避免触发频率限制
 * @param {string[]} texts
 * @returns {Promise<(string|null)[]>}
 */
async function batchTranslate(texts) {
  const results = [];
  for (const text of texts) {
    const translated = await translateToZh(text);
    results.push(translated);
    // 每条间隔 300ms，避免触发 MyMemory 频率限制
    if (texts.length > 1) await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}

module.exports = { translateToZh, batchTranslate, isChinese };
