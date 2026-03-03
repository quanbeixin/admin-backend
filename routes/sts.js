const express = require('express');
const router = express.Router();
const stsController = require('../controllers/stsController');
const { verifyToken } = require('../middleware/auth');

// 获取OSS临时授权凭证
router.get('/sts-token', verifyToken, stsController.getSTSToken);

module.exports = router;
