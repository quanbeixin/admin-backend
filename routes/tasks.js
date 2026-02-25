const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/auth');

// 以下接口需要 JWT 验证
// 获取所有任务
router.get('/', verifyToken, taskController.getAllTasks);

// 获取当前用户的任务
router.get('/my', verifyToken, taskController.getMyTasks);

// 获取单个任务
router.get('/:id', verifyToken, taskController.getTaskById);

// 创建任务
router.post('/create', verifyToken, taskController.createTask);

// 更新任务
router.post('/update/:id', verifyToken, taskController.updateTask);

// 删除任务
router.post('/delete/:id', verifyToken, taskController.deleteTask);

module.exports = router;
