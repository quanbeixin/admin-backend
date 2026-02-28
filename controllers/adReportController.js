const supabase = require('../config/supabase');

// 获取广告数据（支持日期范围筛选）
exports.getAdReports = async (req, res) => {
  try {
    const { startDate, endDate, limit = 1000 } = req.query;

    let query = supabase
      .from('ad_metrics')
      .select('*')
      .order('report_date', { ascending: false });

    // 如果提供了日期范围，添加筛选
    if (startDate) {
      query = query.gte('report_date', startDate);
    }
    if (endDate) {
      query = query.lte('report_date', endDate);
    }

    // 限制返回数量
    query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取广告数据失败',
      error: error.message
    });
  }
};

// 获取广告数据统计（按日期聚合）
exports.getAdReportsStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'report_date' } = req.query;

    let query = supabase
      .from('ad_metrics')
      .select('*')
      .order('report_date', { ascending: true });

    if (startDate) {
      query = query.gte('report_date', startDate);
    }
    if (endDate) {
      query = query.lte('report_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 按日期聚合数据
    const aggregated = data.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) {
        acc[key] = {
          date: item.report_date,
          campaign_name: item.campaign_name || '未分类',
          spent_amount: 0,
          impressions: 0,
          clicks: 0,
          installs: 0,
          subscriptions: 0,
          cpm: 0,
          ctr: 0,
          cpc: 0,
          cpi: 0,
          cps: 0,
          video_play_3s: 0,
          count: 0
        };
      }
      acc[key].spent_amount += parseFloat(item.spent_amount || 0);
      acc[key].impressions += parseInt(item.impressions || 0);
      acc[key].clicks += parseInt(item.clicks || 0);
      acc[key].installs += parseInt(item.installs || 0);
      acc[key].subscriptions += parseInt(item.subscriptions || 0);
      acc[key].cpm += parseFloat(item.cpm || 0);
      acc[key].ctr += parseFloat(item.ctr || 0);
      acc[key].cpc += parseFloat(item.cpc || 0);
      acc[key].cpi += parseFloat(item.cpi || 0);
      acc[key].cps += parseFloat(item.cps || 0);
      acc[key].video_play_3s += parseInt(item.video_play_3s || 0);
      acc[key].count += 1;
      return acc;
    }, {});

    // 计算平均值
    const result = Object.values(aggregated).map(item => ({
      ...item,
      cpm: item.count > 0 ? (item.cpm / item.count).toFixed(2) : 0,
      ctr: item.count > 0 ? (item.ctr / item.count).toFixed(4) : 0,
      cpc: item.count > 0 ? (item.cpc / item.count).toFixed(2) : 0,
      cpi: item.count > 0 ? (item.cpi / item.count).toFixed(2) : 0,
      cps: item.count > 0 ? (item.cps / item.count).toFixed(2) : 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取广告统计数据失败',
      error: error.message
    });
  }
};

// 获取广告活动列表
exports.getCampaigns = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ad_metrics')
      .select('campaign_name')
      .not('campaign_name', 'is', null);

    if (error) throw error;

    // 去重
    const campaigns = [...new Set(data.map(item => item.campaign_name))];

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取广告活动列表失败',
      error: error.message
    });
  }
};

module.exports = exports;
