const supabase = require('../config/supabase');

// 获取所有公司
exports.getAllCompanies = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
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
      message: '获取公司列表失败',
      error: error.message
    });
  }
};

// 获取单个公司
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('companies')
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
      message: '公司不存在',
      error: error.message
    });
  }
};

// 创建公司
exports.createCompany = async (req, res) => {
  try {
    const { name, code, status } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '公司名称不能为空'
      });
    }

    const companyData = {
      name,
      status: status || 'active',
      updated_at: new Date().toISOString()
    };

    if (code) companyData.code = code;

    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '公司创建成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建公司失败',
      error: error.message
    });
  }
};

// 更新公司
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, status } = req.body;

    const companyData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) companyData.name = name;
    if (code !== undefined) companyData.code = code;
    if (status !== undefined) companyData.status = status;

    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: '公司不存在'
      });
    }

    res.json({
      success: true,
      message: '公司更新成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新公司失败',
      error: error.message
    });
  }
};

// 删除公司
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '公司删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '删除公司失败',
      error: error.message
    });
  }
};
