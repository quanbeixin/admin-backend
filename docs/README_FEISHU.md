# 飞书消息发送模块

## 功能说明

支持通过飞书 API 发送消息到用户或群组，自动管理 access_token 缓存和刷新。

## 配置步骤

### 1. 安装依赖

```bash
npm install axios
```

### 2. 配置环境变量

在 `.env` 文件中添加：

```env
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
```

### 3. 获取飞书应用凭证

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 App ID 和 App Secret
4. 开通权限：
   - `im:message`（发送消息）
   - `im:message:send_as_bot`（以应用身份发消息）

## API 接口

### 1. 测试连接

**接口**: `GET /api/feishu/test`

**请求头**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应**:
```json
{
  "success": true,
  "message": "飞书连接正常",
  "token": "t-g1044dg..."
}
```

### 2. 发送文本消息

**接口**: `POST /api/feishu/send`

**请求头**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**请求体**:
```json
{
  "targetId": "ou_xxx",
  "type": "user",
  "content": "这是一条测试消息"
}
```

**参数说明**:
- `targetId`: 目标 ID
  - 用户：open_id（如 `ou_xxx`）
  - 群组：chat_id（如 `oc_xxx`）
- `type`: 类型，`user` 或 `group`
- `content`: 消息内容（文本）
- `msgType`: 消息类型（可选），默认 `text`

**响应**:
```json
{
  "success": true,
  "message": "消息发送成功",
  "data": {
    "success": true,
    "message_id": "om_xxx"
  }
}
```

### 3. 发送富文本消息

**接口**: `POST /api/feishu/send-rich`

**请求体**:
```json
{
  "targetId": "ou_xxx",
  "type": "user",
  "content": {
    "zh_cn": {
      "title": "标题",
      "content": [
        [
          {
            "tag": "text",
            "text": "这是富文本消息"
          }
        ]
      ]
    }
  }
}
```

### 4. 发送卡片消息

**接口**: `POST /api/feishu/send-card`

**请求体**:
```json
{
  "targetId": "ou_xxx",
  "type": "user",
  "card": {
    "elements": [
      {
        "tag": "div",
        "text": {
          "content": "这是一张卡片",
          "tag": "lark_md"
        }
      }
    ],
    "header": {
      "title": {
        "content": "卡片标题",
        "tag": "plain_text"
      }
    }
  }
}
```

## 使用示例

### 在代码中直接调用

```javascript
const feishuService = require('./services/feishuService');

// 发送文本消息给用户
async function sendToUser() {
  const result = await feishuService.sendFeishuMessage(
    'ou_xxx',      // 用户的 open_id
    'user',        // 类型
    '你好，这是一条测试消息'
  );

  if (result.success) {
    console.log('发送成功:', result.message_id);
  } else {
    console.error('发送失败:', result.error);
  }
}

// 发送消息到群组
async function sendToGroup() {
  const result = await feishuService.sendFeishuMessage(
    'oc_xxx',      // 群组的 chat_id
    'group',       // 类型
    '群组消息测试'
  );

  console.log(result);
}
```

### 通过 API 调用

```bash
# 测试连接
curl -X GET "http://localhost:3000/api/feishu/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 发送消息给用户
curl -X POST "http://localhost:3000/api/feishu/send" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "ou_xxx",
    "type": "user",
    "content": "测试消息"
  }'

# 发送消息到群组
curl -X POST "http://localhost:3000/api/feishu/send" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "oc_xxx",
    "type": "group",
    "content": "群组测试消息"
  }'
```

## 获取 open_id 和 chat_id

### 获取用户 open_id

1. 方法一：通过飞书管理后台查看
2. 方法二：用户发送消息给机器人时，从事件中获取
3. 方法三：通过手机号或邮箱查询

### 获取群组 chat_id

1. 将机器人加入群组
2. 在群组设置中查看群 ID
3. 或通过 API 获取机器人所在的群列表

## 文件结构

```
admin-backend/
├── services/
│   └── feishuService.js       # 飞书服务核心逻辑
├── controllers/
│   └── feishuController.js    # 飞书消息控制器
├── routes/
│   └── feishu.js              # 飞书路由
└── .env                       # 配置文件
```

## 注意事项

1. **权限配置**：确保飞书应用已开通消息发送权限
2. **Token 缓存**：access_token 会自动缓存，有效期约 2 小时
3. **错误处理**：所有接口都有完整的错误处理和日志记录
4. **安全性**：所有接口都需要 JWT 认证
5. **频率限制**：注意飞书 API 的调用频率限制

## 常见问题

### 1. 发送失败：99991663

原因：机器人没有权限发送消息给该用户或群组

解决：
- 用户需要先添加机器人为好友
- 或将机器人加入群组

### 2. 发送失败：99991401

原因：access_token 无效

解决：检查 App ID 和 App Secret 是否正确

### 3. 如何发送图片、文件等

修改 `msgType` 参数，并提供对应格式的 content。参考[飞书消息类型文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/im-v1/message/create_json)。
