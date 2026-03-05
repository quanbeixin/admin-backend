# 字段可配置管理模块 API 文档

## 概述

本模块提供了一套完整的字段可配置管理 API，采用三层结构设计：
- **字段分组（Field Groups）**：顶层，用于组织和分类字段
- **字段定义（Field Definitions）**：中层，定义具体的字段属性
- **字段选项（Field Options）**：底层，为选择类字段提供可选项

## 基础信息

- **Base URL**: `/api`
- **认证方式**: Bearer Token（通过 `Authorization: Bearer <token>` 请求头）
- **响应格式**: JSON

### 统一响应结构

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "pagination": {  // 仅分页接口返回
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 一、字段分组管理

### 1.1 获取分组列表

**接口**: `GET /api/field-groups`

**Query 参数**:
- `page` (number, 可选): 页码，默认 1
- `limit` (number, 可选): 每页数量，默认 20
- `group_name` (string, 可选): 分组名称模糊搜索
- `is_active` (boolean, 可选): 是否启用

**示例请求**:
```bash
GET /api/field-groups?page=1&limit=20&is_active=true
```

**示例响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "group_name": "广告基础信息",
      "group_code": "ad_basic",
      "description": "广告的基础配置字段",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-03-05T10:00:00Z",
      "updated_at": "2026-03-05T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  },
  "message": "获取成功"
}
```

### 1.2 获取单个分组

**接口**: `GET /api/field-groups/:id`

**示例响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "group_name": "广告基础信息",
    "group_code": "ad_basic",
    "description": "广告的基础配置字段",
    "sort_order": 1,
    "is_active": true,
    "created_at": "2026-03-05T10:00:00Z",
    "updated_at": "2026-03-05T10:00:00Z"
  },
  "message": "获取成功"
}
```

### 1.3 创建分组

**接口**: `POST /api/field-groups`

**Body 参数**:
```json
{
  "group_name": "广告基础信息",      // 必填
  "group_code": "ad_basic",         // 必填，唯一标识
  "description": "广告的基础配置字段", // 可选
  "sort_order": 1,                  // 可选，默认 0
  "is_active": true                 // 可选，默认 true
}
```

### 1.4 更新分组

**接口**: `PUT /api/field-groups/:id`

**Body 参数**: 同创建接口，所有字段可选

### 1.5 删除分组

**接口**: `DELETE /api/field-groups/:id`

**注意**: 如果分组下有字段定义，将无法删除

---

## 二、字段定义管理

### 2.1 获取字段列表

**接口**: `GET /api/field-definitions`

**Query 参数**:
- `page` (number, 可选): 页码
- `limit` (number, 可选): 每页数量
- `group_id` (string, 可选): 按分组筛选
- `field_name` (string, 可选): 字段名称模糊搜索
- `field_type` (string, 可选): 字段类型筛选
- `is_required` (boolean, 可选): 是否必填
- `is_active` (boolean, 可选): 是否启用

**示例响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "field_name": "广告平台",
      "field_code": "ad_platform",
      "field_type": "select",
      "description": "选择广告投放平台",
      "placeholder": "请选择广告平台",
      "default_value": "",
      "validation_rules": {
        "min": null,
        "max": null,
        "pattern": null
      },
      "is_required": true,
      "is_active": true,
      "sort_order": 1,
      "created_at": "2026-03-05T10:00:00Z",
      "updated_at": "2026-03-05T10:00:00Z",
      "group": {
        "id": "uuid",
        "group_name": "广告基础信息",
        "group_code": "ad_basic"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  },
  "message": "获取成功"
}
```

### 2.2 获取单个字段（包含选项）

**接口**: `GET /api/field-definitions/:id`

**示例响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "group_id": "uuid",
    "field_name": "广告平台",
    "field_code": "ad_platform",
    "field_type": "select",
    "description": "选择广告投放平台",
    "placeholder": "请选择广告平台",
    "default_value": "",
    "validation_rules": {
      "min": null,
      "max": null,
      "pattern": null
    },
    "is_required": true,
    "is_active": true,
    "sort_order": 1,
    "created_at": "2026-03-05T10:00:00Z",
    "updated_at": "2026-03-05T10:00:00Z",
    "group": {
      "id": "uuid",
      "group_name": "广告基础信息",
      "group_code": "ad_basic"
    },
    "options": [
      {
        "id": "uuid",
        "option_value": "tiktok",
        "option_label": "抖音",
        "sort_order": 1
      }
    ]
  },
  "message": "获取成功"
}
```

