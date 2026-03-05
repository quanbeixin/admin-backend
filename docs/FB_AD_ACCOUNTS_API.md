# Facebook 广告账户管理 API 文档

## 基础信息

- **Base URL**: `/api/fb-ad-accounts`
- **认证方式**: JWT Token (Bearer Token)
- **请求头**:
  ```
  Authorization: Bearer <your_token>
  Content-Type: application/json
  ```

---

## API 接口列表

### 1. 获取所有账户

**接口**: `GET /api/fb-ad-accounts`

**描述**: 获取所有 Facebook 广告账户列表

**请求参数**: 无

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

---

### 2. 获取单个账户

**接口**: `GET /api/fb-ad-accounts/:id`

**描述**: 根据 ID 获取单个 Facebook 广告账户

**请求参数**:
- `id` (路径参数): 账户 ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "access_token": "EAATfGj5H2DY...",
    "status": "active",
    "created_at": "2026-03-05T10:00:00.000Z",
    "updated_at": "2026-03-05T10:00:00.000Z"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "账户不存在",
  "error": "..."
}
```

---

### 3. 创建账户

**接口**: `POST /api/fb-ad-accounts`

**描述**: 创建新的 Facebook 广告账户

**请求体**:
```json
{
  "access_token": "EAATfGj5H2DY...",
  "status": "active"  // 可选，默认为 "active"
}
```

**字段说明**:
- `access_token` (必填): Facebook 访问令牌
- `status` (可选): 账户状态，可选值: `active` / `disabled`，默认 `active`

**响应示例**:
```json
{
  "success": true,
  "message": "账户创建成功",
  "data": {
    "id": 1,
    "access_token": "EAATfGj5H2DY...",
    "status": "active",
    "created_at": "2026-03-05T10:00:00.000Z",
    "updated_at": "2026-03-05T10:00:00.000Z"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "access_token 不能为空"
}
```

---

### 4. 更新账户

**接口**: `PUT /api/fb-ad-accounts/:id`

**描述**: 更新指定 ID 的 Facebook 广告账户

**请求参数**:
- `id` (路径参数): 账户 ID

**请求体**:
```json
{
  "access_token": "EAATfGj5H2DY...",  // 可选
  "status": "disabled"  // 可选
}
```

**字段说明**:
- `access_token` (可选): 新的 Facebook 访问令牌
- `status` (可选): 账户状态，可选值: `active` / `disabled`

**响应示例**:
```json
{
  "success": true,
  "message": "账户更新成功",
  "data": {
    "id": 1,
    "access_token": "EAATfGj5H2DY...",
    "status": "disabled",
    "created_at": "2026-03-05T10:00:00.000Z",
    "updated_at": "2026-03-05T11:00:00.000Z"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "账户不存在"
}
```

---

### 5. 删除账户

**接口**: `DELETE /api/fb-ad-accounts/:id`

**描述**: 删除指定 ID 的 Facebook 广告账户

**请求参数**:
- `id` (路径参数): 账户 ID

**响应示例**:
```json
{
  "success": true,
  "message": "账户删除成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "删除账户失败",
  "error": "..."
}
```

---

## 前端调用示例

### 使用 axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://your-api-domain.com/api';
const token = localStorage.getItem('token'); // 从本地存储获取 token

// 配置 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// 1. 获取所有账户
const getAllAccounts = async () => {
  try {
    const response = await api.get('/fb-ad-accounts');
    console.log(response.data);
  } catch (error) {
    console.error('获取账户列表失败:', error);
  }
};

// 2. 获取单个账户
const getAccountById = async (id) => {
  try {
    const response = await api.get(`/fb-ad-accounts/${id}`);
    console.log(response.data);
  } catch (error) {
    console.error('获取账户失败:', error);
  }
};

// 3. 创建账户
const createAccount = async (accountData) => {
  try {
    const response = await api.post('/fb-ad-accounts', accountData);
    console.log(response.data);
  } catch (error) {
    console.error('创建账户失败:', error);
  }
};

// 4. 更新账户
const updateAccount = async (id, accountData) => {
  try {
    const response = await api.put(`/fb-ad-accounts/${id}`, accountData);
    console.log(response.data);
  } catch (error) {
    console.error('更新账户失败:', error);
  }
};

// 5. 删除账户
const deleteAccount = async (id) => {
  try {
    const response = await api.delete(`/fb-ad-accounts/${id}`);
    console.log(response.data);
  } catch (error) {
    console.error('删除账户失败:', error);
  }
};
```

### 使用项目中的 request 封装

```javascript
import request from '../api/request';

// 1. 获取所有账户
export const getAllAccounts = () => {
  return request.get('/fb-ad-accounts');
};

// 2. 获取单个账户
export const getAccountById = (id) => {
  return request.get(`/fb-ad-accounts/${id}`);
};

// 3. 创建账户
export const createAccount = (data) => {
  return request.post('/fb-ad-accounts', data);
};

// 4. 更新账户
export const updateAccount = (id, data) => {
  return request.put(`/fb-ad-accounts/${id}`, data);
};

// 5. 删除账户
export const deleteAccount = (id) => {
  return request.delete(`/fb-ad-accounts/${id}`);
};
```

---

## 数据库表结构

```sql
CREATE TABLE fb_ad_accounts (
  id BIGSERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**字段说明**:
- `id`: 主键，自增
- `access_token`: Facebook 访问令牌（必填）
- `status`: 账户状态，默认 `active`
- `created_at`: 创建时间
- `updated_at`: 更新时间

---

## 状态码说明

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权（token 无效或过期）
- `404`: 资源不存在
- `500`: 服务器内部错误
