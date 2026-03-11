# 用户反馈自动分析系统

## 功能说明

自动调用 Claude API 分析用户反馈，生成：
- `ai_category`: Bug / 功能建议 / 投诉
- `ai_sentiment`: Positive / Neutral / Negative
- `ai_reply`: 简短礼貌的自动回复

## 配置步骤

### 1. 安装依赖

```bash
npm install @anthropic-ai/sdk
```

### 2. 配置 API Key

在 `.env` 文件中添加：

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

将 `your_anthropic_api_key_here` 替换为你的真实 Anthropic API Key。

### 3. 启动服务

```bash
npm run dev
```

## API 接口

### 1. 批量分析未处理的反馈

**接口**: `POST /api/feedback/analyze/unprocessed`

**请求参数**:
- `limit` (可选): 每次处理的最大数量，默认 10

**示例**:
```bash
curl -X POST "http://localhost:3000/api/feedback/analyze/unprocessed?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "message": "分析完成：成功 5 条，失败 0 条",
  "processed": 5,
  "failed": 0,
  "results": [
    {
      "id": 1,
      "status": "success",
      "analysis": {
        "ai_category": "Bug",
        "ai_sentiment": "Negative",
        "ai_reply": "感谢您的反馈，我们会尽快修复此问题。"
      }
    }
  ]
}
```

### 2. 分析单条反馈

**接口**: `POST /api/feedback/:id/analyze`

**示例**:
```bash
curl -X POST "http://localhost:3000/api/feedback/123/analyze" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "message": "分析完成",
  "data": {
    "ai_category": "功能建议",
    "ai_sentiment": "Positive",
    "ai_reply": "感谢您的建议，我们会认真考虑。"
  }
}
```

## 工作流程

1. **查询未分析记录**: 从 `feedback` 表查询 `ai_category` 为 `null` 的记录
2. **调用 Claude API**: 使用 `claude-3-5-sonnet-20241022` 模型分析 `user_question`
3. **解析结果**: 从 Claude 响应中提取 JSON 格式的分析结果
4. **更新数据库**: 将分析结果写回 `feedback` 表
5. **限流保护**: 每次请求间隔 1 秒，避免触发 API 限流

## 文件结构

```
admin-backend/
├── services/
│   └── feedbackAnalysisService.js  # 核心分析逻辑
├── controllers/
│   └── feedbackController.js       # 新增 AI 分析接口
├── routes/
│   └── feedback.js                 # 新增路由
└── .env                            # 配置 API Key
```

## 注意事项

1. **API Key 安全**:
   - 绝对不要把 `ANTHROPIC_API_KEY` 提交到 Git
   - 已在 `.gitignore` 中排除 `.env` 文件

2. **成本控制**:
   - 每次分析约消耗 500-1000 tokens
   - 建议设置 `limit` 参数控制批量处理数量
   - 可以配合定时任务（cron）定期处理

3. **错误处理**:
   - 单条失败不影响其他记录
   - 失败记录会在 `results` 中标记 `status: 'failed'`
   - 可以重新调用接口处理失败的记录

4. **模型选择**:
   - 当前使用 `claude-3-5-sonnet-20241022`
   - 可根据需要调整为 `claude-3-haiku` 降低成本
   - 或使用 `claude-3-opus` 提升准确度

## 前端集成建议

在前端 `FeedbackList.jsx` 中添加"AI 分析"按钮：

```javascript
import { analyzeFeedback, analyzeAllFeedback } from '../api/feedback';

// 分析单条
const handleAnalyzeSingle = async (id) => {
  try {
    await analyzeFeedback(id);
    message.success('分析完成');
    fetchFeedback();
  } catch (error) {
    message.error('分析失败');
  }
};

// 批量分析
const handleAnalyzeAll = async () => {
  try {
    const result = await analyzeAllFeedback(10);
    message.success(result.message);
    fetchFeedback();
  } catch (error) {
    message.error('批量分析失败');
  }
};
```

## 定时任务示例

使用 `node-cron` 每小时自动分析：

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
