const supabase = require('../config/supabase');
const { analyzeUnprocessedFeedback, analyzeSingleFeedback } = require('../services/feedbackAnalysisService');

const FEEDBACK_BATCH_SIZE = 1000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseBoolean(value) {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return null;
}

function escapeSearchText(value) {
  return String(value).replace(/[%_,()]/g, ' ').trim();
}

function applyFeedbackFilters(query, filters) {
  const {
    searchText,
    product,
    status,
    isNewRequest,
    aiCategory,
    dateStart,
    dateEnd
  } = filters;

  if (searchText) {
    const escapedText = escapeSearchText(searchText);

    if (escapedText) {
      query = query.or([
        `user_email.ilike.%${escapedText}%`,
        `user_question.ilike.%${escapedText}%`,
        `user_question_cn.ilike.%${escapedText}%`,
        `ai_reply.ilike.%${escapedText}%`,
        `ai_reply_en.ilike.%${escapedText}%`,
        `product.ilike.%${escapedText}%`,
        `ai_category.ilike.%${escapedText}%`
      ].join(','));
    }
  }

  if (product) {
    query = query.eq('product', product);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (typeof isNewRequest === 'boolean') {
    query = query.eq('is_new_request', isNewRequest);
  }

  if (aiCategory) {
    query = query.eq('ai_category', aiCategory);
  }

  if (dateStart) {
    query = query.gte('date', dateStart);
  }

  if (dateEnd) {
    query = query.lte('date', dateEnd);
  }

  return query;
}

function hasPagedQuery(query) {
  return [
    'page',
    'pageSize',
    'searchText',
    'product',
    'status',
    'isNewRequest',
    'aiCategory',
    'dateStart',
    'dateEnd'
  ].some((key) => query[key] !== undefined);
}

async function fetchAllFeedback() {
  const allFeedback = [];
  let from = 0;

  while (true) {
    const to = from + FEEDBACK_BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    if (!data || data.length === 0) {
      break;
    }

    allFeedback.push(...data);

    if (data.length < FEEDBACK_BATCH_SIZE) {
      break;
    }

    from += FEEDBACK_BATCH_SIZE;
  }

  return allFeedback;
}

// 获取所有反馈
exports.getAllFeedback = async (req, res) => {
  try {
    if (hasPagedQuery(req.query)) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const pageSize = Math.min(
        Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE
      );
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const isNewRequest = parseBoolean(req.query.isNewRequest);

      let query = supabase
        .from('feedback')
        .select('*', { count: 'exact' });

      query = applyFeedbackFilters(query, {
        searchText: req.query.searchText,
        product: req.query.product,
        status: req.query.status,
        isNewRequest,
        aiCategory: req.query.aiCategory,
        dateStart: req.query.dateStart,
        dateEnd: req.query.dateEnd
      });

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return res.json({
        success: true,
        data: data || [],
        pagination: {
          total: count || 0,
          page,
          pageSize
        }
      });
    }

    const data = await fetchAllFeedback();

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

// 批量导入反馈
exports.batchImport = async (req, res) => {
  try {
    const feedbackList = req.body;

    if (!Array.isArray(feedbackList) || feedbackList.length === 0) {
      return res.status(400).json({
        success: false,
        message: '导入数据不能为空'
      });
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackList)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `成功导入 ${data.length} 条数据`,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量导入失败',
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
