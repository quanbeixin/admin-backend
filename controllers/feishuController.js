const feishuService = require('../services/feishuService');

/**
 * 发送飞书消息
 * POST /api/feishu/send
 */
exports.sendMessage = async (req, res) => {
  try {
    const { targetId, type, content, msgType } = req.body;

    // 验证必需字段
    if (!targetId || !type || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段：targetId, type, content'
      });
    }

    // 发送消息
    const result = await feishuService.sendFeishuMessage(
      targetId,
      type,
      content,
      msgType
    );

    if (result.success) {
      res.json({
        success: true,
        message: '消息发送成功',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: '消息发送失败',
        error: result.error
      });
    }

  } catch (error) {
    console.error('发送飞书消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败',
      error: error.message
    });
  }
};

/**
 * 发送富文本消息
 * POST /api/feishu/send-rich
 */
exports.sendRichText = async (req, res) => {
  try {
    const { targetId, type, content } = req.body;

    if (!targetId || !type || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段：targetId, type, content'
      });
    }

    const result = await feishuService.sendRichTextMessage(
      targetId,
      type,
      content
    );

    if (result.success) {
      res.json({
        success: true,
        message: '富文本消息发送成功',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: '富文本消息发送失败',
        error: result.error
      });
    }

  } catch (error) {
    console.error('发送飞书富文本消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送富文本消息失败',
      error: error.message
    });
  }
};

/**
 * 发送卡片消息
 * POST /api/feishu/send-card
 */
exports.sendCard = async (req, res) => {
  try {
    const { targetId, type, card } = req.body;

    if (!targetId || !type || !card) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段：targetId, type, card'
      });
    }

    const result = await feishuService.sendCardMessage(
      targetId,
      type,
      card
    );

    if (result.success) {
      res.json({
        success: true,
        message: '卡片消息发送成功',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: '卡片消息发送失败',
        error: result.error
      });
    }

  } catch (error) {
    console.error('发送飞书卡片消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送卡片消息失败',
      error: error.message
    });
  }
};

/**
 * 测试飞书连接
 * GET /api/feishu/test
 */
exports.testConnection = async (req, res) => {
  try {
    const token = await feishuService.getAccessToken();
    res.json({
      success: true,
      message: '飞书连接正常',
      token: token.substring(0, 10) + '...'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '飞书连接失败',
      error: error.message
    });
  }
};
