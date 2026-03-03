const path = require('path');
const fs = require('fs');
const { uploadToOSS } = require('../config/oss');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 文件上传处理
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    // 上传到 OSS
    const ossPath = `uploads/${Date.now()}_${req.file.originalname}`;
    const ossUrl = await uploadToOSS(ossPath, req.file.path);

    // 删除本地临时文件
    fs.unlinkSync(req.file.path);

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
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
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
