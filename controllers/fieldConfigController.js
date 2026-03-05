const supabase = require('../config/supabase');

// 获取完整的字段配置树（分组 -> 字段 -> 选项）
exports.getFieldConfigTree = async (req, res) => {
  try {
    const { status } = req.query;

    // 获取分组
    let groupQuery = supabase
      .from('field_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== undefined) {
      groupQuery = groupQuery.eq('status', status === 'true');
    }

    const { data: groups, error: groupError } = await groupQuery;
    if (groupError) throw groupError;

    // 获取所有字段定义
    let fieldQuery = supabase
      .from('field_definitions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (status !== undefined) {
      fieldQuery = fieldQuery.eq('status', status === 'true');
    }

    const { data: fields, error: fieldError } = await fieldQuery;
    if (fieldError) throw fieldError;

    // 获取所有选项
    let optionQuery = supabase
      .from('field_options')
      .select('*')
      .order('sort_order', { ascending: true });

    if (status !== undefined) {
      optionQuery = optionQuery.eq('is_active', status === 'true');
    }

    const { data: options, error: optionError } = await optionQuery;
    if (optionError) throw optionError;

    // 构建树形结构
    const tree = groups.map(group => {
      const groupFields = fields.filter(f => f.group_id === group.id);

      return {
        id: group.id,
        group_name: group.group_name,
        group_code: group.group_code,
        description: group.description,
        status: group.status,
        fields: groupFields.map(field => {
          // 通过 field_code 匹配 field_name
          const fieldOptions = options.filter(o => o.field_name === field.field_code);

          return {
            id: field.id,
            field_name: field.field_name,
            field_code: field.field_code,
            field_type: field.field_type,
            is_required: field.is_required,
            is_multiple: field.is_multiple,
            is_system: field.is_system,
            parent_id: field.parent_id,
            sort_order: field.sort_order,
            status: field.status,
            remark: field.remark,
            options: fieldOptions.map(option => ({
              id: option.id,
              option_value: option.option_value,
              option_label: option.option_label,
              description: option.description,
              sort_order: option.sort_order,
              is_active: option.is_active
            }))
          };
        })
      };
    });

    res.json({
      success: true,
      data: tree,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取字段配置树错误:', error);
    res.status(500).json({
      success: false,
      message: '获取字段配置树失败',
      error: error.message
    });
  }
};

module.exports = exports;