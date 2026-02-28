require('dotenv').config();
const express = require('express');
const supabase = require('./config/supabase');
const routes = require('./routes');

const app = express();

// =========================
// 测试 Supabase 连接
// =========================
(async () => {
  try {
    const { data } = await supabase.from('_test').select('*').limit(1);
    console.log('Supabase 连接成功');
  } catch (err) {
    console.error('Supabase 连接失败:', err.message);
  }
})();

// =========================
// 自定义 CORS 中间件
// =========================
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://admin-web-one-green.vercel.app'] // 生产前端域名
  : ['http://localhost:5173', 'http://127.0.0.1:5173']; // 开发前端域名

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // 支持 cookie/token
  }

  // OPTIONS 预检请求直接返回 200 并结束
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// =========================
// 中间件
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// 路由
// =========================
app.use('/api', routes);
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
// 启动服务器（仅本地开发用）
// =========================
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  });
}

// =========================
// Vercel Serverless 入口
// =========================
module.exports = app;