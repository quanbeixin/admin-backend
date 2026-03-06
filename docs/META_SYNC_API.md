# Meta Insights 数据同步接口文档

## 功能概述

本接口用于自动同步 Facebook/Meta 广告账户的 Insights 数据到数据库，支持：

- ✅ 批量同步多个广告账户
- ✅ 自动处理 Meta API 分页
- ✅ 数据去重（基于账户+广告+日期）
- ✅ 单个账户失败不影响其他账户
- ✅ 支持自定义同步天数
- ✅ 详细的同步日志和结果报告

## 前置条件

### 1. 数据库表结构

确保数据库中已创建以下表：

#### companies（公司主体表）
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

#### fb_ad_accounts（Facebook 广告账户表）
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

#### fb_ad_insights（广告数据表）
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

### 2. 环境变量配置

在 `.env` 文件中配置：

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 3. 安装依赖

确保已安装以下 npm 包：

```bash
npm install @supabase/supabase-js axios express dotenv
```

## API 接口说明

### 接口地址

```
POST /api/meta/sync-insights
```

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| days | number | 否 | 3 | 同步最近 N 天的数据 |

### 请求示例

#### 1. 同步最近 3 天数据（默认）

```bash
curl -X POST http://localhost:3000/api/meta/sync-insights \
  -H "Content-Type: application/json"
```

#### 2. 同步最近 7 天数据

```bash
curl -X POST http://localhost:3000/api/meta/sync-insights \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

#### 3. 使用 JavaScript/Axios

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

// 调用
syncMetaInsights(7);
```

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "message": "同步完成，共同步 1250 条数据",
  "totalSynced": 1250,
  "accounts": [
    {
      "accountId": "123456789",
      "accountName": "测试广告账户",
      "synced": 850,
      "error": null
    },
    {
      "accountId": "987654321",
      "accountName": "生产广告账户",
      "synced": 400,
      "error": null
    }
  ],
  "errors": []
}
```

#### 部分失败响应

```json
{
  "success": true,
  "message": "同步完成，共同步 850 条数据",
  "totalSynced": 850,
  "accounts": [
    {
      "accountId": "123456789",
      "accountName": "测试广告账户",
      "synced": 850,
      "error": null
    },
    {
      "accountId": "987654321",
      "accountName": "失效账户",
      "synced": 0,
      "error": "Meta API 请求失败: Invalid OAuth access token"
    }
  ],
  "errors": [
    {
      "accountId": "987654321",
      "accountName": "失效账户",
      "error": "Meta API 请求失败: Invalid OAuth access token"
    }
  ]
}
```

#### 完全失败响应

```json
{
  "success": false,
  "message": "同步失败",
  "error": "获取广告账户失败: Database connection error"
}
```

## 使用流程

### 1. 准备广告账户数据

首先需要在��据库中添加 Facebook 广告账户信息：

```sql
-- 1. 创建公司主体
INSERT INTO companies (name, code, status)
VALUES ('测试公司', 'TEST001', 'active');

-- 2. 添加广告账户（需要有效的 access_token）
INSERT INTO fb_ad_accounts (
  company_id,
  account_id,
  account_name,
  access_token,
  status
)
VALUES (
  1,  -- 公司 ID
  '123456789',  -- Meta 广告账户 ID（不含 act_ 前缀）
  '测试广告账户',
  'EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  -- 有效的 Meta Access Token
  'active'
);
```

### 2. 获取 Meta Access Token

访问 [Meta Business Suite](https://business.facebook.com/) 获取 Access Token：

1. 进入 Business Settings
2. 选择 System Users 或 Users
3. 生成 Access Token
4. 确保 Token 具有以下权限：
   - `ads_read`
   - `ads_management`
   - `business_management`

### 3. 调用同步接口

```bash
# 方式 1: 使用 curl
curl -X POST http://localhost:3000/api/meta/sync-insights \
  -H "Content-Type: application/json" \
  -d '{"days": 3}'

# 方式 2: 使用 Postman
# POST http://localhost:3000/api/meta/sync-insights
# Body (JSON): {"days": 3}
```

### 4. 查看同步结果

```sql
-- 查看最新同步的数据
SELECT
  date,
  campaign_name,
  ad_name,
  impressions,
  clicks,
  spend,
  ctr
FROM fb_ad_insights
ORDER BY created_at DESC
LIMIT 10;

-- 按日期统计数据量
SELECT
  date,
  COUNT(*) as ad_count,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(spend) as total_spend
FROM fb_ad_insights
GROUP BY date
ORDER BY date DESC;
```

## 核心功能说明

### 1. 自动分页处理

接口会自动处理 Meta API 的分页响应：

```javascript
// 自动跟随 paging.next 链接
while (nextUrl) {
  const nextResponse = await axios.get(nextUrl);
  allInsights.push(...nextResponse.data.data);
  nextUrl = nextResponse.data.paging?.next;
}
```

### 2. 数据去重机制

使用 Supabase 的 `upsert` 功能，基于唯一约束自动去重：

```javascript
await supabase
  .from('fb_ad_insights')
  .upsert(insights, {
    onConflict: 'ad_account_id,ad_id,date',
    ignoreDuplicates: false  // 更新已存在的记录
  });
