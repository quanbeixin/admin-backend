const express = require('express');
const router = express.Router();
const fieldConfigController = require('../controllers/fieldConfigController');
const fieldDefinitionController = require('../controllers/fieldDefinitionController');
const fieldOptionController = require('../controllers/fieldOptionController');
const { verifyToken } = require('../middleware/auth');

// 获取完整的字段配置树
router.get('/tree', verifyToken, fieldConfigController.getFieldConfigTree);

// 获取某分组下的字段定义
router.get('/groups/:groupId/fields', verifyToken, fieldDefinitionController.getFieldsByGroupId);

// 获取某字段的所有选项（通过 field_code）
router.get('/fields/:fieldCode/options', verifyToken, fieldOptionController.getOptionsByFieldCode);

module.exports = router;