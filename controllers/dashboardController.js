const supabase = require('../config/supabase');

// 获取所有仪表盘
exports.getAllDashboards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dashboards')
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
      message: '获取仪表盘列表失败',
      error: error.message
    });
  }
};

// 获取单个仪表盘
exports.getDashboardById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('dashboards')
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
      message: '仪表盘不存在',
      error: error.message
    });
  }
};

// 创建仪表盘
exports.createDashboard = async (req, res) => {
  try {
    const { name, description, layout, config } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name 为必填字段'
      });
    }

    const { data, error } = await supabase
      .from('dashboards')
      .insert([{ name, description, layout, config }])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '仪表盘创建成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建仪表盘失败',
      error: error.message
    });
  }
};

// 更新仪表盘
exports.updateDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, layout, config } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (layout !== undefined) updateData.layout = layout;
    if (config !== undefined) updateData.config = config;

    const { data, error } = await supabase
      .from('dashboards')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: '仪表盘更新成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新仪表盘失败',
      error: error.message
    });
  }
};

// 删除仪表盘
exports.deleteDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '仪表盘删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '删除仪表盘失败',
      error: error.message
    });
  }
};

// 获取图表可用字段/维度
exports.getFields = async (req, res) => {
  try {
    const fields = [
      { key: 'id', label: 'ID', type: 'number' },
      { key: 'name', label: '仪表盘名称', type: 'string' },
      { key: 'description', label: '描述', type: 'string' },
      { key: 'created_at', label: '创建时间', type: 'datetime' },
      { key: 'updated_at', label: '更新时间', type: 'datetime' }
    ];

    res.json({
      success: true,
      data: fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取字段列表失败',
      error: error.message
    });
  }
};
