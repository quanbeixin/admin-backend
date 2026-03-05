/**
 * 字段配置模块 API 测试脚本
 *
 * 使用方法：
 * 1. 确保服务器正在运行
 * 2. 修改下面的 BASE_URL 和 TOKEN
 * 3. 运行: node scripts/testFieldConfigAPI.js
 */

const BASE_URL = 'http://localhost:3000/api';
const TOKEN = 'your-auth-token-here'; // 替换为实际的 token

// 测试数据
const testData = {
  group: {
    group_name: '测试分组',
    group_code: 'test_group_' + Date.now(),
    description: '这是一个测试分组',
    sort_order: 1,
    is_active: true
  },
  field: {
    field_name: '测试字段',
    field_code: 'test_field_' + Date.now(),
    field_type: 'select',
    description: '这是一个测试字段',
    placeholder: '请选择',
    is_required: true,
    is_active: true,
    sort_order: 1
  },
  options: [
    {
      option_value: 'option1',
      option_label: '选项1',
      sort_order: 1
    },
    {
      option_value: 'option2',
      option_label: '选项2',
      sort_order: 2
    }
  ]
};

// HTTP 请求封装
async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

// 测试流程
async function runTests() {
  console.log('=== 开始测试字段配置模块 API ===\n');

  let groupId, fieldId, optionId;

  try {
    // 1. 创建字段分组
    console.log('1. 创建字段分组...');
    const createGroupRes = await request('POST', '/field-groups', testData.group);
    if (createGroupRes.data.success) {
      groupId = createGroupRes.data.data.id;
      console.log('✓ 创建成功，ID:', groupId);
    } else {
      console.log('✗ 创建失败:', createGroupRes.data.message);
      return;
    }

    // 2. 获取分组列表
    console.log('\n2. 获取分组列表...');
    const getGroupsRes = await request('GET', '/field-groups?page=1&limit=10');
    if (getGroupsRes.data.success) {
      console.log('✓ 获取成功，共', getGroupsRes.data.pagination.total, '条');
    } else {
      console.log('✗ 获取失败:', getGroupsRes.data.message);
    }

    // 3. 创建字段定义
    console.log('\n3. 创建字段定义...');
    const fieldData = { ...testData.field, group_id: groupId };
    const createFieldRes = await request('POST', '/field-definitions', fieldData);
    if (createFieldRes.data.success) {
      fieldId = createFieldRes.data.data.id;
      console.log('✓ 创建成功，ID:', fieldId);
    } else {
      console.log('✗ 创建失败:', createFieldRes.data.message);
      return;
    }

    // 4. 获取字段列表
    console.log('\n4. 获取字段列表...');
    const getFieldsRes = await request('GET', `/field-definitions?group_id=${groupId}`);
    if (getFieldsRes.data.success) {
      console.log('✓ 获取成功，共', getFieldsRes.data.pagination.total, '条');
    } else {
      console.log('✗ 获取失败:', getFieldsRes.data.message);
    }

    // 5. 批量创建字段选项
    console.log('\n5. 批量创建字段选项...');
    const batchOptionsRes = await request('POST', '/field-options/batch', {
      field_id: fieldId,
      options: testData.options
    });
    if (batchOptionsRes.data.success) {
      optionId = batchOptionsRes.data.data.options[0].id;
      console.log('✓ 创建成功，共', batchOptionsRes.data.data.total, '条');
    } else {
      console.log('✗ 创建失败:', batchOptionsRes.data.message);
    }

    // 6. 获取字段选项
    console.log('\n6. 获取字段选项...');
    const getOptionsRes = await request('GET', `/field-config/fields/${fieldId}/options`);
    if (getOptionsRes.data.success) {
      console.log('✓ 获取成功，共', getOptionsRes.data.data.length, '条');
    } else {
      console.log('✗ 获取失败:', getOptionsRes.data.message);
    }

    // 7. 获取完整配置树
    console.log('\n7. 获取完整配置树...');
    const getTreeRes = await request('GET', '/field-config/tree?is_active=true');
    if (getTreeRes.data.success) {
      console.log('✓ 获取成功，共', getTreeRes.data.data.length, '个分组');
      const testGroup = getTreeRes.data.data.find(g => g.id === groupId);
      if (testGroup) {
        console.log('  - 测试分组包含', testGroup.fields.length, '个字段');
        if (testGroup.fields[0]) {
          console.log('  - 第一个字段包含', testGroup.fields[0].options.length, '个选项');
        }
      }
    } else {
      console.log('✗ 获取失败:', getTreeRes.data.message);
    }

    // 8. 更新字段定义
    console.log('\n8. 更新字段定义...');
    const updateFieldRes = await request('PUT', `/field-definitions/${fieldId}`, {
      description: '更新后的描述'
    });
    if (updateFieldRes.data.success) {
      console.log('✓ 更新成功');
    } else {
      console.log('✗ 更新失败:', updateFieldRes.data.message);
    }

    // 9. 清理测试数据
    console.log('\n9. 清理测试数据...');

    // 删除选项
    if (optionId) {
      const deleteOptionsRes = await request('POST', '/field-options/batch-delete', {
        ids: batchOptionsRes.data.data.options.map(o => o.id)
      });
      if (deleteOptionsRes.data.success) {
        console.log('✓ 删除选项成功');
      }
    }

    // 删除字段
    if (fieldId) {
      const deleteFieldRes = await request('DELETE', `/field-definitions/${fieldId}`);
      if (deleteFieldRes.data.success) {
        console.log('✓ 删除字段成功');
      }
    }

    // 删除分组
    if (groupId) {
      const deleteGroupRes = await request('DELETE', `/field-groups/${groupId}`);
      if (deleteGroupRes.data.success) {
        console.log('✓ 删除分组成功');
      }
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('\n✗ 测试过程中出错:', error.message);
  }
}

// 运行测试
runTests();
