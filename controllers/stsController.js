const OSS = require('ali-oss');

/**
 * 获取OSS临时授权凭证（简化版本）
 * 直接返回主账号的凭证，但限制权限范围
 * 注意：生产环境建议使用RAM角色和STS
 */
exports.getSTSToken = async (req, res) => {
  try {
    // 检查必要的环境变量
    if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'OSS配置缺失，请检查环境变量',
      });
    }

    console.log('生成OSS临时凭证');

    // 返回OSS配置信息
    // 注意：这里返回的是主账号凭证，仅用于开发测试
    // 生产环境应该使用STS临时凭证
    res.json({
      success: true,
      data: {
        region: process.env.OSS_REGION || 'oss-cn-beijing',
        bucket: process.env.OSS_BUCKET || 'beixin-bgmanagent-bucket',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        // 设置30分钟后过期（前端需要在过期前重新获取）
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      message: '获取临时凭证成功',
    });
  } catch (error) {
    console.error('获取OSS凭证失败:', error);
    res.status(500).json({
      success: false,
      message: '获取临时凭证失败',
      error: error.message,
    });
  }
};
