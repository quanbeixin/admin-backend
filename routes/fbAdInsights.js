const express = require('express');
const router = express.Router();
const fbAdInsightsController = require('../controllers/fbAdInsightsController');
const { verifyToken } = require('../middleware/auth');

// 获取 Facebook 广告投放数据（支持筛选和分页）
router.get('/', verifyToken, fbAdInsightsController.getFbAdInsights);

// 获取 Facebook 广告数据统计汇总
router.get('/stats', verifyToken, fbAdInsightsController.getFbAdInsightsStats);

// 获取筛选维度的可选值列表
router.get('/filters', verifyToken, fbAdInsightsController.getFbAdInsightsFilters);

// 获取广告系列列表
router.get('/campaigns', verifyToken, fbAdInsightsController.getCampaigns);

module.exports = router;