### 2.3 创建字段

**接口**: `POST /api/field-definitions`

**Body 参数**:
```json
{
  "group_id": "uuid",                    // 必填
  "field_name": "广告平台",               // 必填
  "field_code": "ad_platform",           // 必填，唯一标识
  "field_type": "select",                // 必填：text/textarea/number/select/radio/checkbox/date/datetime/switch
  "description": "选择广告投放平台",      // 可选
  "placeholder": "请选择广告平台",        // 可选
  "default_value": "",                   // 可选
  "validation_rules": {                  // 可选
    "min": 1,
    "max": 100,
    "pattern": "^[a-zA-Z0-9]+$"
  },
  "is_required": true,                   // 可选，默认 false
  "is_active": true,                     // 可选，默认 true
  "sort_order": 1                        // 可选，默认 0
}
```

### 2.4 更新字段

**接口**: `PUT /api/field-definitions/:id`

**Body 参数**: 同创建接口，所有字段可选

### 2.5 删除字段

**接口**: `DELETE /api/field-definitions/:id`

**注意**: 如果字段下有选项数据，将无法删除

---

## 三、字段选项管理

### 3.1 获取选项列表

**接口**: `GET /api/field-options`

**Query 参数**:
- `page` (number, 可选): 页码
- `limit` (number, 可选): 每页数量
- `field_id` (string, 可选): 按字段筛选
- `option_value` (string, 可选): 选项值模糊搜索
- `is_active` (boolean, 可选): 是否启用

