const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// 获取图表可用字段/维度
router.get('/fields', verifyToken, dashboardController.getFields);

// 获取所有仪表盘
router.get('/', verifyToken, dashboardController.getAllDashboards);

// 获取单个仪表盘
router.get('/:id', verifyToken, dashboardController.getDashboardById);

// 创建仪表盘
router.post('/', verifyToken, dashboardController.createDashboard);

// 更新仪表盘
router.put('/:id', verifyToken, dashboardController.updateDashboard);

// 删除仪表盘
router.delete('/:id', verifyToken, dashboardController.deleteDashboard);

module.exports = router;
