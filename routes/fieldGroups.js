const express = require('express');
const router = express.Router();
const fieldGroupController = require('../controllers/fieldGroupController');
const { verifyToken } = require('../middleware/auth');

// 获取字段分组列表
router.get('/', verifyToken, fieldGroupController.getFieldGroups);

// 获取单个字段分组
router.get('/:id', verifyToken, fieldGroupController.getFieldGroupById);

// 创建字段分组
router.post('/', verifyToken, fieldGroupController.createFieldGroup);

// 更新字段分组
router.put('/:id', verifyToken, fieldGroupController.updateFieldGroup);

// 删除字段分组
router.delete('/:id', verifyToken, fieldGroupController.deleteFieldGroup);

module.exports = router;