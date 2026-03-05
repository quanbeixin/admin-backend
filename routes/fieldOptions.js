const express = require('express');
const router = express.Router();
const fieldOptionController = require('../controllers/fieldOptionController');
const { verifyToken } = require('../middleware/auth');

// 批量操作路由（放在前面，避免被 /:id 匹配）
router.post('/batch', verifyToken, fieldOptionController.batchUpsertFieldOptions);
router.post('/batch-delete', verifyToken, fieldOptionController.batchDeleteFieldOptions);

// 获取字段选项列表
router.get('/', verifyToken, fieldOptionController.getFieldOptions);

// 获取单个字段选项
router.get('/:id', verifyToken, fieldOptionController.getFieldOptionById);

// 创建字段选项
router.post('/', verifyToken, fieldOptionController.createFieldOption);

// 更新字段选项
router.put('/:id', verifyToken, fieldOptionController.updateFieldOption);

// 删除字段选项
router.delete('/:id', verifyToken, fieldOptionController.deleteFieldOption);

module.exports = router;