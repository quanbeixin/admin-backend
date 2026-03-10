const supabase = require('../config/supabase');

// GET /api/trends/hot-topics
exports.getHotTopics = async (req, res) => {
  try {
    const { platform, limit = 20, days } = req.query;

    let query = supabase
      .from('trend_hot_topics')
      .select('*')
      .order('score', { ascending: false })
      .limit(Number(limit));

    if (platform) query = query.eq('platform', platform);

    if (days) {
      const since = new Date(Date.now() - Number(days) * 86400000).toISOString();
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, total: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取热点话题失败', error: error.message });
  }
};

// GET /api/trends/today
exports.getToday = async (req, res) => {
  try {
    const { platform, limit = 50 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from('trend_posts')
      .select('*')
      .gte('crawl_time', today.toISOString())
      .order('views', { ascending: false })
      .limit(Number(limit));

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, total: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取今日热门数据失败', error: error.message });
  }
};
