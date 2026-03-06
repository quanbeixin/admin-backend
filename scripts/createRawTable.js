require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSqlFile() {
  try {
    console.log('开始执行 SQL 文件...');

    const sqlPath = path.join(__dirname, 'sql', 'create_fb_ad_insights_raw.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 分割 SQL 语句（按分号分割，但忽略注释中的分号）
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`共 ${statements.length} 条 SQL 语句`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n执行第 ${i + 1} 条语句...`);
      console.log(statement.substring(0, 100) + '...');

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        // 如果 rpc 不可用，尝试直接执行
        console.log('尝试使用原生 SQL 执行...');
        const { error: directError } = await supabase.from('_sql').select(statement);

        if (directError) {
          console.error(`❌ 执行失败:`, directError.message);
          throw directError;
        }
      }

      console.log(`✓ 第 ${i + 1} 条语句执行成功`);
    }

    console.log('\n✅ 所有 SQL 语句执行完成！');
    console.log('\n表 fb_ad_insights_raw 创建成功！');

  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error('\n请手动在 Supabase SQL Editor 中执行以下文件:');
    console.error('admin-backend/sql/create_fb_ad_insights_raw.sql');
    process.exit(1);
  }
}

executeSqlFile();