```

### 3. 数据类型转换

自动将 Meta API 返回的字符串转换为正确的数据类型：

```javascript
{
  impressions: parseInt(insight.impressions) || 0,
  clicks: parseInt(insight.clicks) || 0,
  spend: parseFloat(insight.spend) || 0,
  cpm: parseFloat(insight.cpm) || 0,
  cpc: parseFloat(insight.cpc) || 0,
  ctr: parseFloat(insight.ctr) || 0,
  reach: parseInt(insight.reach) || 0
}
```

### 4. 错误隔离

单个账户同步失败不会影响其他账户：

```javascript
for (const account of accounts) {
  try {
    // 同步单个账户
    await syncAccount(account);
  } catch (error) {
    // 记录错误，继续下一个账户
    results.errors.push({
      accountId: account.account_id,
      error: error.message
    });
  }
}
```

## 常见问题

### Q1: 为什么建议同步最近 3 天数据？

**A:** Meta 广告数据可能会有延迟更新，同步最近 3 天可以：
- 确保获取到完整的数据
- 自动更新可能变化的指标（如 reach、ctr）
- 避免遗漏新增的广告数据

### Q2: Access Token 过期怎么办？

**A:**
1. 使用长期 Token（60 天有效期）
2. 定期更新数据库中的 `access_token` 字段
3. 建议使用 System User Token（永久有效）

### Q3: 同步大量数据会超时吗？

**A:**
- 接口设置了 10000 条数据的保护上限
- 建议按天定时同步，避免一次性同步过多数据
- 可以通过 `days` 参数控制同步范围

### Q4: 如何设置定时同步？

**A:** 使用 cron job 或任��调度器：

```bash
# Linux cron (每天凌晨 2 点同步)
0 2 * * * curl -X POST http://localhost:3000/api/meta/sync-insights

# Node.js node-cron
const cron = require('node-cron');

cron.schedule('0 2 * * *', async () => {
  console.log('开始定时同步 Meta Insights...');
  await axios.post('http://localhost:3000/api/meta/sync-insights');
});
```

### Q5: 数据库唯一约束冲突怎么办？

**A:** 接口使用 `upsert` 自动处理：
- 如果数据已存在（相同 ad_account_id + ad_id + date），则更新
- 如果数据不存在，则插入新记录

## 性能优化建议

### 1. 数据库索引

```sql
-- 已创建的索引
CREATE INDEX idx_fb_ad_insights_date ON fb_ad_insights(date);
CREATE INDEX idx_fb_ad_insights_account ON fb_ad_insights(ad_account_id);
CREATE INDEX idx_fb_ad_insights_company ON fb_ad_insights(company_id);

-- 可选：复合索引
CREATE INDEX idx_fb_ad_insights_account_date
ON fb_ad_insights(ad_account_id, date DESC);
```

### 2. 批量处理

接口已实现批量 upsert，单次可处理数百条数据。

### 3. 并发控制

如需同时同步多个账户，可以修改服务层代码使用 `Promise.all()`：

```javascript
// 并发同步（谨慎使用，可能触发 Meta API 限流）
const syncPromises = accounts.map(account =>
  syncSingleAccount(account)
);
await Promise.all(syncPromises);
```

## 监控和日志

### 控制台日志

同步过程会输出详细日志：

```
开始同步 2 个广告账户，日期范围: 2026-03-03 ~ 2026-03-06
✓ 账户 测试广告账户 同步成功: 850 条
✗ 账户 失效账户 同步失败: Invalid OAuth access token
```

### 建议监控指标

1. **同步成功率**: `成功账户数 / 总账户数`
2. **数据量**: `totalSynced`
3. **错误率**: `errors.length / accounts.length`
4. **响应时间**: 接口执行时长

## 安全注意事项

1. **Access Token 保护**
   - 不要在日志中输出 Token
   - 使用环境变量存储敏感信息
   - 定期轮换 Token

2. **API 限流**
   - Meta API 有调用频率限制
   - 避免短时间内频繁调用
   - 建议每天同步 1-2 次

3. **数据权限**
   - 确保 Token 只有必要的权限
   - 使用 Supabase RLS（Row Level Security）保护数据

## 技术栈

- **后端框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **HTTP 客户端**: Axios
- **Meta API**: Graph API v21.0

## 文件结构

```
admin-backend/
├── services/
│   └── metaSync.js          # Meta API 同步服务
├── routes/
│   ├── meta.js              # Meta 相关路由
│   └── index.js             # 路由注册
├── config/
│   └── supabase.js          # Supabase 客户端配置
└── docs/
    └── META_SYNC_API.md     # 本文档
```

## 更新日志

- **2026-03-06**: 初始版本发布
  - 支持批量同步多个广告账户
  - 自动处理分页和数据去重
  - 错误隔离和详细日志

## 联系支持

如有问题或建议，请联系开发团队。
