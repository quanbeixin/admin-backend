const supabase = require('../config/supabase');

// 获取所有 Facebook 广告账户
exports.getAllAccounts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fb_ad_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取账户列表失败',
      error: error.message
    });
  }
};

// 获取单个 Facebook 广告账户
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('fb_ad_accounts')
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
      message: '账户不存在',
      error: error.message
    });
  }
};

// 创建 Facebook 广告账户
exports.createAccount = async (req, res) => {
  try {
    const { access_token, status } = req.body;

    // 验证必填字段
    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: 'access_token 不能为空'
      });
    }

    const accountData = {
      access_token,
      status: status || 'active',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('fb_ad_accounts')
      .insert([accountData])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '账户创建成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建账户失败',
      error: error.message
    });
  }
};

// 更新 Facebook 广告账户
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { access_token, status } = req.body;

    const accountData = {
      updated_at: new Date().toISOString()
    };

    if (access_token !== undefined) accountData.access_token = access_token;
    if (status !== undefined) accountData.status = status;

    const { data, error } = await supabase
      .from('fb_ad_accounts')
      .update(accountData)
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: '账户不存在'
      });
    }

    res.json({
      success: true,
      message: '账户更新成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新账户失败',
      error: error.message
    });
  }
};

// 删除 Facebook 广告账户
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('fb_ad_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '账户删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '删除账户失败',
      error: error.message
    });
  }
};
