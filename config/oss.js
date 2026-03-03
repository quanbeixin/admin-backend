const OSS = require('ali-oss');

/**
 * 创建 OSS 客户端
 */
function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION || 'oss-cn-beijing',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET || 'beixin-bgmanagent-bucket',
  });
}

/**
 * 上传文件到 OSS
 * @param {string} objectName - OSS 中的文件路径
 * @param {string|Buffer} localFile - 本地文件路径或 Buffer
 * @returns {Promise<string>} 返回文件的公网访问 URL
 */
async function uploadToOSS(objectName, localFile) {
  try {
    const client = createOSSClient();
    const result = await client.put(objectName, localFile);

    // 返回公网访问 URL
    return result.url;
  } catch (error) {
    console.error('OSS 上传失败:', error);
    throw error;
  }
}

/**
 * 上传 Buffer 到 OSS
 * @param {string} objectName - OSS 中的文件路径
 * @param {Buffer} buffer - 文件 Buffer
 * @returns {Promise<string>} 返回文件的公网访问 URL
 */
async function uploadBufferToOSS(objectName, buffer) {
  try {
    const client = createOSSClient();
    const result = await client.put(objectName, buffer);

    return result.url;
  } catch (error) {
    console.error('OSS Buffer 上传失败:', error);
    throw error;
  }
}

/**
 * 删除 OSS 文件
 * @param {string} objectName - OSS 中的文件路径
 */
async function deleteFromOSS(objectName) {
  try {
    const client = createOSSClient();
    await client.delete(objectName);
    console.log('OSS 文件删除成功:', objectName);
  } catch (error) {
    console.error('OSS 删除失败:', error);
    throw error;
  }
}

module.exports = {
  createOSSClient,
  uploadToOSS,
  uploadBufferToOSS,
  deleteFromOSS,
};
