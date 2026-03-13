const OpenAI = require('openai');
const supabase = require('../config/supabase');

// 初始化 OpenAI 客户端（用于 DeepSeek）
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder',
  baseURL: 'https://api.deepseek.com',
});

// 配置缓存
let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取 AI Prompt 配置
 */
async function getPromptConfig() {
  // 检查缓存
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    console.log('[性能] 使用配置缓存');
    return configCache;
  }

  try {
    const { data, error } = await supabase
      .from('ai_config')
      .select('*')
      .eq('config_type', 'prompt')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // 如果没有配置，返回默认值
    if (!data) {
      configCache = {
        systemPrompt: '你是一位专业且富有同理心的客服专员，擅长理解用户情绪、分析问题本质，并给出温暖、专业的回复。',
        knowledgeBase: '',
        categories: '会员订阅,功能反馈,账户问题',
        replyStyle: '语气亲切自然，像朋友聊天一样。表达同理心，理解用户的困扰。',
        limitations: '回复必须基于知识库内容。用户需求要简练（6字以内）。'
      };
    } else {
      configCache = data.config_value;
    }

    configCacheTime = now;
    return configCache;
  } catch (error) {
    console.error('获取 Prompt 配置失败:', error);
    // 如果有缓存，即使过期也返回
    if (configCache) {
      console.log('[性能] 使用过期缓存');
      return configCache;
    }
    // 返回默认配置
    return {
      systemPrompt: '你是一位专业且富有同理心的客服专员。',
      knowledgeBase: '',
      categories: '会员订阅,功能反馈,账户问题',
      replyStyle: '语气亲切自然。',
      limitations: '回复必须基于知识库内容。'
    };
  }
}

/**
 * 分析单条反馈
 * @param {Object} feedback - 反馈记录
 * @returns {Object} 分析结果
 */
