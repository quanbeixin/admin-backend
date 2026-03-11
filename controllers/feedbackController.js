const supabase = require('../config/supabase');
const { analyzeUnprocessedFeedback, analyzeSingleFeedback } = require('../services/feedbackAnalysisService');

// 获取所有反馈
exports.getAllFeedback = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
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
      message: '获取反馈列表失败',
      error: error.message
    });
  }
};

// 获取单个反馈
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('feedback')
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
      message: '反馈不存在',
      error: error.message
    });
  }
};

// 创建反馈
exports.createFeedback = async (req, res) => {
  try {
    const feedbackData = req.body;

    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '反馈创建成功',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建反馈失败',
      error: error.message
    });
  }
};

// 更新反馈
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: '反馈更新成功',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新反馈失败',
      error: error.message
    });
  }
};

// 删除反馈
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '反馈删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除反馈失败',
      error: error.message
    });
  }
};

// 更新反馈状态
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: '状态更新成功',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message
    });
  }
};

// 批量更新反馈状态
exports.batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    const { data, error } = await supabase
      .from('feedback')
      .update({ status })
      .in('id', ids)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: '批量更新成功',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量更新失败',
      error: error.message
    });
  }
};

// AI 分析未处理的反馈
exports.analyzeUnprocessed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await analyzeUnprocessedFeedback(limit);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI 分析失败',
      error: error.message
    });
  }
};

// AI 分析单条反馈
exports.analyzeSingle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await analyzeSingleFeedback(id);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI 分析失败',
      error: error.message
    });
  }
};
