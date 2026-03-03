const supabase = require('../config/supabase');

// 获取测试用例列表（支持分页和筛选）
exports.getTestCases = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      name,
      test_type,
      environment,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('test_cases')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // 筛选条件
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    if (test_type) {
      query = query.eq('test_type', test_type);
    }
    if (environment) {
      query = query.eq('environment', environment);
    }
    if (status) {
      query = query.eq('status', status);
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
    console.error('获取测试用例列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取测试用例列表失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 获取单个测试用例
exports.getTestCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '测试用例不存在'
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
      message: '获取测试用例失败',
      error: error.message
    });
  }
};

// 创建测试用例
exports.createTestCase = async (req, res) => {
  try {
    const {
      name,
      description,
      steps,
      test_type,
      environment,
      creator,
      tags
    } = req.body;

    // 必填字段验证
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name 为必填字段'
      });
    }

    if (!steps) {
      return res.status(400).json({
        success: false,
        message: 'steps 为必填字段'
      });
    }

    // 验证 steps 是否为有效的 JSON
    if (typeof steps !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'steps 必须是 JSON 对象'
      });
    }

    // 构建插入数据
    const userId = req.user?.id ? String(req.user.id) : (creator || null);

    const insertData = {
      name,
      steps,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 添加可选字段
    if (description) insertData.description = description;
    if (test_type) insertData.test_type = test_type;
    if (environment) insertData.environment = environment;
    if (userId) insertData.creator = userId;
    if (tags) insertData.tags = tags;

    const { data, error } = await supabase
      .from('test_cases')
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
    console.error('创建测试用例错误:', error);
    res.status(400).json({
      success: false,
      message: '创建测试用例失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 更新测试用例
exports.updateTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      steps,
      test_type,
      environment,
      status,
      tags
    } = req.body;

    // 构建更新数据
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // 添加需要更新的字段
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (steps !== undefined) {
      // 验证 steps 是否为有效的 JSON
      if (typeof steps !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'steps 必须是 JSON 对象'
        });
      }
      updateData.steps = steps;
    }
    if (test_type !== undefined) updateData.test_type = test_type;
    if (environment !== undefined) updateData.environment = environment;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;

    const { data, error } = await supabase
      .from('test_cases')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '测试用例不存在'
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
      message: '更新测试用例失败',
      error: error.message
    });
  }
};

// 删除测试用例（软删除）
exports.deleteTestCase = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('test_cases')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '测试用例不存在或已被删除'
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
      message: '删除测试用例失败',
      error: error.message
    });
  }
};

module.exports = exports;