**示例响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "field_id": "uuid",
      "option_value": "tiktok",
      "option_label": "抖音",
      "description": "抖音广告平台",
      "icon": "https://example.com/icon.png",
      "color": "#FF0000",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-03-05T10:00:00Z",
      "updated_at": "2026-03-05T10:00:00Z",
      "field": {
        "id": "uuid",
        "field_name": "广告平台",
        "field_code": "ad_platform",
        "field_type": "select"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  },
  "message": "获取成功"
}
```

### 3.2 获取单个选项

**接口**: `GET /api/field-options/:id`

### 3.3 创建选项

**接口**: `POST /api/field-options`

**Body 参数**:
```json
{
  "field_id": "uuid",                // 必填
  "option_value": "tiktok",          // 必填
  "option_label": "抖音",            // 必填
  "description": "抖音广告平台",      // 可选
  "icon": "https://example.com/icon.png",  // 可选
  "color": "#FF0000",                // 可选
  "sort_order": 1,                   // 可选，默认 0
  "is_active": true                  // 可选，默认 true
}
```

### 3.4 更新选项

**接口**: `PUT /api/field-options/:id`

**Body 参数**: 同创建接口，所有字段可选

### 3.5 删除选项

**接口**: `DELETE /api/field-options/:id`

### 3.6 批量创建/更新选项

**接口**: `POST /api/field-options/batch`

**Body 参数**:
```json
{
  "field_id": "uuid",
  "options": [
    {
      "id": "uuid",                    // 可选，有 id 则更新，无 id 则创建
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

**示例响应**:
```json
{
  "success": true,
  "data": {
    "created": 1,
    "updated": 1,
    "total": 2,
    "options": [...]
  },
  "message": "批量操作成功"
}
```

### 3.7 批量删除选项

**接口**: `POST /api/field-options/batch-delete`

**Body 参数**:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 四、字段配置关联查询

### 4.1 获取完整的字段配置树

**接口**: `GET /api/field-config/tree`

**Query 参数**:
- `is_active` (boolean, 可选): 只返回启用的数据

**示例响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "group_name": "广告基础信息",
      "group_code": "ad_basic",
      "description": "广告的基础配置字段",
      "sort_order": 1,
      "is_active": true,
      "fields": [
        {
          "id": "uuid",
          "field_name": "广告平台",
          "field_code": "ad_platform",
          "field_type": "select",
          "description": "选择广告投放平台",
          "placeholder": "请选择广告平台",
          "default_value": "",
          "validation_rules": null,
          "is_required": true,
          "is_active": true,
          "sort_order": 1,
          "options": [
            {
              "id": "uuid",
              "option_value": "tiktok",
              "option_label": "抖音",
              "description": "抖音广告平台",
              "icon": "https://example.com/icon.png",
              "color": "#FF0000",
              "sort_order": 1,
              "is_active": true
            }
          ]
        }
      ]
    }
  ],
  "message": "获取成功"
}
```

### 4.2 获取某分组下的字段

**接口**: `GET /api/field-config/groups/:groupId/fields`

**Query 参数**:
- `is_active` (boolean, 可选): 是否启用
- `is_required` (boolean, 可选): 是否必填

### 4.3 获取某字段的所有选项

**接口**: `GET /api/field-config/fields/:fieldId/options`

**Query 参数**:
- `is_active` (boolean, 可选): 是否启用

---

## 五、数据表结构

### field_groups 表
```sql
- id (uuid, primary key)
- group_name (varchar, 分组名称)
- group_code (varchar, 分组代码，唯一)
- description (text, 描述)
- sort_order (integer, 排序)
- is_active (boolean, 是否启用)
- created_at (timestamp)
- updated_at (timestamp)
```

### field_definitions 表
```sql
- id (uuid, primary key)
- group_id (uuid, foreign key -> field_groups.id)
- field_name (varchar, 字段名称)
- field_code (varchar, 字段代码，唯一)
- field_type (varchar, 字段类型)
- description (text, 描述)
- placeholder (varchar, 占位符)
- default_value (text, 默认值)
- validation_rules (jsonb, 验证规则)
- is_required (boolean, 是否必填)
- is_active (boolean, 是否启用)
- sort_order (integer, 排序)
- created_at (timestamp)
- updated_at (timestamp)
```

### field_options 表
```sql
- id (uuid, primary key)
- field_id (uuid, foreign key -> field_definitions.id)
- option_value (varchar, 选项值)
- option_label (varchar, 选项标签)
- description (text, 描述)
- icon (varchar, 图标 URL)
- color (varchar, 颜色)
- sort_order (integer, 排序)
- is_active (boolean, 是否启用)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 六、错误码说明

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 七、使用示例

### 前端完整流程示例

```javascript
// 1. 获取字段配置树（用于渲染表单）
const response = await fetch('/api/field-config/tree?is_active=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data: fieldConfig } = await response.json();

// 2. 渲染动态表单
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

// 3. 创建新的字段分组
await fetch('/api/field-groups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    group_name: '新分组',
    group_code: 'new_group',
    sort_order: 1
  })
});

// 4. 批量更新字段选项
await fetch('/api/field-options/batch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    field_id: 'field-uuid',
    options: [
      { option_value: 'opt1', option_label: '选项1', sort_order: 1 },
      { option_value: 'opt2', option_label: '选项2', sort_order: 2 }
    ]
  })
});
```

---

## 八、注意事项

1. **删除限制**:
   - 删除分组时，如果分组下有字段定义，将无法删除
   - 删除字段时，如果字段下有选项数据，将无法删除

2. **唯一性约束**:
   - `group_code` 在 field_groups 表中必须唯一
   - `field_code` 在 field_definitions 表中必须唯一

3. **字段类型**:
   - 支持的字段类型：text, textarea, number, select, radio, checkbox, date, datetime, switch
   - 只有 select, radio, checkbox 类型的字段需要配置选项

4. **排序**:
   - 所有列表接口都会按 `sort_order` 升序排序
   - `sort_order` 值越小，排序越靠前

5. **分页**:
   - 默认每页 20 条数据
   - 最大每页 100 条数据