async function analyzeFeedback(feedback) {
  const startTime = Date.now();

  // 获取配置
  console.log('[性能] 开始获取配置...');
  const configStart = Date.now();
  const config = await getPromptConfig();
  console.log(`[性能] 获取配置完成，耗时: ${Date.now() - configStart}ms`);

  // 查询历史类似问题
  console.log('[性能] 开始查询历史数据...');
  const historyStart = Date.now();
  const { data: historicalFeedback } = await supabase
    .from('feedback')
    .select('user_question, user_question_cn, ai_category, user_request')
    .not('ai_processed', 'is', null)
    .eq('ai_processed', true)
    .limit(50);
  console.log(`[性能] 查询历史数据完成，耗时: ${Date.now() - historyStart}ms`);

  // 构建历史问题列表
  let historicalContext = '';
  if (historicalFeedback && historicalFeedback.length > 0) {
    historicalContext = '\n## 历史问题参考\n以下是之前处理过的类似问题，用于判断是否为新问题：\n';
    historicalFeedback.forEach((item, index) => {
      if (item.user_question_cn || item.user_question) {
        historicalContext += `${index + 1}. ${item.user_question_cn || item.user_question} - 分类：${item.ai_category || '未分类'}\n`;
      }
    });
  }

  const prompt = `# 角色
${config.systemPrompt}

## 回复风格要求
${config.replyStyle}

## 知识库
${config.knowledgeBase}
${historicalContext}

## 限制
${config.limitations}
- 问题分类优先从这些选：${config.categories}
- 判断是否为新问题：如果知识库中有类似问题的解决方案，或者历史问题参考中有相同/类似的问题，则 is_new_request 为 false；否则为 true

## 用户反馈内容
${feedback.user_question}

## 输出要求
返回JSON格式（不要有其他文字）：
{
  “ai_category”: “会员订阅 | 功能反馈 | 账户问题”,
  “ai_sentiment”: “Positive | Neutral | Negative”,
  “ai_reply”: “温暖自然的中文回复（50字内，口语化）”,
  “ai_reply_en”: “地道的英文回复”,
  “user_request”: “用户需求（6字内）”,
  “is_new_request”: true或false,
  “user_question_cn”: “如果用户问题是英文，翻译成中文；如果已经是中文，直接返回原文”
}`;

  // 重试逻辑
  let retries = 3;
  let lastError;

  console.log('[性能] 开始调用 DeepSeek API...');
  const apiStart = Date.now();

  while (retries > 0) {
    try {
      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });

      console.log(`[性能] DeepSeek API 调用成功，耗时: ${Date.now() - apiStart}ms`);

      // 提取响应文本
      const responseText = completion.choices[0].message.content;

    // 尝试解析 JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // 验证必需字段
    if (!analysis.ai_category || !analysis.ai_sentiment || !analysis.ai_reply) {
      throw new Error('分析结果缺少必需字段');
    }

    console.log(`[性能] 整个分析流程完成，总耗时: ${Date.now() - startTime}ms`);
    return analysis;

    } catch (error) {
      lastError = error;
      retries--;

      if (retries > 0) {
        console.log(`[性能] 请求失败，剩余重试次数: ${retries}，等待 3 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // 所有重试都失败
  console.error('[性能] DeepSeek API 调用失败（已重试 3 次），总耗时:', Date.now() - startTime, 'ms');
  console.error('错误详情:', lastError);
  throw lastError;
}

/**
 * 批量分析未处理的反馈
 * @param {number} limit - 每次处理的最大数量
 * @returns {Object} 处理结果统计
 */
async function analyzeUnprocessedFeedback(limit = 10) {
  try {
    // 查询未分析的反馈（ai_processed 为 false 或 null 的记录）
    const { data: feedbackList, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .or('ai_processed.is.null,ai_processed.eq.false')
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    if (!feedbackList || feedbackList.length === 0) {
      return {
        success: true,
        message: '没有待分析的反馈',
        processed: 0,
        failed: 0
      };
    }

    let processed = 0;
    let failed = 0;
    const results = [];

    // 逐条分析
    for (const feedback of feedbackList) {
      try {
        // 调用 Claude 分析
        const analysis = await analyzeFeedback(feedback);

        // 更新数据库
        const { error: updateError } = await supabase
          .from('feedback')
          .update({
            ai_category: analysis.ai_category,
            ai_sentiment: analysis.ai_sentiment,
            ai_reply: analysis.ai_reply,
            ai_reply_en: analysis.ai_reply_en || null,
            user_request: analysis.user_request || null,
            is_new_request: analysis.is_new_request || false,
            ai_processed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', feedback.id);

        if (updateError) {
          throw updateError;
        }

        processed++;
        results.push({
          id: feedback.id,
          status: 'success',
          analysis
        });

        // 避免 API 限流，每次请求间隔 2 秒
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        failed++;
        results.push({
          id: feedback.id,
          status: 'failed',
          error: error.message
        });
        console.error(`反馈 ID ${feedback.id} 分析失败:`, error.message);
      }
    }

    return {
      success: true,
      message: `分析完成：成功 ${processed} 条，失败 ${failed} 条`,
      processed,
      failed,
      results
    };

  } catch (error) {
    console.error('批量分析失败:', error);
    throw error;
  }
}

/**
 * 分析单条指定的反馈
 * @param {number} feedbackId - 反馈 ID
 * @returns {Object} 分析结果
 */
async function analyzeSingleFeedback(feedbackId) {
  try {
    console.log('开始分析反馈，ID:', feedbackId);

    // 查询反馈
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (fetchError) {
      console.error('查询反馈失败:', fetchError);
      throw fetchError;
    }

    if (!feedback) {
      console.error('反馈不存在，ID:', feedbackId);
      throw new Error('反馈不存在');
    }

    console.log('反馈数据:', feedback.user_question);

    // 调用 Claude 分析
    console.log('开始调用 AI 分析...');
    const analysis = await analyzeFeedback(feedback);
    console.log('AI 分析完成:', analysis);

    // 更新数据库
    console.log('开始更新数据库...');
    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        ai_category: analysis.ai_category,
        ai_sentiment: analysis.ai_sentiment,
        ai_reply: analysis.ai_reply,
        ai_reply_en: analysis.ai_reply_en || null,
        user_request: analysis.user_request || null,
        is_new_request: analysis.is_new_request || false,
        user_question_cn: analysis.user_question_cn || null,
        ai_processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId);

    if (updateError) {
      console.error('更新数据库失败:', updateError);
      throw updateError;
    }

    console.log('数据库更新成功，反馈 ID:', feedbackId);

    return {
      success: true,
      message: '分析完成',
      data: analysis
    };

  } catch (error) {
    console.error('单条分析失败，反馈 ID:', feedbackId, '错误详情:', error);
    throw error;
  }
}

module.exports = {
  analyzeUnprocessedFeedback,
  analyzeSingleFeedback
};
