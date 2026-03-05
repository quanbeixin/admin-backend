const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken } = require('../middleware/auth');

// 所有接口都需要 JWT 验证
// 获取所有公司
router.get('/', verifyToken, companyController.getAllCompanies);

// 获取单个公司
router.get('/:id', verifyToken, companyController.getCompanyById);

// 创建公司
router.post('/', verifyToken, companyController.createCompany);

// 更新公司
router.put('/:id', verifyToken, companyController.updateCompany);

// 删除公司
router.delete('/:id', verifyToken, companyController.deleteCompany);

module.exports = router;
