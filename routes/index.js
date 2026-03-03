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
const optionFieldRoutes = require('./optionFields');
const testCaseRoutes = require('./testCases');
const testRoutes = require('./test');

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

// 选型字段相关路由
router.use('/option-fields', optionFieldRoutes);

// 测试用例相关路由
router.use('/test-cases', testCaseRoutes);

// 测试执行相关路由
router.use('/test', testRoutes);

module.exports = router;
