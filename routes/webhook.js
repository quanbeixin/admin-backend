const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Webhook 接口不需要 JWT 验证，但可以添加其他验证方式（如 API Key）

// 接收单条反馈
router.post('/feedback', webhookController.receiveFeedback);

// 批量接收反馈
router.post('/feedback/batch', webhookController.receiveFeedbackBatch);

module.exports = router;
