# 测试执行系统使用文档

## API 接口

### 1. 触发测试执行
**POST** `/api/test/run`

**请求体：**
```json
{
  "case_id": 1,
  "environment": "production",
  "username": "testuser",
  "password": "testpass123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "task_id": 123,
    "status": "running",
    "message": "测试任务已创建，正在执行中"
  }
}
```

### 2. 查询测试任务结果
**GET** `/api/test/task/:task_id`

**响应：**
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
      "triggered_by": "user123",
      "start_time": "2026-03-02T10:00:00Z",
      "end_time": "2026-03-02T10:01:30Z",
      "report": {
        "total_steps": 5,
        "success_steps": 5,
        "failed_steps": 0,
        "execution_time": null,
        "failed_step_details": []
      },
      "retry_count": 0
    },
    "steps": [
      {
        "id": 1,
        "task_id": 123,
        "step_order": 1,
        "action": "goto",
        "selector": null,
        "value": "https://example.com/login",
        "status": "success",
        "error": null,
        "screenshot": "/uploads/screenshots/step_1_success_1234567890.png",
        "executed_at": "2026-03-02T10:00:10Z"
      }
    ]
  },
  "message": "获取成功"
}
```

## 测试用例 steps 格式

测试用例的 `steps` 字段应该是一个 JSON 数组，每个步骤包含以下字段：

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
      "action": "fill",
      "selector": "#password",
      "value": "{{password}}"
    },
    {
      "action": "click",
      "selector": "button[type='submit']"
    },
    {
      "action": "waitForSelector",
      "selector": ".dashboard"
    },
    {
      "action": "expect",
      "selector": ".welcome-message",
      "value": "欢迎"
    }
  ]
}
```

## 支持的操作类型

| 操作 | 说明 | 必需字段 |
|------|------|----------|
| `goto` | 导航到指定 URL | `value` (URL) |
| `click` | 点击元素 | `selector` |
| `fill` | 填充输入框 | `selector`, `value` |
| `waitForSelector` | 等待元素出现 | `selector` |
| `expect` | 断言元素存在或包含文本 | `selector`, `value` (可选) |
| `wait` | 等待指定毫秒数 | `value` (毫秒) |

## 变量替换

在步骤的 `value` 字段中可以使用以下变量：
- `{{username}}` - 替换为请求中的 username
- `{{password}}` - 替换为请求中的 password

## 截图功能

每个步骤执行后会自动截图，截图保存在 `uploads/screenshots/` 目录下。
- 成功步骤：`step_{order}_success_{timestamp}.png`
- 失败步骤：`step_{order}_error_{timestamp}.png`

## 任务状态

- `pending` - 待执行
- `running` - 执行中
- `success` - 执行成功
- `failed` - 执行失败

## 注意事项

1. 测试任务是异步执行的，调用 `/api/test/run` 后会立即返回 task_id
2. 需要轮询 `/api/test/task/:task_id` 来获取最新的执行状态
3. 如果某个步骤失败，后续步骤将不会执行
4. 截图文件需要配置静态文件服务才能访问
5. Playwright 在无头模式下运行，适合服务器环境
