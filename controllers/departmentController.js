const supabase = require('../config/supabase');

// 获取所有部门
exports.getAllDepartments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
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
      message: '获取部门列表失败',
      error: error.message
    });
  }
};

// 获取单个部门
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('departments')
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
      message: '部门不存在',
      error: error.message
    });
  }
};

// 创建部门
exports.createDepartment = async (req, res) => {
  try {
    const departmentData = req.body;
    const { data, error } = await supabase
      .from('departments')
      .insert([departmentData])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: '部门创建成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建部门失败',
      error: error.message
    });
  }
};

// 更新部门
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const departmentData = req.body;
    const { data, error } = await supabase
      .from('departments')
      .update(departmentData)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: '部门更新成功',
      data: data[0]
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新部门失败',
      error: error.message
    });
  }
};

// 删除部门
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '部门删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '删除部门失败',
      error: error.message
    });
  }
};
