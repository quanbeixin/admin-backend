const supabase = require('../config/supabase');

async function checkTableStructure() {
  try {
    console.log('=== 检查表结构 ===\n');

    // 检查 field_groups 表
    console.log('1. field_groups 表结构:');
    const { data: groups, error: groupsError } = await supabase
      .from('field_groups')
      .select('*')
      .limit(1);

    if (groupsError) {
      console.error('field_groups 错误:', groupsError.message);
    } else {
      console.log(groups.length > 0 ? groups[0] : '表为空，无法获取结构');
    }

    console.log('\n2. field_definitions 表结构:');
    const { data: definitions, error: definitionsError } = await supabase
      .from('field_definitions')
      .select('*')
      .limit(1);

    if (definitionsError) {
      console.error('field_definitions 错误:', definitionsError.message);
    } else {
      console.log(definitions.length > 0 ? definitions[0] : '表为空，无法获取结构');
    }

    console.log('\n3. field_options 表结构:');
    const { data: options, error: optionsError } = await supabase
      .from('field_options')
      .select('*')
      .limit(1);

    if (optionsError) {
      console.error('field_options 错误:', optionsError.message);
    } else {
      console.log(options.length > 0 ? options[0] : '表为空，无法获取结构');
    }

  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkTableStructure();
