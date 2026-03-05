const express = require('express');
const router = express.Router();
const fieldDefinitionController = require('../controllers/fieldDefinitionController');
const { verifyToken } = require('../middleware/auth');

// 获取字段定义列表
router.get('/', verifyToken, fieldDefinitionController.getFieldDefinitions);

// 获取单个字段定义
router.get('/:id', verifyToken, fieldDefinitionController.getFieldDefinitionById);

// 创建字段定义
router.post('/', verifyToken, fieldDefinitionController.createFieldDefinition);

// 更新字段定义
router.put('/:id', verifyToken, fieldDefinitionController.updateFieldDefinition);

// 删除字段定义
router.delete('/:id', verifyToken, fieldDefinitionController.deleteFieldDefinition);

module.exports = router;