const express = require('express');
const router = express.Router();
const optionFieldController = require('../controllers/optionFieldController');
const { verifyToken } = require('../middleware/auth');

// 获取字段名列表
router.get('/field-names', verifyToken, optionFieldController.getFieldNames);

// 获取树形结构数据
router.get('/tree', verifyToken, optionFieldController.getOptionFieldsTree);

// 获取选型字段列表（支持分页和筛选）
router.get('/', verifyToken, optionFieldController.getOptionFields);

// 获取单个选型字段
router.get('/:id', verifyToken, optionFieldController.getOptionFieldById);

// 创建选型字段
router.post('/', verifyToken, optionFieldController.createOptionField);

// 更新选型字段
router.put('/:id', verifyToken, optionFieldController.updateOptionField);

// 删除选型字段
router.delete('/:id', verifyToken, optionFieldController.deleteOptionField);

// 批量删除选型字段
router.post('/batch-delete', verifyToken, optionFieldController.batchDeleteOptionFields);

module.exports = router;
