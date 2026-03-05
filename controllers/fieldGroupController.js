const supabase = require('../config/supabase');

// 获取字段分组列表（支持分页和筛选）
exports.getFieldGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      group_name,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('field_groups')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 筛选条件
    if (group_name) {
      query = query.ilike('group_name', `%${group_name}%`);
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
    console.error('获取字段分组列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取字段分组列表失败',
      error: error.message
    });
  }
};

// 获取单个字段分组
exports.getFieldGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('field_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段分组不存在'
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
      message: '获取字段分组失败',
      error: error.message
    });
  }
};

// 创建字段分组
exports.createFieldGroup = async (req, res) => {
  try {
    const {
      group_name,
      group_code,
      description,
      status
    } = req.body;

    // 必填字段验证
    if (!group_name) {
      return res.status(400).json({
        success: false,
        message: 'group_name 为必填字段'
      });
    }

    if (!group_code) {
      return res.status(400).json({
        success: false,
        message: 'group_code 为必填字段'
      });
    }

    const insertData = {
      group_name,
      group_code,
      description: description || null,
      status: status !== undefined ? status : true,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('field_groups')
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
    console.error('创建字段分组错误:', error);
    res.status(400).json({
      success: false,
      message: '创建字段分组失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 更新字段分组
exports.updateFieldGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 移除不应该被更新的字段
    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('field_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段分组不存在'
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
      message: '更新字段分组失败',
      error: error.message
    });
  }
};

// 删除字段分组
exports.deleteFieldGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有关联的字段定义
    const { data: fields, error: checkError } = await supabase
      .from('field_definitions')
      .select('id')
      .eq('group_id', id)
      .limit(1);

    if (checkError) throw checkError;

    if (fields && fields.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该分组下还有字段定义，无法删除'
      });
    }

    const { data, error } = await supabase
      .from('field_groups')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '字段分组不存在'
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
      message: '删除字段分组失败',
      error: error.message
    });
  }
};

module.exports = exports;
