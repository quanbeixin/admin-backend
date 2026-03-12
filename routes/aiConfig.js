const express = require('express');
const router = express.Router();
const aiConfigController = require('../controllers/aiConfigController');
const { verifyToken } = require('../middleware/auth');

// 获取 AI Prompt 配置
router.get('/prompt', verifyToken, aiConfigController.getPromptConfig);

// 更新 AI Prompt 配置
router.put('/prompt', verifyToken, aiConfigController.updatePromptConfig);

module.exports = router;
