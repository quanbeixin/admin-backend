const supabase = require('../config/supabase');

// 获取广告创意列表（支持分页和筛选）
exports.getAdCreatives = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      topic,
      status,
      stage,
      creative_type,
      platform,
      review_status
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('ad_creatives')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // 筛选条件
    if (topic) {
      query = query.ilike('topic', `%${topic}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (stage) {
      query = query.eq('stage', stage);
    }
    if (creative_type) {
      query = query.eq('creative_type', creative_type);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }
    if (review_status) {
      query = query.eq('review_status', review_status);
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
    console.error('获取广告创意列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取广告创意列表失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 获取单个广告创意
exports.getAdCreativeById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ad_creatives')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '广告创意不存在'
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
      message: '获取广告创意失败',
      error: error.message
    });
  }
};

// 创建广告创意
exports.createAdCreative = async (req, res) => {
  try {
    console.log('=== 创建广告创意请求 ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);

    const {
      topic,
      filter_short_link,
      description,
      reference_assets,
      prompt,
      idea_id,
      stage,
      creative_type,
      file_url,
      cover_url,
      width,
      height,
      duration,
      file_size,
      tags,
      status,
      review_status,
      review_comment,
      reviewed_by,
      reviewed_at,
      version,
      parent_id,
      platform,
      ad_account_id,
      campaign_id,
      ad_group_id,
      conversion_goal,
      engagement_target,
      priority,
      created_by,
      updated_by
    } = req.body;

    // 必填字段验证
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'topic 为必填字段'
      });
    }

    if (!creative_type) {
      return res.status(400).json({
        success: false,
        message: 'creative_type 为必填字段'
      });
    }

    // 构建插入数据，只包含有值的字段
    const userId = req.user?.id ? String(req.user.id) : (created_by || 'system');
    console.log('使用的 userId:', userId);

    const insertData = {
      topic,
      creative_type, // 必填字段
      stage: stage || 'draft',
      status: status || 'active',
      review_status: review_status || 'pending',
      version: version || 1,
      priority: priority !== undefined ? parseInt(priority) : 0,
      created_by: userId, // 转换为字符串
      updated_by: userId, // 转换为字符串
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 添加可选字段（只在有值时添加）
    if (filter_short_link) insertData.filter_short_link = filter_short_link;
    if (description) insertData.description = description;
    if (reference_assets) insertData.reference_assets = reference_assets;
    if (prompt) insertData.prompt = prompt;
    if (idea_id) insertData.idea_id = idea_id;
    if (file_url) insertData.file_url = file_url;
    if (cover_url) insertData.cover_url = cover_url;
    if (width) insertData.width = parseInt(width);
    if (height) insertData.height = parseInt(height);
    if (duration) insertData.duration = parseInt(duration);
    if (file_size) insertData.file_size = parseInt(file_size);
    if (tags) insertData.tags = tags;
    if (review_comment) insertData.review_comment = review_comment;
    if (reviewed_by) insertData.reviewed_by = reviewed_by;
    if (reviewed_at) insertData.reviewed_at = reviewed_at;
    if (parent_id) insertData.parent_id = parent_id;
    if (platform) insertData.platform = platform;
    if (ad_account_id) insertData.ad_account_id = ad_account_id;
    if (campaign_id) insertData.campaign_id = campaign_id;
    if (ad_group_id) insertData.ad_group_id = ad_group_id;
    if (conversion_goal) insertData.conversion_goal = conversion_goal;
    if (engagement_target) insertData.engagement_target = engagement_target;

    console.log('准备插入的数据:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('ad_creatives')
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
    console.error('创建广告创意错误:', error);
    res.status(400).json({
      success: false,
      message: '创建广告创意失败',
      error: error.message,
      details: error.details || error.hint || null
    });
  }
};

// 更新广告创意
exports.updateAdCreative = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 移除不应该被更新的字段
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    // 自动更新 updated_at 和 updated_by
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user?.id ? String(req.user.id) : null;

    const { data, error } = await supabase
      .from('ad_creatives')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '广告创意不存在'
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
      message: '更新广告创意失败',
      error: error.message
    });
  }
};

// 删除广告创意（软删除）
exports.deleteAdCreative = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ad_creatives')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id ? String(req.user.id) : null
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: '广告创意不存在或已被删除'
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
      message: '删除广告创意失败',
      error: error.message
    });
  }
};

// 批量删除广告创意（软删除）
exports.batchDeleteAdCreatives = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids 必须是非空数组'
      });
    }

    const { data, error } = await supabase
      .from('ad_creatives')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id ? String(req.user.id) : null
      })
      .in('id', ids)
      .is('deleted_at', null)
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

module.exports = exports;
