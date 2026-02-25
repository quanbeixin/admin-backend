const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// 用户登录（不需要 token）
router.post('/login', userController.login);

// 用户注册（不需要 token）
router.post('/register', userController.register);

// 以下接口需要 JWT 验证
// 获取所有用户
router.get('/', verifyToken, userController.getAllUsers);

// 获取单个用户
router.get('/:id', verifyToken, userController.getUserById);

// 创建用户
router.post('/createUser', verifyToken, userController.createUser);

// 更新用户
router.post('/update/:id', verifyToken, userController.updateUser);

// 删除用户
router.post('/delete/:id', verifyToken, userController.deleteUser);

module.exports = router;
