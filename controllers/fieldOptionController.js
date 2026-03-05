const supabase = require('../config/supabase');

// 获取字段选项列表（支持分页和筛选）
exports.getFieldOptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      field_name,
      option_value,
      is_active
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('field_options')
      .select('*', { count: 'exact' })
      .order('field_name', { ascending: true })
      .order('sort_order', { ascending: true });

    // 筛选条件
    if (field_name) {
      query = query.eq('field_name', field_name);
    }
    if (option_value) {
      query = query.ilike('option_value', `%${option_value}%`);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
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
    console.error('获取字段选项列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取字段选项列表失败',
      error: error.message
    });
  }
};

// 获取某字段的所有选项（通过 field_code）
exports.getOptionsByFieldCode = async (req, res) => {
  try {
    const { fieldCode } = req.params;
    const { is_active } = req.query;

    let query = supabase
      .from('field_options')
      .select('*')
      .eq('field_name', fieldCode)
      .order('sort_order', { ascending: true });

    // 筛选条件
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取字段选项错误:', error);
    res.status(500).json({
      success: false,
      message: '获取字段选项失败',
      error: error.message
    });
  }
};

// 获取单个字段选项
exports.getFieldOptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('field_options')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段选项不存在'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取字段选项失败',
      error: error.message
    });
  }
};

// 创建字段选项
exports.createFieldOption = async (req, res) => {
  try {
    const {
      field_name,
      option_value,
      option_label,
      description,
      color,
      sort_order,
      is_active
    } = req.body;

    // 必填字段验证
    if (!field_name) {
      return res.status(400).json({
        success: false,
        message: 'field_name 为必填字段'
      });
    }

    if (!option_value) {
      return res.status(400).json({
        success: false,
        message: 'option_value 为必填字段'
      });
    }

    if (!option_label) {
      return res.status(400).json({
        success: false,
        message: 'option_label 为必填字段'
      });
    }

    const insertData = {
      field_name,
      option_value,
      option_label,
      description: description || null,
      color: color || null,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('field_options')
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
    console.error('创建字段选项错误:', error);
    res.status(400).json({
      success: false,
      message: '创建字段选项失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 更新字段选项
exports.updateFieldOption = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 移除不应该被更新的字段
    delete updateData.id;
    delete updateData.created_at;

    // 自动更新 updated_at
    updateData.updated_at = new Date().toISOString();

    // 转换数字类型
    if (updateData.sort_order !== undefined) {
      updateData.sort_order = parseInt(updateData.sort_order);
    }

    const { data, error } = await supabase
      .from('field_options')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段选项不存在'
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
      message: '更新字段选项失败',
      error: error.message
    });
  }
};

// 删除字段选项
exports.deleteFieldOption = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('field_options')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段选项不存在'
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
      message: '删除字段选项失败',
      error: error.message
    });
  }
};

// 批量创建/更新字段选项
exports.batchUpsertFieldOptions = async (req, res) => {
  try {
    const { field_name, options } = req.body;

    if (!field_name) {
      return res.status(400).json({
        success: false,
        message: 'field_name 为必填字段'
      });
    }

    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'options 必须是非空数组'
      });
    }

    let created = 0;
    let updated = 0;
    const results = [];

    for (const option of options) {
      if (option.id) {
        // 更新现有选项
        const updateData = {
          ...option,
          field_name,
          updated_at: new Date().toISOString()
        };
        delete updateData.id;
        delete updateData.created_at;

        const { data, error } = await supabase
          .from('field_options')
          .update(updateData)
          .eq('id', option.id)
          .select()
          .single();

        if (error) throw error;
        results.push(data);
        updated++;
      } else {
        // 创建新选项
        const insertData = {
          field_name,
          option_value: option.option_value,
          option_label: option.option_label,
          description: option.description || null,
          sort_order: option.sort_order !== undefined ? parseInt(option.sort_order) : 0,
          is_active: option.is_active !== undefined ? option.is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('field_options')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;
        results.push(data);
        created++;
      }
    }

    res.json({
      success: true,
      data: {
        created,
        updated,
        total: created + updated,
        options: results
      },
      message: '批量操作成功'
    });
  } catch (error) {
    console.error('批量操作字段选项错误:', error);
    res.status(400).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
};

// 批量删除字段选项
exports.batchDeleteFieldOptions = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids 必须是非空数组'
      });
    }

    const { data, error } = await supabase
      .from('field_options')
      .delete()
      .in('id', ids)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        deleted: data.length
      },
      message: `成功删除 ${data.length} 条记录`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '批量删除失败',
      error: error.message
    });
  }
};

module.exports = exports;