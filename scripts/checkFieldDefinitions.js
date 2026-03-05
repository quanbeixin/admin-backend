require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFieldDefinitions() {
  console.log('=== 检查 field_definitions 表 ===\n');

  // 尝试查询所有数据
  const { data, error, count } = await supabase
    .from('field_definitions')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ 错误:', error.message);
    return;
  }

  console.log(`总记录数: ${count}`);

  if (data && data.length > 0) {
    console.log('\n字段结构：');
    const fields = Object.keys(data[0]);
    fields.forEach(field => {
      const value = data[0][field];
      const type = value === null ? 'null' : typeof value;
      console.log(`  - ${field.padEnd(20)} (${type})`);
    });

    console.log('\n第一条数据示例：');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('\n⚠️  表为空，尝试插入测试数据来查看表结构...');

    // 先获取一个真实的 group_id
    const { data: groups } = await supabase
      .from('field_groups')
      .select('id')
      .limit(1);

    const groupId = groups && groups.length > 0 ? groups[0].id : '00000000-0000-0000-0000-000000000000';

    // 尝试插入一条测试数据
    const testData = {
      group_id: groupId,
      field_name: 'test_field',
      field_code: 'test_' + Date.now(),
      field_type: 'text'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('field_definitions')
      .insert([testData])
      .select();

    if (insertError) {
      console.log('\n插入测试数据失败，错误信息：');
      console.log(insertError.message);
      console.log(insertError.details || '');
      console.log('\n从错误信息可以推断需要的字段。');
    } else {
      console.log('\n✅ 成功插入测试数据，字段结构：');
      const fields = Object.keys(insertData[0]);
      fields.forEach(field => {
        const value = insertData[0][field];
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${field.padEnd(20)} (${type})`);
      });

      console.log('\n完整数据：');
      console.log(JSON.stringify(insertData[0], null, 2));

      // 删除测试数据
      await supabase
        .from('field_definitions')
        .delete()
        .eq('id', insertData[0].id);
      console.log('\n✅ 已删除测试数据');
    }
  }
}

checkFieldDefinitions();
