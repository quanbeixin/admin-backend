const axios = require('axios');

/**
 * 飞书消息发送服务
 * 支持发送消息给用户或群组，自动管理 access_token
 */
class FeishuService {
  constructor() {
    this.appId = process.env.FEISHU_APP_ID;
    this.appSecret = process.env.FEISHU_APP_SECRET;
    this.accessToken = null;
    this.tokenExpireTime = 0;
    this.baseURL = 'https://open.feishu.cn/open-apis';
  }

  /**
   * 获取 access_token（带缓存和自动刷新）
   */
  async getAccessToken() {
    // 如果 token 还有效，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/auth/v3/tenant_access_token/internal`,
        {
          app_id: this.appId,
          app_secret: this.appSecret
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`获取 access_token 失败: ${response.data.msg}`);
      }

      this.accessToken = response.data.tenant_access_token;
      // 提前 5 分钟刷新（token 有效期通常是 2 小时）
      this.tokenExpireTime = Date.now() + (response.data.expire - 300) * 1000;

      console.log('飞书 access_token 获取成功');
      return this.accessToken;

    } catch (error) {
      console.error('获取飞书 access_token 失败:', error.message);
      throw new Error('获取飞书 access_token 失败: ' + error.message);
    }
  }

  /**
   * 发送消息到飞书
   * @param {string} targetId - 目标 ID（open_id 或 chat_id）
   * @param {string} type - 类型：'user' 或 'group'
   * @param {string} content - 消息内容（文本）
   * @param {string} msgType - 消息类型：'text', 'post', 'image' 等，默认 'text'
   */
  async sendFeishuMessage(targetId, type, content, msgType = 'text') {
    try {
      // 验证参数
      if (!targetId) {
        throw new Error('targetId 不能为空');
      }
      if (!['user', 'group'].includes(type)) {
        throw new Error('type 必须是 "user" 或 "group"');
      }
      if (!content) {
        throw new Error('content 不能为空');
      }

      // 获取 access_token
      const token = await this.getAccessToken();

      // 构造消息体
      const messageBody = {
        msg_type: msgType,
        content: JSON.stringify({
          text: content
        })
      };

      // 根据类型设置接收者
      if (type === 'user') {
        messageBody.receive_id = targetId;
      } else {
        messageBody.receive_id = targetId;
      }

      // 发送消息
      const response = await axios.post(
        `${this.baseURL}/im/v1/messages`,
        messageBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            receive_id_type: type === 'user' ? 'open_id' : 'chat_id'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`发送消息失败: ${response.data.msg}`);
      }

      console.log('飞书消息发送成功:', response.data.data.message_id);
      return {
        success: true,
        message_id: response.data.data.message_id,
        data: response.data.data
      };

    } catch (error) {
      console.error('发送飞书消息失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发送富文本消息
   * @param {string} targetId - 目标 ID
   * @param {string} type - 类型：'user' 或 'group'
   * @param {object} content - 富文本内容对象
   */
  async sendRichTextMessage(targetId, type, content) {
    try {
      const token = await this.getAccessToken();

      const messageBody = {
        receive_id: targetId,
        msg_type: 'post',
        content: JSON.stringify(content)
      };

      const response = await axios.post(
        `${this.baseURL}/im/v1/messages`,
        messageBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            receive_id_type: type === 'user' ? 'open_id' : 'chat_id'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`发送富文本消息失败: ${response.data.msg}`);
      }

      return {
        success: true,
        message_id: response.data.data.message_id,
        data: response.data.data
      };

    } catch (error) {
      console.error('发送飞书富文本消息失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发送卡片消息
   * @param {string} targetId - 目标 ID
   * @param {string} type - 类型：'user' 或 'group'
   * @param {object} card - 卡片内容对象
   */
  async sendCardMessage(targetId, type, card) {
    try {
      const token = await this.getAccessToken();

      const messageBody = {
        receive_id: targetId,
        msg_type: 'interactive',
        content: JSON.stringify(card)
      };

      const response = await axios.post(
        `${this.baseURL}/im/v1/messages`,
        messageBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            receive_id_type: type === 'user' ? 'open_id' : 'chat_id'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`发送卡片消息失败: ${response.data.msg}`);
      }

      return {
        success: true,
        message_id: response.data.data.message_id,
        data: response.data.data
      };

    } catch (error) {
      console.error('发送飞书卡片消息失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 导出单例
module.exports = new FeishuService();
