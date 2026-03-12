const express = require('express');
const router = express.Router();
const feishuController = require('../controllers/feishuController');
const { verifyToken } = require('../middleware/auth');

// 测试连接（需要认证）
router.get('/test', verifyToken, feishuController.testConnection);

// 发送文本消息（需要认证）
router.post('/send', verifyToken, feishuController.sendMessage);

// 发送富文本消息（需要认证）
router.post('/send-rich', verifyToken, feishuController.sendRichText);

// 发送卡片消息（需要认证）
router.post('/send-card', verifyToken, feishuController.sendCard);

module.exports = router;
