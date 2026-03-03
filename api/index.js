const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const routes = require("../routes/index"); // 导入原有路由

const app = express();

// CORS 中间件 - 必须在所有其他中间件之前
const allowedOrigins = [
  'https://admin-web-one-green.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  console.log('收到请求:', req.method, req.path, '来源:', origin);

  // 设置CORS头 - 无论origin是否在列表中都设置
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    // 即使不在列表中，也设置头以便调试
    console.log('警告: 未授权的来源:', origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    console.log('处理OPTIONS预检请求');
    return res.status(204).end();
  }

  next();
});

// JSON解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 挂载路由
app.use("/api", routes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 必须导出 app，不能 app.listen
module.exports = app;