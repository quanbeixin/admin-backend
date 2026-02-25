const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

// 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
};

// 获取单个用户
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
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
      message: '用户不存在',
      error: error.message
    });
  }
};

// 创建用户
exports.createUser = async (req, res) => {
  try {
    const userData = req.body;
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
};

// 更新用户
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: '用户更新成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 必填校验
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查询用户
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码（明文，后续可以加 bcrypt）
    if (data.password !== password) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        id: data.id,
        username: data.username,
        uuid: data.uuid
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 返回用户信息（不包含密码）和 token
    const { password: _, ...userInfo } = data;

    // **关键：return 确保 Vercel Serverless 响应完整**
    return res.status(200).json({
      success: true,
      message: '登录成功',
      data: userInfo,
      token: token
    });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 验证必填字段
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和邮箱不能为空'
      });
    }

    // 检查用户名是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    // 创建新用户
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        password,
        email
      }])
      .select();

    if (error) throw error;

    // 生成 JWT token
    const token = jwt.sign(
      {
        id: data[0].id,
        username: data[0].username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 返回用户信息和 token（不包含密码）
    const { password: _, ...userInfo } = data[0];

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: userInfo,
      token: token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
};

