# 项目文档汇总

> 本文档整合了项目中所有的功能模块文档,便于查阅和维护。
>
> 最后更新时间: 2026-03-17

---

## 目录

1. [字段可配置管理模块](#1-字段可配置管理模块)
2. [Meta 广告数据同步](#2-meta-广告数据同步)
3. [Facebook 广告账户管理](#3-facebook-广告账户管理)
4. [用户反馈自动分析系统](#4-用户反馈自动分析系统)
5. [飞书消息发送模块](#5-飞书消息发送模块)
6. [测试执行系统](#6-测试执行系统)
7. [DeepSeek API 配置](#7-deepseek-api-配置)

---

# 1. 字段可配置管理模块

## 1.1 概述

本模块提供了一套完整的字段可配置管理系统,支持动态表单配置。采用三层结构设计:

- **字段分组(Field Groups)**: 用于组织和分类字段
- **字段定义(Field Definitions)**: 定义具体的字段属性和类型
- **字段选项(Field Options)**: 为选择类字段提供可选项

## 1.2 数据表结构

### field_groups 表
```sql
CREATE TABLE field_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name VARCHAR(255) NOT NULL,
  group_code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### field_definitions 表
```sql
CREATE TABLE field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES field_groups(id),
  field_name VARCHAR(255) NOT NULL,
  field_code VARCHAR(100) NOT NULL UNIQUE,
  field_type VARCHAR(50) NOT NULL,
  remark TEXT,
  is_required BOOLEAN DEFAULT false,
  is_multiple BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  parent_id UUID,
  status BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### field_options 表
```sql
CREATE TABLE field_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_name VARCHAR(255) NOT NULL,
  option_value VARCHAR(255) NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 1.3 API 接口

### 字段分组管理

#### 获取分组列表
- **接口**: `GET /api/field-groups`
- **Query 参数**:
  - `page` (number, 可选): 页码,默认 1
  - `limit` (number, 可选): 每页数量,默认 20
  - `group_name` (string, 可选): 分组名称模糊搜索
  - `status` (boolean, 可选): 是否启用

#### 创建分组
- **接口**: `POST /api/field-groups`
- **Body 参数**:
```json
{
  "group_name": "广告基础信息",
  "group_code": "ad_basic",
  "description": "广告的基础配置字段",
  "status": true
}
```

#### 更新分组
- **接口**: `PUT /api/field-groups/:id`

#### 删除分组
- **接口**: `DELETE /api/field-groups/:id`
- **注意**: 如果分组下有字段定义,将无法删除

### 字段定义管理

#### 获取字段列表
- **接口**: `GET /api/field-definitions`
- **Query 参数**:
  - `page`, `limit`: 分页参数
  - `group_id`: 按分组筛选
  - `field_name`: 字段名称模糊搜索
  - `field_type`: 字段类型筛选
  - `is_required`: 是否必填
  - `status`: 是否启用

#### 创建字段
- **接口**: `POST /api/field-definitions`
- **Body 参数**:
```json
{
  "group_id": "uuid",
  "field_name": "广告平台",
  "field_code": "ad_platform",
  "field_type": "select",
  "remark": "选择广告投放平台",
  "is_required": true,
  "status": true,
  "sort_order": 1
}
```

**支持的字段类型**: text, textarea, number, select, radio, checkbox, date, datetime, switch

### 字段选项管理

#### 获取选项列表
- **接口**: `GET /api/field-options`
- **Query 参数**:
  - `field_name`: 按字段筛选
  - `is_active`: 是否启用

#### 批量创建/更新选项
- **接口**: `POST /api/field-options/batch`
- **Body 参数**:
```json
{
  "field_name": "ad_platform",
  "options": [
    {
      "option_value": "tiktok",
      "option_label": "抖音",
      "sort_order": 1
    },
    {
      "option_value": "kuaishou",
      "option_label": "快手",
      "sort_order": 2
    }
  ]
}
```

### 字段配置关联查询

#### 获取完整配置树
- **接口**: `GET /api/field-config/tree`
- **Query 参数**: `status` (boolean, 可选)
- **返回**: 完整的分组->字段->选项树形结构

#### 获取某分组下的字段
- **接口**: `GET /api/field-config/groups/:groupId/fields`

#### 获取某字段的所有选项
- **接口**: `GET /api/field-config/fields/:fieldCode/options`

## 1.4 使用示例

```javascript
// 获取完整的字段配置树
const response = await fetch('/api/field-config/tree?status=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data: fieldConfig } = await response.json();

// 渲染动态表单
fieldConfig.forEach(group => {
  console.log(`分组: ${group.group_name}`);
  group.fields.forEach(field => {
    console.log(`  字段: ${field.field_name} (${field.field_type})`);
    if (field.options) {
      field.options.forEach(option => {
        console.log(`    选项: ${option.option_label}`);
      });
    }
  });
});
```

## 1.5 注意事项

1. **删除限制**: 删除分组时,如果分组下有字段定义,将无法删除
2. **唯一性约束**: `group_code` 和 `field_code` 必须唯一
3. **字段选项**: 只有 select, radio, checkbox 类型的字段需要配置选项
4. **字段名称映射**: `field_definitions.field_code` ↔ `field_options.field_name`

---

# 2. Meta 广告数据同步

## 2.1 功能概述

本接口用于自动同步 Facebook/Meta 广告账户的 Insights 数据到数据库,支持:

- ✅ 批量同步多个广告账户
- ✅ 自动处理 Meta API 分页
- ✅ 数据去重(基于账户+广告+日期)
- ✅ 单个账户失败不影响其他账户
- ✅ 支持自定义同步天数
- ✅ 详细的同步日志和结果报告

## 2.2 前置条件

### 数据库表结构

#### companies(公司主体表)
```sql
CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### fb_ad_accounts(Facebook 广告账户表)
```sql
CREATE TABLE fb_ad_accounts (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id),
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### fb_ad_insights(广告数据表)
```sql
CREATE TABLE fb_ad_insights (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id),
  ad_account_id BIGINT REFERENCES fb_ad_accounts(id),
  date DATE NOT NULL,
  campaign_id VARCHAR(255),
  campaign_name VARCHAR(255),
  adset_id VARCHAR(255),
  adset_name VARCHAR(255),
  ad_id VARCHAR(255),
  ad_name VARCHAR(255),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend NUMERIC(12, 2) DEFAULT 0,
  cpm NUMERIC(12, 2) DEFAULT 0,
  cpc NUMERIC(12, 2) DEFAULT 0,
  ctr NUMERIC(12, 4) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ad_account_id, ad_id, date)
);

-- 创建索引提升查询性能
CREATE INDEX idx_fb_ad_insights_date ON fb_ad_insights(date);
CREATE INDEX idx_fb_ad_insights_account ON fb_ad_insights(ad_account_id);
CREATE INDEX idx_fb_ad_insights_company ON fb_ad_insights(company_id);
```

### 环境变量配置

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 服务器配置
PORT=3000
NODE_ENV=development
```

## 2.3 API 接口

### 同步 Insights 数据

**接口**: `POST /api/meta/sync-insights`

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| days | number | 否 | 3 | 同步最近 N 天的数据 |

**请求示例**:
```bash
# 同步最近 3 天数据(默认)
curl -X POST http://localhost:3000/api/meta/sync-insights \
  -H "Content-Type: application/json"

# 同步最近 7 天数据
curl -X POST http://localhost:3000/api/meta/sync-insights \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

**成功响应**:
```json
{
  "success": true,
  "message": "同步完成,共同步 1250 条数据",
  "totalSynced": 1250,
  "accounts": [
    {
      "accountId": "123456789",
      "accountName": "测试广告账户",
      "synced": 850,
      "error": null
    }
  ],
  "errors": []
}
```

## 2.4 使用流程

### 1. 准备广告账户数据

```sql
-- 1. 创建公司主体
INSERT INTO companies (name, code, status)
VALUES ('测试公司', 'TEST001', 'active');

-- 2. 添加广告账户(需要有效的 access_token)
INSERT INTO fb_ad_accounts (
  company_id,
  account_id,
  account_name,
  access_token,
  status
)
VALUES (
  1,
  '123456789',
  '测试广告账户',
  'EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'active'
);
```

### 2. 获取 Meta Access Token

访问 [Meta Business Suite](https://business.facebook.com/) 获取 Access Token:

1. 进入 Business Settings
2. 选择 System Users 或 Users
3. 生成 Access Token
4. 确保 Token 具有以下权限:
   - `ads_read`
   - `ads_management`
   - `business_management`

### 3. 调用同步接口

```javascript
import axios from 'axios';

async function syncMetaInsights(days = 3) {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/meta/sync-insights',
      { days }
    );
    console.log('同步结果:', response.data);
    return response.data;
  } catch (error) {
    console.error('同步失败:', error.response?.data || error.message);
    throw error;
  }
}
```

## 2.5 核心功能说明

### 自动分页处理
接口会自动处理 Meta API 的分页响应,跟随 `paging.next` 链接获取所有数据。

### 数据去重机制
使用 Supabase 的 `upsert` 功能,基于唯一约束 `(ad_account_id, ad_id, date)` 自动去重。

### 错误隔离
单个账户同步失败不会影响其他账户,所有错误都会被记录并返回。

## 2.6 常见问题

**Q: 为什么建议同步最近 3 天数据?**
A: Meta 广告数据可能会有延迟更新,同步最近 3 天可以确保获取到完整的数据并自动更新可能变化的指标。

**Q: Access Token 过期怎么办?**
A: 建议使用 System User Token(永久有效),或定期更新数据库中的 `access_token` 字段。

**Q: 如何设置定时同步?**
A: 使用 cron job 或任务调度器:
```bash
# Linux cron (每天凌晨 2 点同步)
0 2 * * * curl -X POST http://localhost:3000/api/meta/sync-insights
```

---

# 3. Facebook 广告账户管理

## 3.1 API 接口

### 基础信息
- **Base URL**: `/api/fb-ad-accounts`
- **认证方式**: JWT Token (Bearer Token)

### 获取所有账户
**接口**: `GET /api/fb-ad-accounts`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "access_token": "EAATfGj5H2DY...",
      "status": "active",
      "created_at": "2026-03-05T10:00:00.000Z",
      "updated_at": "2026-03-05T10:00:00.000Z"
    }
  ]
}
```

### 创建账户
**接口**: `POST /api/fb-ad-accounts`

**请求体**:
```json
{
  "access_token": "EAATfGj5H2DY...",
  "status": "active"
}
```

### 更新账户
**接口**: `PUT /api/fb-ad-accounts/:id`

### 删除账户
**接口**: `DELETE /api/fb-ad-accounts/:id`

## 3.2 前端调用示例

```javascript
import request from '../api/request';

// 获取所有账户
export const getAllAccounts = () => {
  return request.get('/fb-ad-accounts');
};

// 创建账户
export const createAccount = (data) => {
  return request.post('/fb-ad-accounts', data);
};

// 更新账户
export const updateAccount = (id, data) => {
  return request.put(`/fb-ad-accounts/${id}`, data);
};

// 删除账户
export const deleteAccount = (id) => {
  return request.delete(`/fb-ad-accounts/${id}`);
};
```

---

# 4. 用户反馈自动分析系统

## 4.1 功能说明

自动调用 AI API 分析用户反馈,生成:
- `ai_category`: Bug / 功能建议 / 投诉
- `ai_sentiment`: Positive / Neutral / Negative
- `ai_reply`: 简短礼貌的自动回复

## 4.2 配置步骤

### 1. 安装依赖
```bash
npm install @anthropic-ai/sdk
```

### 2. 配置 API Key
在 `.env` 文件中添加:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
# 或使用 DeepSeek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

## 4.3 API 接口

### 批量分析未处理的反馈
**接口**: `POST /api/feedback/analyze/unprocessed`

**请求参数**:
- `limit` (可选): 每次处理的最大数量,默认 10

**示例**:
```bash
curl -X POST "http://localhost:3000/api/feedback/analyze/unprocessed?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "message": "分析完成:成功 5 条,失败 0 条",
  "processed": 5,
  "failed": 0,
  "results": [
    {
      "id": 1,
      "status": "success",
      "analysis": {
        "ai_category": "Bug",
        "ai_sentiment": "Negative",
        "ai_reply": "感谢您的反馈,我们会尽快修复此问题。"
      }
    }
  ]
}
```

### 分析单条反馈
**接口**: `POST /api/feedback/:id/analyze`

## 4.4 工作流程

1. 查询未分析记录: 从 `feedback` 表查询 `ai_category` 为 `null` 的记录
2. 调用 AI API: 使用模型分析 `user_question`
3. 解析结果: 从响应中提取 JSON 格式的分析结果
4. 更新数据库: 将分析结果写回 `feedback` 表
5. 限流保护: 每次请求间隔 1 秒,避免触发 API 限流

## 4.5 定时任务示例

```javascript
const cron = require('node-cron');
const { analyzeUnprocessedFeedback } = require('./services/feedbackAnalysisService');

// 每小时执行一次
cron.schedule('0 * * * *', async () => {
  console.log('开始自动分析反馈...');
  try {
    const result = await analyzeUnprocessedFeedback(20);
    console.log('自动分析完成:', result.message);
  } catch (error) {
    console.error('自动分析失败:', error);
  }
});
```

---

# 5. 飞书消息发送模块

## 5.1 功能说明

支持通过飞书 API 发送消息到用户或群组,自动管理 access_token 缓存和刷新。

## 5.2 配置步骤

### 1. 配置环境变量
```env
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
```

### 2. 获取飞书应用凭证

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 App ID 和 App Secret
4. 开通权限:
   - `im:message`(发送消息)
   - `im:message:send_as_bot`(以应用身份发消息)

## 5.3 API 接口

### 测试连接
**接口**: `GET /api/feishu/test`

**响应**:
```json
{
  "success": true,
  "message": "飞书连接正常",
  "token": "t-g1044dg..."
}
```

### 发送文本消息
**接口**: `POST /api/feishu/send`

**请求体**:
```json
{
  "targetId": "ou_xxx",
  "type": "user",
  "content": "这是一条测试消息"
}
```

**参数说明**:
- `targetId`: 目标 ID (用户 open_id 或群组 chat_id)
- `type`: 类型,`user` 或 `group`
- `content`: 消息内容(文本)
- `msgType`: 消息类型(可选),默认 `text`

### 发送富文本消息
**接口**: `POST /api/feishu/send-rich`

### 发送卡片消息
**接口**: `POST /api/feishu/send-card`

## 5.4 使用示例

```javascript
const feishuService = require('./services/feishuService');

// 发送文本消息给用户
async function sendToUser() {
  const result = await feishuService.sendFeishuMessage(
    'ou_xxx',
    'user',
    '你好,这是一条测试消息'
  );

  if (result.success) {
    console.log('发送成功:', result.message_id);
  } else {
    console.error('发送失败:', result.error);
  }
}
```

## 5.5 常见问题

**Q: 发送失败: 99991663**
A: 机器人没有权限发送消息给该用户或群组。用户需要先添加机器人为好友,或将机器人加入群组。

**Q: 如何获取 open_id 和 chat_id?**
A:
- 用户 open_id: 通过飞书管理后台查看,或用户发送消息给机器人时从事件中获取
- 群组 chat_id: 将机器人加入群组后,在群组设置中查看群 ID

---

# 6. 测试执行系统

## 6.1 API 接口

### 触发测试执行
**接口**: `POST /api/test/run`

**请求体**:
```json
{
  "case_id": 1,
  "environment": "production",
  "username": "testuser",
  "password": "testpass123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "task_id": 123,
    "status": "running",
    "message": "测试任务已创建,正在执行中"
  }
}
```

### 查询测试任务结果
**接口**: `GET /api/test/task/:task_id`

**响应**:
```json
{
  "success": true,
  "data": {
    "task": {
      "id": 123,
      "case_id": 1,
      "case_name": "登录测试",
      "status": "success",
      "environment": "production",
      "start_time": "2026-03-02T10:00:00Z",
      "end_time": "2026-03-02T10:01:30Z",
      "report": {
        "total_steps": 5,
        "success_steps": 5,
        "failed_steps": 0
      }
    },
    "steps": [...]
  }
}
```

## 6.2 测试用例 steps 格式

```json
{
  "steps": [
    {
      "action": "goto",
      "value": "https://example.com/login"
    },
    {
      "action": "fill",
      "selector": "#username",
      "value": "{{username}}"
    },
    {
      "action": "click",
      "selector": "button[type='submit']"
    },
    {
      "action": "expect",
      "selector": ".welcome-message",
      "value": "欢迎"
    }
  ]
}
```

## 6.3 支持的操作类型

| 操作 | 说明 | 必需字段 |
|------|------|----------|
| `goto` | 导航到指定 URL | `value` (URL) |
| `click` | 点击元素 | `selector` |
| `fill` | 填充输入框 | `selector`, `value` |
| `waitForSelector` | 等待元素出现 | `selector` |
| `expect` | 断言元素存在或包含文本 | `selector`, `value` (可选) |
| `wait` | 等待指定毫秒数 | `value` (毫秒) |

## 6.4 变量替换

在步骤的 `value` 字段中可以使用以下变量:
- `{{username}}` - 替换为请求中的 username
- `{{password}}` - 替换为请求中的 password

## 6.5 截图功能

每个步骤执行后会自动截图,截图保存在 `uploads/screenshots/` 目录下:
- 成功步骤: `step_{order}_success_{timestamp}.png`
- 失败步骤: `step_{order}_error_{timestamp}.png`

## 6.6 任务状态

- `pending` - 待执行
- `running` - 执行中
- `success` - 执行成功
- `failed` - 执行失败

## 6.7 注意事项

1. 测试任务是异步执行的,调用 `/api/test/run` 后会立即返回 task_id
2. 需要轮询 `/api/test/task/:task_id` 来获取最新的执行状态
3. 如果某个步骤失败,后续步骤将不会执行
4. Playwright 在无头模式下运行,适合服务器环境

---

# 7. DeepSeek API 配置

## 7.1 获取 DeepSeek API Key

### 1. 注册账号
访问: https://platform.deepseek.com/

### 2. 获取 API Key
- 登录后进入控制台
- 点击「API Keys」
- 创建新的 API Key
- 复制 Key(格式: `sk-xxxxxxxxxxxxxxxx`)

### 3. 配置到项目
在 `.env` 文件中填入:
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

## 7.2 DeepSeek 优势

- **免费额度大**: 新用户有 500 万 tokens 免费额度
- **中文支持好**: 专门优化过中文理解
- **响应速度快**: 国内访问速度快
- **成本低**: 付费后也比 Claude 便宜很多

## 7.3 费用说明

- 免费额度: 500 万 tokens(约可分析 5000-10000 条反馈)
- 付费价格: ¥1/百万 tokens(输入)、¥2/百万 tokens(输出)
- 单条反馈分析成本: 约 ¥0.001-0.002

## 7.4 模型信息

当前使用模型: `deepseek-chat`
- 上下文长度: 64K tokens
- 支持中英文
- 适合对话、分析、分类等任务

## 7.5 注意事项

1. API Key 不要泄露或提交到 Git
2. 免费额度用完后需要充值才能继续使用
3. 建议设置用量告警,避免超支

---

## 附录: 统一响应格式

所有 API 接口都遵循统一的响应格式:

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 附录: 错误码说明

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

**文档维护**: 如有更新,请及时同步到本文档。
