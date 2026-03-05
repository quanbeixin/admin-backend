const express = require('express');
const router = express.Router();
const fbAdAccountController = require('../controllers/fbAdAccountController');
const { verifyToken } = require('../middleware/auth');

// 所有接口都需要 JWT 验证
// 获取所有账户
router.get('/', verifyToken, fbAdAccountController.getAllAccounts);

// 获取单个账户
router.get('/:id', verifyToken, fbAdAccountController.getAccountById);

// 创建账户
router.post('/', verifyToken, fbAdAccountController.createAccount);

// 更新账户
router.put('/:id', verifyToken, fbAdAccountController.updateAccount);

// 删除账户
router.delete('/:id', verifyToken, fbAdAccountController.deleteAccount);

module.exports = router;
