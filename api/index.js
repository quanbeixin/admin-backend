const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const routes = require("../routes/index"); // 导入原有路由

const app = express();
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