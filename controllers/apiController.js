const supabase = require('../config/supabase');

// 健康检查
exports.healthCheck = (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
};

// API 欢迎信息
exports.welcome = (req, res) => {
  res.json({
    message: '欢迎使用后台管理系统 API',
    version: '1.0.0'
  });
};

// 数据库连接测试
exports.dbTest = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('now');
    if (error) throw error;

    res.json({
      success: true,
      message: 'Supabase 连接正常',
      timestamp: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Supabase 连接失败',
      error: error.message
    });
  }
};
