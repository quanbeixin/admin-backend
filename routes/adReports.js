const express = require('express');
const router = express.Router();
const adReportController = require('../controllers/adReportController');
const { verifyToken } = require('../middleware/auth');

// 获取广告数据
router.get('/', verifyToken, adReportController.getAdReports);

// 获取广告数据统计
router.get('/stats', verifyToken, adReportController.getAdReportsStats);

// 获取广告活动列表
router.get('/campaigns', verifyToken, adReportController.getCampaigns);

module.exports = router;
