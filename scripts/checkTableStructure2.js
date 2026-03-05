require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableStructure(tableName) {
  console.log(`\n=== ${tableName} 表结构 ===`);

  // 查询表的第一条数据来推断结构
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.error(`❌ 表 ${tableName} 不存在或无法访问`);
    console.error('错误信息:', error.message);
    return null;
  }

  if (data && data.length > 0) {
    console.log('✅ 表存在，字段列表：');
    const fields = Object.keys(data[0]);
    fields.forEach(field => {
      const value = data[0][field];
      const type = value === null ? 'null' : typeof value;
      const sample = value === null ? 'NULL' : JSON.stringify(value).substring(0, 50);
      console.log(`  - ${field.padEnd(20)} (${type.padEnd(8)}) 示例: ${sample}`);
    });
    console.log(`\n数据条数: ${data.length} 条（仅查询了第一条）`);
    return fields;
  } else {
    console.log('⚠️  表存在但为空，无法推断字段结构');
    console.log('建议：插入一条测试数据或使用 Supabase 控制台查看表结构');
    return [];
  }
}

async function checkTables() {
  console.log('=== 检查字段配置相关表结构 ===\n');
  console.log('数据库:', supabaseUrl);

  const tables = ['field_groups', 'field_definitions', 'field_options'];

  for (const table of tables) {
    await getTableStructure(table);
  }

  console.log('\n=== 检查完成 ===');
}

checkTables();
