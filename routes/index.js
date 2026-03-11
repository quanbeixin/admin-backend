const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const userRoutes = require('./users');
const taskRoutes = require('./tasks');
const departmentRoutes = require('./departments');
const dashboardRoutes = require('./dashboards');
const adReportRoutes = require('./adReports');
const adCreativeRoutes = require('./adCreatives');
const uploadRoutes = require('./upload');
const testCaseRoutes = require('./testCases');
const testRoutes = require('./test');
const stsRoutes = require('./sts');
const fieldGroupRoutes = require('./fieldGroups');
const fieldDefinitionRoutes = require('./fieldDefinitions');
const fieldOptionRoutes = require('./fieldOptions');
const fieldConfigRoutes = require('./fieldConfig');
const fbAdAccountRoutes = require('./fbAdAccounts');
const companyRoutes = require('./companies');
const metaRoutes = require('./meta');
const fbAdInsightsRoutes = require('./fbAdInsights');
const trendsRoutes = require('./trends');
const feedbackRoutes = require('./feedback');
const webhookRoutes = require('./webhook');

// 健康检查
router.get('/health', apiController.healthCheck);

// API 欢迎信息
// router.get('/api', apiController.welcome);

// 数据库连接测试
router.get('/db-test', apiController.dbTest);

// 用户相关路由
router.use('/users', userRoutes);

// 任务相关路由
router.use('/tasks', taskRoutes);

// 部门相关路由
router.use('/departments', departmentRoutes);

// 仪表盘相关路由
router.use('/dashboards', dashboardRoutes);

// 广告数据相关路由
router.use('/ad-reports', adReportRoutes);

// 广告创意相关路由
router.use('/ad-creatives', adCreativeRoutes);

// 文件上传相关路由
router.use('/upload', uploadRoutes);

// OSS STS临时授权路由
router.use('/oss', stsRoutes);

// 测试用例相关路由
router.use('/test-cases', testCaseRoutes);

// 测试执行相关路由
router.use('/test', testRoutes);

// 字段分组相关路由
router.use('/field-groups', fieldGroupRoutes);

// 字段定义相关路由
router.use('/field-definitions', fieldDefinitionRoutes);

// 字段选项相关路由
router.use('/field-options', fieldOptionRoutes);

// 字段配置相关路由（树形结构、关联查询等）
router.use('/field-config', fieldConfigRoutes);

// Facebook 广告账户相关路由
router.use('/fb-ad-accounts', fbAdAccountRoutes);

// 公司主体相关路由
router.use('/companies', companyRoutes);

// Meta 广告数据同步相关路由
router.use('/meta', metaRoutes);

// Facebook 广告投放数据相关路由
router.use('/fb-ad-insights', fbAdInsightsRoutes);

// 热门趋势相关路由
router.use('/trends', trendsRoutes);

// 用户反馈相关路由
router.use('/feedback', feedbackRoutes);

// Webhook 相关路由（无需认证）
router.use('/webhook', webhookRoutes);

module.exports = router;
