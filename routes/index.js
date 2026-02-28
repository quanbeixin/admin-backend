const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const userRoutes = require('./users');
const taskRoutes = require('./tasks');
const departmentRoutes = require('./departments');
const dashboardRoutes = require('./dashboards');

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
router.use('/api/dashboards', dashboardRoutes);

module.exports = router;
