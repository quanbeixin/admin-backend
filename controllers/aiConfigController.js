const supabase = require('../config/supabase');
const { clearConfigCache } = require('../services/feedbackAnalysisService');

// 获取 AI Prompt 配置
exports.getPromptConfig = async (req, res) => {
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
      return res.json({
        success: true,
        data: {
          systemPrompt: '你是一位专业且富有同理心的客服专员，擅长理解用户情绪、分析问题本质，并给出温暖、专业的回复。',
          knowledgeBase: '',
          categories: '会员订阅-未激活,会员订阅-取消订阅,会员订阅-要求退款,功能反馈-无法生成,功能反馈-无法打开,数据安全,封禁申诉,删除账户,登录账户',
          replyStyle: '语气亲切自然，像朋友聊天一样。表达同理心，理解用户的困扰。避免"您好"、"感谢您的理解"等过于正式的套话。用简洁、口语化的表达。'
        }
      });
    }

    res.json({
      success: true,
      data: data.config_value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
};

// 更新 AI Prompt 配置
exports.updatePromptConfig = async (req, res) => {
  try {
    const configValue = req.body;

    // 检查是否已存在配置
    const { data: existingConfig } = await supabase
      .from('ai_config')
      .select('id')
      .eq('config_type', 'prompt')
      .single();

    let result;
    if (existingConfig) {
      // 更新现有配置
      result = await supabase
        .from('ai_config')
        .update({
          config_value: configValue,
          updated_at: new Date().toISOString()
        })
        .eq('config_type', 'prompt')
        .select()
        .single();
    } else {
      // 创建新配置
      result = await supabase
        .from('ai_config')
        .insert([{
          config_type: 'prompt',
          config_value: configValue
        }])
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // 清除配置缓存，使新配置立即生效
    clearConfigCache();

    res.json({
      success: true,
      message: '配置更新成功',
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新配置失败',
      error: error.message
    });
  }
};
