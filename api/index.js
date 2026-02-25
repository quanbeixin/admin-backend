const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const routes = require("../routes/index"); // 导入原有路由

const app = express();

// CORS 中间件
const allowedOrigins = [
  'https://admin-web-one-green.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 挂载路由
app.use("/api", routes);

// 必须导出 app，不能 app.listen
module.exports = app;