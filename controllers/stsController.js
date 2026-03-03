const STS = require('ali-oss').STS;

/**
 * 获取OSS临时授权凭证
 * 用于前端直接上传文件到OSS
 */
exports.getSTSToken = async (req, res) => {
  try {
    const sts = new STS({
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    });

    // 定义授权策略
    const policy = {
      Statement: [
        {
          Action: ['oss:PutObject', 'oss:GetObject'],
          Effect: 'Allow',
          Resource: [`acs:oss:*:*:${process.env.OSS_BUCKET || 'beixin-bgmanagent-bucket'}/uploads/*`],
        },
      ],
      Version: '1',
    };

    // 获取临时凭证，有效期30分钟
    const result = await sts.assumeRole(
      process.env.OSS_ROLE_ARN, // 需要在环境变量中配置RAM角色ARN
      policy,
      30 * 60, // 30分钟
      'client-upload-session'
    );

    console.log('STS临时凭证生成成功');

    res.json({
      success: true,
      data: {
        region: process.env.OSS_REGION || 'oss-cn-beijing',
        bucket: process.env.OSS_BUCKET || 'beixin-bgmanagent-bucket',
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        stsToken: result.credentials.SecurityToken,
        expiration: result.credentials.Expiration,
      },
      message: '获取临时凭证成功',
    });
  } catch (error) {
    console.error('获取STS凭证失败:', error);
    res.status(500).json({
      success: false,
      message: '获取临时凭证失败',
      error: error.message,
    });
  }
};
