const path = require('path');
const fs = require('fs');
const { uploadToOSS } = require('../config/oss');

// 注意：在Vercel Serverless环境中，不需要创建本地目录
// multer会使用/tmp目录存储临时文件

// 文件上传处理
exports.uploadFile = async (req, res) => {
  try {
    console.log('收到文件上传请求');
    console.log('req.file:', req.file);

    if (!req.file) {
      console.log('错误: 没有上传文件');
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    console.log('开始上传到OSS...');
    console.log('文件路径:', req.file.path);
    console.log('原始文件名:', req.file.originalname);

    // 上传到 OSS
    const ossPath = `uploads/${Date.now()}_${req.file.originalname}`;
    console.log('OSS路径:', ossPath);

    const ossUrl = await uploadToOSS(ossPath, req.file.path);
    console.log('OSS上传成功，URL:', ossUrl);

    // 删除本地临时文件
    try {
      fs.unlinkSync(req.file.path);
      console.log('临时文件已删除');
    } catch (err) {
      console.warn('删除临时文件失败:', err.message);
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: ossUrl
      },
      message: '上传成功'
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 批量上传
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const ossPath = `uploads/${Date.now()}_${file.originalname}`;
      const ossUrl = await uploadToOSS(ossPath, file.path);

      // 删除本地临时文件
      fs.unlinkSync(file.path);

      return {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: ossUrl
      };
    });

    const files = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: files,
      message: `成功上传 ${files.length} 个文件`
    });
  } catch (error) {
    console.error('批量上传错误:', error);
    res.status(500).json({
      success: false,
      message: '批量上传失败',
      error: error.message
    });
  }
};

module.exports = exports;
