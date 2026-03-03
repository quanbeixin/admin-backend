const express = require('express');
const router = express.Router();
const adCreativeController = require('../controllers/adCreativeController');
const { verifyToken } = require('../middleware/auth');

// 获取广告创意列表（支持分页和筛选）
router.get('/', verifyToken, adCreativeController.getAdCreatives);

// 获取单个广告创意
router.get('/:id', verifyToken, adCreativeController.getAdCreativeById);

// 创建广告创意
router.post('/', verifyToken, adCreativeController.createAdCreative);

// 更新广告创意
router.put('/:id', verifyToken, adCreativeController.updateAdCreative);

// 删除广告创意（软删除）
router.delete('/:id', verifyToken, adCreativeController.deleteAdCreative);

// 批量删除广告创意
router.post('/batch-delete', verifyToken, adCreativeController.batchDeleteAdCreatives);

module.exports = router;
