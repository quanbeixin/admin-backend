require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// 测试 Supabase 连接
// =========================
(async () => {
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    console.log('Supabase 连接成功');
  } catch (err) {
    console.error('Supabase 连接失败:', err.message);
  }
})();

// =========================
// CORS 配置
// =========================
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://admin-web-one-green.vercel.app']   // 生产前端域名
  : ['http://localhost:5173', 'http://127.0.0.1:5173']; // 开发前端域名

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // 允许发送 cookie
};

// 全局 CORS 中间件
app.use(cors(corsOptions));

// Express 会自动处理 OPTIONS 预检请求，无需再写 app.options('*', ...)

// =========================
// 中间件
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// 路由
// =========================
app.use('/', routes);
console.log('路由已加载');

// =========================
// 404 处理
// =========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// =========================
// 错误处理中间件
// =========================
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =========================
// 启动服务器
// =========================
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, supabase };