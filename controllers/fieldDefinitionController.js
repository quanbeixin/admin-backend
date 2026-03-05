const supabase = require('../config/supabase');

// 获取字段定义列表（支持分页和筛选）
exports.getFieldDefinitions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      group_id,
      field_name,
      field_type,
      is_required,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('field_definitions')
      .select(`
        *,
        group:field_groups(id, group_name, group_code)
      `, { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 筛选条件
    if (group_id) {
      query = query.eq('group_id', group_id);
    }
    if (field_name) {
      query = query.ilike('field_name', `%${field_name}%`);
    }
    if (field_type) {
      query = query.eq('field_type', field_type);
    }
    if (is_required !== undefined) {
      query = query.eq('is_required', is_required === 'true');
    }
    if (status !== undefined) {
      query = query.eq('status', status === 'true');
    }

    // 分页
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取字段定义列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取字段定义列表失败',
      error: error.message
    });
  }
};

// 获取某分组下的字段定义
exports.getFieldsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status, is_required } = req.query;

    let query = supabase
      .from('field_definitions')
      .select('*')
      .eq('group_id', groupId)
      .order('sort_order', { ascending: true });

    // 筛选条件
    if (status !== undefined) {
      query = query.eq('status', status === 'true');
    }
    if (is_required !== undefined) {
      query = query.eq('is_required', is_required === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取分组字段错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分组字段失败',
      error: error.message
    });
  }
};

// 获取单个字段定义（包含选项）
exports.getFieldDefinitionById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: field, error: fieldError } = await supabase
      .from('field_definitions')
      .select(`
        *,
        group:field_groups(id, group_name, group_code)
      `)
      .eq('id', id)
      .single();

    if (fieldError) {
      if (fieldError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段定义不存在'
        });
      }
      throw fieldError;
    }

    // 如果是选择类型字段，获取选项（通过 field_code 匹配 field_name）
    if (['select', 'radio', 'checkbox'].includes(field.field_type)) {
      const { data: options, error: optionsError } = await supabase
        .from('field_options')
        .select('*')
        .eq('field_name', field.field_code)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (optionsError) throw optionsError;
      field.options = options;
    }

    res.json({
      success: true,
      data: field,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取字段定义失败',
      error: error.message
    });
  }
};

// 创建字段定义
exports.createFieldDefinition = async (req, res) => {
  try {
    const {
      group_id,
      field_name,
      field_code,
      field_type,
      is_required,
      is_multiple,
      is_system,
      parent_id,
      sort_order,
      status,
      remark
    } = req.body;

    // 必填字段验证
    if (!group_id) {
      return res.status(400).json({
        success: false,
        message: 'group_id 为必填字段'
      });
    }

    if (!field_name) {
      return res.status(400).json({
        success: false,
        message: 'field_name 为必填字段'
      });
    }

    if (!field_code) {
      return res.status(400).json({
        success: false,
        message: 'field_code 为必填字段'
      });
    }

    if (!field_type) {
      return res.status(400).json({
        success: false,
        message: 'field_type 为必填字段'
      });
    }

    const insertData = {
      group_id,
      field_name,
      field_code,
      field_type,
      is_required: is_required !== undefined ? is_required : false,
      is_multiple: is_multiple !== undefined ? is_multiple : false,
      is_system: is_system !== undefined ? is_system : false,
      parent_id: parent_id || null,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
      status: status !== undefined ? status : true,
      remark: remark || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('field_definitions')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
      message: '创建成功'
    });
  } catch (error) {
    console.error('创建字段定义错误:', error);
    res.status(400).json({
      success: false,
      message: '创建字段定义失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 更新字段定义
exports.updateFieldDefinition = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 移除不应该被更新的字段
    delete updateData.id;
    delete updateData.created_at;

    // 转换数字类型
    if (updateData.sort_order !== undefined) {
      updateData.sort_order = parseInt(updateData.sort_order);
    }

    const { data, error } = await supabase
      .from('field_definitions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段定义不存在'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data,
      message: '更新成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新字段定义失败',
      error: error.message
    });
  }
};

// 删除字段定义
exports.deleteFieldDefinition = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取字段的 field_code
    const { data: field } = await supabase
      .from('field_definitions')
      .select('field_code')
      .eq('id', id)
      .single();

    if (field) {
      // 检查是否有关联的字段选项（通过 field_code 匹配 field_name）
      const { data: options, error: checkError } = await supabase
        .from('field_options')
        .select('id')
        .eq('field_name', field.field_code)
        .limit(1);

      if (checkError) throw checkError;

      if (options && options.length > 0) {
        return res.status(400).json({
          success: false,
          message: '该字段下还有选项数据，无法删除'
        });
      }
    }

    const { data, error } = await supabase
      .from('field_definitions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段定义不存在'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data,
      message: '删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '删除字段定义失败',
      error: error.message
    });
  }
};

module.exports = exports;
