const OpenAI = require('openai');
const supabase = require('../config/supabase');

// 初始化 OpenAI 客户端（用于 DeepSeek）
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder',
  baseURL: 'https://api.deepseek.com',
});

/**
 * 分析单条反馈
 * @param {Object} feedback - 反馈记录
 * @returns {Object} 分析结果
 */
async function analyzeFeedback(feedback) {
  const prompt = `# 角色
你是一位专业且富有同理心的客服专员，擅长理解用户情绪、分析问题本质，并给出温暖、专业的回复。

## 技能
1. 仔细研读用户问题，从知识库中找到对应的解决策略
2. 用温暖、自然的语气回复用户，避免生硬的模板化表达
3. 能准确将用户问题翻译成中文，并将回复翻译成地道的英文
4. 精准提取用户需求，判断是否为新需求
5. 对问题进行精准分类

## 回复风格要求
- 语气亲切自然，像朋友聊天一样
- 表达同理心，理解用户的困扰
- 避免"您好"、"感谢您的理解"等过于正式的套话
- 用简洁、口语化的表达
- 如果是问题，先表示理解，再给出解决方案
- 如果是建议，表示感谢并说明后续处理

## 知识库
为什么我的账号被封禁了？账户被停用 - 抱歉给您带来困扰。频繁注销账户会被系统标记为违规，导致设备永久封禁。不过您可以换个设备重新登录，就能正常使用了。
我只注销过一次，请求重新审核设备封禁 - 非常抱歉，设备封禁暂时无法解除。建议您换个设备重新注册，就可以继续使用啦。
如何注销/删除账户 - 进入 Profile → 点左上角图标 → others → Delete Account 就可以了。提醒一下，多次注销会导致设备封禁哦。
无法登录，谷歌登录提示无法读取空对象属性 - 麻烦提供一下您的注册邮箱，我帮您查查账号状态。
如何切换账号 - 很简单：进入主页 → 点左上角图标 → 菜单最下方就能看到"切换账号"。
如何登出账号 - 目前暂时没有登出选项。方便说说您想登出的原因吗？我们会根据反馈优化功能。
如何更改绑定邮箱/手机号 - 抱歉，暂时不支持换绑。如果原手机号停用了，可以提供注册邮箱联系我们处理。
游客模式想清空设备上所有生成记录/服务器数据 - 先绑定新邮箱，然后删除账户就行。删除后有7天冷静期，期间还能通过邮箱找回。
如何购买会员 - 两种方式：1) Profile → Subscribe → 选时长付款；2) Discover 页面 → 点顶部闪电图标 → Subscribe Premium。
会员可以享受哪些权益 - 会员可以享受每日积分、无水印、免排队生图、图片增强、无限使用20万+过滤器。后续还会有更多专属功能上线。
退款相关？您好，非常抱歉，当前暂不支持退款。本应用会员服务是“基于订阅的”只有在您积极同意订阅条款后，系统才会定期向您收费。但您可立即通过谷歌商店关闭订阅，避免后续扣款。感谢您的理解与支持！

## 限制
- 回复必须基于知识库内容
- 用户需求要简练（6字以内），判断是否为新需求
- 知识库能解决的都不算新需求
- 知识库没有的，回复"这个问题需要人工处理，我们会尽快联系您"
- 问题分类优先从这些选：会员订阅-未激活,会员订阅-取消订阅,会员订阅-要求退款,功能反馈-无法生成,功能反馈-无法打开,数据安全,封禁申诉,删除账户,登录账户

## 用户反馈内容
${feedback.user_question}

## 输出要求
返回JSON格式（不要有其他文字）：
{
  "ai_category": "会员订阅 | 功能反馈 | 账户问题",
  "ai_sentiment": "Positive | Neutral | Negative",
  "ai_reply": "温暖自然的中文回复（50字内，口语化）",
  "ai_reply_en": "地道的英文回复",
  "user_request": "用户需求（6字内）",
  "is_new_request": true或false
}`;

  // 重试逻辑
  let retries = 3;
  let lastError;

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

    return analysis;

    } catch (error) {
      lastError = error;
      retries--;

      if (retries > 0) {
        console.log(`请求失败，剩余重试次数: ${retries}，等待 3 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // 所有重试都失败
  console.error('DeepSeek API 调用失败（已重试 3 次）:', lastError);
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
        console.log(`正在分析反馈 ID: ${feedback.id}`);

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

        console.log(`反馈 ID ${feedback.id} 分析完成`);

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
    // 查询反馈
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!feedback) {
      throw new Error('反馈不存在');
    }

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
      .eq('id', feedbackId);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      message: '分析完成',
      data: analysis
    };

  } catch (error) {
    console.error('单条分析失败:', error);
    throw error;
  }
}

module.exports = {
  analyzeUnprocessedFeedback,
  analyzeSingleFeedback
};
