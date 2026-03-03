const supabase = require('../config/supabase');

// 获取选型字段列表（支持分页和筛选）
exports.getOptionFields = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      field_name,
      is_active
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('ad_option_fields')
      .select('*', { count: 'exact' })
      .order('field_name', { ascending: true })
      .order('sort_order', { ascending: true });

    // 筛选条件
    if (field_name) {
      query = query.eq('field_name', field_name);
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
    console.error('获取选型字段列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取选型字段列表失败',
      error: error.message
    });
  }
};

// 获取单个选型字段
exports.getOptionFieldById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ad_option_fields')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '选型字段不存在'
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
      message: '获取选型字段失败',
      error: error.message
    });
  }
};

// 创建选型字段
exports.createOptionField = async (req, res) => {
  try {
    console.log('=== 创建选型字段请求 ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);

    const {
      field_name,
      option_value,
      option_label,
      description,
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
      sort_order: sort_order !== undefined ? parseInt(sort_order) : 0,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('准备插入的数据:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('ad_option_fields')
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
    console.error('创建选型字段错误:', error);
    res.status(400).json({
      success: false,
      message: '创建选型字段失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 更新选型字段
exports.updateOptionField = async (req, res) => {
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
      .from('ad_option_fields')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '选型字段不存在'
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
      message: '更新选型字段失败',
      error: error.message
    });
  }
};

// 删除选型字段
exports.deleteOptionField = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ad_option_fields')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '选型字段不存在'
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
      message: '删除选型字段失败',
      error: error.message
    });
  }
};

// 批量删除选型字段
exports.batchDeleteOptionFields = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids 必须是非空数组'
      });
    }

    const { data, error } = await supabase
      .from('ad_option_fields')
      .delete()
      .in('id', ids)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
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

// 获取字段名列表（用于下拉选择）
exports.getFieldNames = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ad_option_fields')
      .select('field_name')
      .order('field_name', { ascending: true });

    if (error) throw error;

    // 去重
    const uniqueFieldNames = [...new Set(data.map(item => item.field_name))];

    res.json({
      success: true,
      data: uniqueFieldNames,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取字段名列表失败',
      error: error.message
    });
  }
};

// 获取树形结构数据
exports.getOptionFieldsTree = async (req, res) => {
  try {
    const { is_active } = req.query;

    let query = supabase
      .from('ad_option_fields')
      .select('*')
      .order('field_name', { ascending: true })
      .order('sort_order', { ascending: true });

    // 筛选条件
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    // 转换为树形结构
    const treeData = [];
    const fieldMap = new Map();

    data.forEach(item => {
      if (!fieldMap.has(item.field_name)) {
        const parentNode = {
          key: item.field_name,
          field_name: item.field_name,
          title: item.field_name,
          isParent: true,
          children: []
        };
        fieldMap.set(item.field_name, parentNode);
        treeData.push(parentNode);
      }

      const parent = fieldMap.get(item.field_name);
      parent.children.push({
        ...item,
        key: item.id,
        title: `${item.option_label} (${item.option_value})`,
        isParent: false
      });
    });

    res.json({
      success: true,
      data: treeData,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取树形数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取树形数据失败',
      error: error.message
    });
  }
};

module.exports = exports;
