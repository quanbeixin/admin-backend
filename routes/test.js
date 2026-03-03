const express = require('express');
const router = express.Router();
const testExecutionController = require('../controllers/testExecutionController');
const { verifyToken } = require('../middleware/auth');

// 触发测试执行
router.post('/run', verifyToken, testExecutionController.runTest);

// 查询测试任务列表（分页 + 筛选）
router.get('/tasks', verifyToken, testExecutionController.getTaskList);

// 查询单个测试任务详情
router.get('/tasks/:id', verifyToken, testExecutionController.getTaskDetail);

// 查询测试任务结果（保留旧接口兼容性）
router.get('/task/:task_id', verifyToken, testExecutionController.getTaskResult);

module.exports = router;
