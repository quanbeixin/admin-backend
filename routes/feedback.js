const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken } = require('../middleware/auth');

// 所有反馈接口都需要 JWT 验证
// 获取所有反馈
router.get('/', verifyToken, feedbackController.getAllFeedback);

// 获取单个反馈
router.get('/:id', verifyToken, feedbackController.getFeedbackById);

// 创建反馈
router.post('/', verifyToken, feedbackController.createFeedback);

// 更新反馈
router.put('/:id', verifyToken, feedbackController.updateFeedback);

// 删除反馈
router.delete('/:id', verifyToken, feedbackController.deleteFeedback);

// 更新反馈状态
router.patch('/:id/status', verifyToken, feedbackController.updateFeedbackStatus);

// 批量更新状态
router.post('/batch/status', verifyToken, feedbackController.batchUpdateStatus);

// 批量导入反馈
router.post('/batch/import', verifyToken, feedbackController.batchImport);

// AI 分析未处理的反馈
router.post('/analyze/unprocessed', verifyToken, feedbackController.analyzeUnprocessed);

// AI 分析单条反馈
router.post('/:id/analyze', verifyToken, feedbackController.analyzeSingle);

module.exports = router;
