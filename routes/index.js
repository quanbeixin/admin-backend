const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const userRoutes = require('./users');
const taskRoutes = require('./tasks');
const departmentRoutes = require('./departments');

// 健康检查
router.get('/health', apiController.healthCheck);

// API 欢迎信息
router.get('/api', apiController.welcome);

// 数据库连接测试
router.get('/api/db-test', apiController.dbTest);

// 用户相关路由
router.use('/api/users', userRoutes);

// 任务相关路由
router.use('/api/tasks', taskRoutes);

// 部门相关路由
router.use('/api/departments', departmentRoutes);

module.exports = router;
