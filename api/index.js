const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

// Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 导入路由
const routes = require("../routes/index");
app.use("/api", routes);

// Vercel Serverless 导出
module.exports = app;