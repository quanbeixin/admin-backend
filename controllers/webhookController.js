const supabase = require('../config/supabase');
const { analyzeSingleFeedback } = require('../services/feedbackAnalysisService');

/**
 * 接收外部反馈数据的 Webhook
 * POST /api/webhook/feedback
 */
exports.receiveFeedback = async (req, res) => {
  try {
    const {
      user_email,
      product,
      channel,
      user_question,
      // 可选字段
      date,
      user_request,
      status
    } = req.body;

    // 验证必需字段（只需要 user_question）
    if (!user_question) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段：user_question'
      });
    }

    // 构造反馈数据
    const feedbackData = {
      date: date || new Date().toISOString(),
      user_email: user_email || 'anonymous@form.com',  // 允许匿名提交
      product: product || '未指定',
      channel: channel || 'Google Form',
      user_question,
      user_request: user_request || null,
      issue_type: '待分类',
      is_new_request: false,
      ai_processed: false,
      status: status || 'pending',
      created_at: new Date().toISOString()
    };

    // 写入数据库
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 可选：自动触发 AI 分析（异步，不阻塞响应）
    if (process.env.AUTO_AI_ANALYSIS === 'true') {
      analyzeSingleFeedback(data.id).catch(err => {
        console.error('自动 AI 分析失败:', err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: '反馈接收成功',
      data: {
        id: data.id,
        created_at: data.created_at
      }
    });

  } catch (error) {
    console.error('Webhook 接收失败:', error);
    res.status(500).json({
      success: false,
      message: '接收反馈失败',
      error: error.message
    });
  }
};

/**
 * 批量接收反馈数据
 * POST /api/webhook/feedback/batch
 */
exports.receiveFeedbackBatch = async (req, res) => {
  try {
    const { feedbacks } = req.body;

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'feedbacks 必须是非空数组'
      });
    }

    // 验证并构造数据
    const feedbackDataList = feedbacks.map(item => {
      if (!item.user_email || !item.user_question) {
        throw new Error('每条反馈必须包含 user_email 和 user_question');
      }

      return {
        date: item.date || new Date().toISOString(),
        user_email: item.user_email,
        product: item.product || '未指定',
        channel: item.channel || 'Webhook',
        user_question: item.user_question,
        user_request: item.user_request || null,
        issue_type: '待分类',
        is_new_request: false,
        ai_processed: false,
        status: item.status || 'pending',
        created_at: new Date().toISOString()
      };
    });

    // 批量写入数据库
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackDataList)
      .select();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: `成功接收 ${data.length} 条反馈`,
      data: {
        count: data.length,
        ids: data.map(item => item.id)
      }
    });

  } catch (error) {
    console.error('批量 Webhook 接收失败:', error);
    res.status(500).json({
      success: false,
      message: '批量接收反馈失败',
      error: error.message
    });
  }
};
