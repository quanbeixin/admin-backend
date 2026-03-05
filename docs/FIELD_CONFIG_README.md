# 字段可配置管理模块

## 概述

本模块提供了一套完整的字段可配置管理系统，支持动态表单配置。采用三层结构设计：

- **字段分组（Field Groups）**：用于组织和分类字段
- **字段定义（Field Definitions）**：定义具体的字段属性和类型
- **字段选项（Field Options）**：为选择类字段提供可选项

## 文件结构

```
admin-backend/
├── controllers/
│   ├── fieldGroupController.js          # 字段分组控制器
│   ├── fieldDefinitionController.js     # 字段定义控制器
│   ├── fieldOptionController.js         # 字段选项控制器
│   └── fieldConfigController.js         # 字段配置树控制器
├── routes/
│   ├── fieldGroups.js                   # 字段分组路由
│   ├── fieldDefinitions.js              # 字段定义路由
│   ├── fieldOptions.js                  # 字段选项路由
│   ├── fieldConfig.js                   # 字段配置关联查询路由
│   └── index.js                         # 主路由（已更新）
├── docs/
│   └── FIELD_CONFIG_API.md              # 完整 API 文档
└── scripts/
    └── testFieldConfigAPI.js            # API 测试脚本
```

## API 路由

### 字段分组
- `GET /api/field-groups` - 获取分组列表
- `GET /api/field-groups/:id` - 获取单个分组
- `POST /api/field-groups` - 创建分组
- `PUT /api/field-groups/:id` - 更新分组
- `DELETE /api/field-groups/:id` - 删除分组

### 字段定义
- `GET /api/field-definitions` - 获取字段列表
- `GET /api/field-definitions/:id` - 获取单个字段
- `POST /api/field-definitions` - 创建字段
- `PUT /api/field-definitions/:id` - 更新字段
- `DELETE /api/field-definitions/:id` - 删除字段

### 字段选项
- `GET /api/field-options` - 获取选项列表
- `GET /api/field-options/:id` - 获取单个选项
- `POST /api/field-options` - 创建选项
- `PUT /api/field-options/:id` - 更新选项
- `DELETE /api/field-options/:id` - 删除选项
- `POST /api/field-options/batch` - 批量创建/更新选项
- `POST /api/field-options/batch-delete` - 批量删除选项

### 字段配置关联查询
- `GET /api/field-config/tree` - 获取完整配置树
- `GET /api/field-config/groups/:groupId/fields` - 获取某分组下的字段
- `GET /api/field-config/fields/:fieldId/options` - 获取某字段的所有选项

## 数据表结构

### field_groups（字段分组表）
```sql
CREATE TABLE field_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name VARCHAR(255) NOT NULL,
  group_code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### field_definitions（字段定义表）
```sql
CREATE TABLE field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES field_groups(id),
  field_name VARCHAR(255) NOT NULL,
  field_code VARCHAR(100) NOT NULL UNIQUE,
  field_type VARCHAR(50) NOT NULL,
  description TEXT,
  placeholder VARCHAR(255),
  default_value TEXT,
  validation_rules JSONB,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### field_options（字段选项表）
```sql
CREATE TABLE field_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES field_definitions(id),
  option_value VARCHAR(255) NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(500),
  color VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 使用说明

### 1. 启动服务器

确保你的服务器正在运行：

```bash
npm start
# 或
node index.js
```

### 2. 测试 API

修改测试脚本中的 BASE_URL 和 TOKEN，然后运行：

```bash
node scripts/testFieldConfigAPI.js
```

### 3. 前端集成示例

```javascript
// 获取完整的字段配置树
async function getFieldConfig() {
  const response = await fetch('/api/field-config/tree?is_active=true', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const { data } = await response.json();
  return data;
}

// 渲染动态表单
const fieldConfig = await getFieldConfig();
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

## 支持的字段类型

- `text` - 单行文本
- `textarea` - 多行文本
- `number` - 数字
- `select` - 下拉选择
- `radio` - 单选按钮
- `checkbox` - 多选框
- `date` - 日期
- `datetime` - 日期时间
- `switch` - 开关

## 注意事项

1. **删除限制**：
   - 删除分组时，如果分组下有字段定义，将无法删除
   - 删除字段时，如果字段下有选项数据，将无法删除

2. **唯一性约束**：
   - `group_code` 必须唯一
   - `field_code` 必须唯一

3. **字段选项**：
   - 只有 `select`、`radio`、`checkbox` 类型的字段需要配置选项

4. **排序**：
   - 所有数据都支持 `sort_order` 字段进行排序
   - 值越小，排序越靠前

## 完整文档

详细的 API 文档请查看：[docs/FIELD_CONFIG_API.md](./docs/FIELD_CONFIG_API.md)

## 常见问题

### Q: 如何验证表结构是否正确？

A: 可以通过 Supabase 控制台查看表结构，或者运行测试脚本验证 API 是否正常工作。

### Q: 如何自定义验证规则？

A: 在创建字段定义时，可以通过 `validation_rules` 字段传入 JSON 对象，例如：
```json
{
  "min": 1,
  "max": 100,
  "pattern": "^[a-zA-Z0-9]+$"
}
```

### Q: 如何实现字段的条件显示？

A: 可以在前端根据 `validation_rules` 或自定义字段实现条件逻辑。后端只负责存储和返回配置数据。

## 后续扩展

可以考虑添加以下功能：

1. 字段依赖关系（某个字段的显示依赖于另一个字段的值）
2. 字段权限控制（不同角色看到不同的字段）
3. 字段版本管理（记录字段配置的历史变更）
4. 字段使用统计（统计哪些字段被使用最多）
5. 字段模板（预设常用的字段组合）

## 技术支持

如有问题，请查看：
- API 文档：`docs/FIELD_CONFIG_API.md`
- 测试脚本：`scripts/testFieldConfigAPI.js`
- 控制器代码：`controllers/field*.js`
