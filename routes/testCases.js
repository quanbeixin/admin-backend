const express = require('express');
const router = express.Router();
const testCaseController = require('../controllers/testCaseController');
const { verifyToken } = require('../middleware/auth');

// 获取测试用例列表（支持分页和筛选）
router.get('/', verifyToken, testCaseController.getTestCases);

// 获取单个测试用例
router.get('/:id', verifyToken, testCaseController.getTestCaseById);

// 创建测试用例
router.post('/', verifyToken, testCaseController.createTestCase);

// 更新测试用例
router.put('/:id', verifyToken, testCaseController.updateTestCase);

// 删除测试用例（软删除）
router.delete('/:id', verifyToken, testCaseController.deleteTestCase);

module.exports = router;
