# DeepSeek API 配置指南

已将 AI 分析服务从 Claude 切换到 DeepSeek。

## 获取 DeepSeek API Key

### 1. 注册账号
访问：https://platform.deepseek.com/

### 2. 获取 API Key
- 登录后进入控制台
- 点击「API Keys」
- 创建新的 API Key
- 复制 Key（格式：`sk-xxxxxxxxxxxxxxxx`）

### 3. 配置到项目
在 `.env` 文件中填入：
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

## DeepSeek 优势

- **免费额度大**：新用户有 500 万 tokens 免费额度
- **中文支持好**：专门优化过中文理解
- **响应速度快**：国内访问速度快
- **成本低**：付费后也比 Claude 便宜很多

## 使用方式

配置好 API Key 后，重启后端服务：
```bash
npm run dev
```

然后在前端点击「AI 分析」按钮即可。

## 费用说明

- 免费额度：500 万 tokens（约可分析 5000-10000 条反馈）
- 付费价格：¥1/百万 tokens（输入）、¥2/百万 tokens（输出）
- 单条反馈分析成本：约 ¥0.001-0.002

## 模型信息

当前使用模型：`deepseek-chat`
- 上下文长度：64K tokens
- 支持中英文
- 适合对话、分析、分类等任务

## 注意事项

1. API Key 不要泄露或提交到 Git
2. 免费额度用完后需要充值才能继续使用
3. 建议设置用量告警，避免超支
