const supabase = require('../config/supabase');

// 获取 Facebook 广告投放数据（支持多条件筛选和分页）
exports.getFbAdInsights = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      companyId,
      adAccountId,
      campaignName,
      adsetName,
      adName,
      brand,
      platform,
      region,
      appType,
      device,
      page = 1,
      pageSize = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // 计算分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('fb_ad_insights')
      .select('*', { count: 'exact' });

    // 日期范围筛选
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // 公司和账户筛选
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (adAccountId) {
      query = query.eq('ad_account_id', adAccountId);
    }

    // 广告层级筛选
    if (campaignName) {
      query = query.ilike('campaign_name', `%${campaignName}%`);
    }
    if (adsetName) {
      query = query.ilike('adset_name', `%${adsetName}%`);
    }
    if (adName) {
      query = query.ilike('ad_name', `%${adName}%`);
    }

    // 维度筛选
    if (brand) {
      query = query.eq('brand', brand);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }
    if (region) {
      query = query.eq('region', region);
    }
    if (appType) {
      query = query.eq('app_type', appType);
    }
    if (device) {
      query = query.eq('device', device);
    }

    // 排序
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // 分页
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count
      }
    });
  } catch (error) {
    console.error('获取 Facebook 广告数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取 Facebook 广告数据失败',
      error: error.message
    });
  }
};

// 获取 Facebook 广告数据统计汇总
exports.getFbAdInsightsStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      companyId,
      adAccountId,
      groupBy = 'date' // 可选: date, campaign_name, brand, platform, region 等
    } = req.query;

    let query = supabase
      .from('fb_ad_insights')
      .select('*');

    // 日期范围筛选
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // 公司和账户筛选
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (adAccountId) {
      query = query.eq('ad_account_id', adAccountId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 按指定维度聚合数据
    const aggregated = data.reduce((acc, item) => {
      const key = item[groupBy] || '未分类';
      if (!acc[key]) {
        acc[key] = {
          groupKey: key,
          impressions: 0,
          clicks: 0,
          spend: 0,
          reach: 0,
          count: 0
        };
      }
      acc[key].impressions += parseInt(item.impressions || 0);
      acc[key].clicks += parseInt(item.clicks || 0);
      acc[key].spend += parseFloat(item.spend || 0);
      acc[key].reach += parseInt(item.reach || 0);
      acc[key].count += 1;
      return acc;
    }, {});

    // 计算汇总指标
    const result = Object.values(aggregated).map(item => ({
      ...item,
      ctr: item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : 0,
      cpc: item.clicks > 0 ? (item.spend / item.clicks).toFixed(2) : 0,
      cpm: item.impressions > 0 ? ((item.spend / item.impressions) * 1000).toFixed(2) : 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取 Facebook 广告统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取 Facebook 广告统计数据失败',
      error: error.message
    });
  }
};

// 获取筛选维度的可选值列表
exports.getFbAdInsightsFilters = async (req, res) => {
  try {
    const { field } = req.query; // 可选: brand, platform, region, app_type, device

    if (!field) {
      return res.status(400).json({
        success: false,
        message: '请指定要查询的字段'
      });
    }

    const { data, error } = await supabase
      .from('fb_ad_insights')
      .select(field)
      .not(field, 'is', null);

    if (error) throw error;

    // 去重
    const uniqueValues = [...new Set(data.map(item => item[field]))].filter(Boolean);

    res.json({
      success: true,
      data: uniqueValues
    });
  } catch (error) {
    console.error('获取筛选维度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取筛选维度失败',
      error: error.message
    });
  }
};

// 获取广告系列列表
exports.getCampaigns = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fb_ad_insights')
      .select('campaign_id, campaign_name')
      .not('campaign_name', 'is', null);

    if (error) throw error;

    // 去重
    const campaigns = [...new Map(data.map(item => [item.campaign_id, item])).values()];

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('获取广告系列列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取广告系列列表失败',
      error: error.message
    });
  }
};

module.exports = exports;
