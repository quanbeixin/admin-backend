const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken } = require('../middleware/auth');

// 以下接口需要 JWT 验证
// 获取所有部门
router.get('/', verifyToken, departmentController.getAllDepartments);

// 获取单个部门
router.get('/:id', verifyToken, departmentController.getDepartmentById);

// 创建部门
router.post('/create', verifyToken, departmentController.createDepartment);

// 更新部门
router.post('/update/:id', verifyToken, departmentController.updateDepartment);

// 删除部门
router.post('/delete/:id', verifyToken, departmentController.deleteDepartment);

module.exports = router;
