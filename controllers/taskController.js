const supabase = require('../config/supabase');

// 获取所有任务
exports.getAllTasks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
      error: error.message
    });
  }
};

// 获取当前用户的任务
exports.getMyTasks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('created_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取我的任务列表失败',
      error: error.message
    });
  }
};

// 获取单个任务
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: '任务不存在',
      error: error.message
    });
  }
};

// 创建任务
exports.createTask = async (req, res) => {
  try {
    // 验证 priority 字段
    if (req.body.priority && ![1, 2, 3, 4, 5].includes(req.body.priority)) {
      return res.status(400).json({
        success: false,
        message: 'priority 必须是 1~5 之间的整数'
      });
    }

    const taskData = {
      ...req.body,
      created_by: req.user.id,
      assigned_to: req.body.assigned_to || req.user.id  // 如果没有指定分配对象，默认分配给创建者
    };

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert([taskData])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建任务失败',
      error: error.message
    });
  }
};

// 更新任务
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = req.body;
    const { data, error } = await supabase
      .from('daily_tasks')
      .update(taskData)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: '任务更新成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新任务失败',
      error: error.message
    });
  }
};

// 删除任务
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('daily_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '任务删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '删除任务失败',
      error: error.message
    });
  }
};
