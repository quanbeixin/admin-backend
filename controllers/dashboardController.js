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
      { name: 'report_date', label: '统计日期', type: 'date' },
      { name: 'ad_id', label: '广告ID', type: 'string' },
      { name: 'campaign_name', label: '广告系列名称', type: 'string' },
      { name: 'spent_amount', label: '已花金额', type: 'number' },
      { name: 'impressions', label: '展示次数', type: 'number' },
      { name: 'cpm', label: '千次展示费用', type: 'number' },
      { name: 'clicks', label: '点击量', type: 'number' },
      { name: 'ctr', label: '点击率', type: 'number' },
      { name: 'cpc', label: '单次点击费用', type: 'number' },
      { name: 'installs', label: '应用安装', type: 'number' },
      { name: 'cpi', label: '单次安装费用', type: 'number' },
      { name: 'subscriptions', label: '订阅次数', type: 'number' },
      { name: 'cps', label: '单次订阅费用', type: 'number' },
      { name: 'video_play_3s', label: '3秒视频播放', type: 'number' }
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
