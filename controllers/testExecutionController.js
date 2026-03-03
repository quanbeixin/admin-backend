const supabase = require('../config/supabase');
const PlaywrightExecutor = require('../utils/playwrightExecutor');

/**
 * 触发测试执行
 */
exports.runTest = async (req, res) => {
  let executor = null;

  try {
    const { case_id, environment, username, password } = req.body;

    // 参数验证
    if (!case_id) {
      return res.status(400).json({
        success: false,
        message: 'case_id 为必填字段'
      });
    }

    // 查询测试用例
    const { data: testCase, error: caseError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('id', case_id)
      .is('deleted_at', null)
      .single();

    if (caseError || !testCase) {
      return res.status(404).json({
        success: false,
        message: '测试用例不存在'
      });
    }

    // 验证 steps 字段
    if (!testCase.steps || !Array.isArray(testCase.steps)) {
      return res.status(400).json({
        success: false,
        message: '测试用例的 steps 字段无效'
      });
    }

    // 创建测试任务记录
    const { data: task, error: taskError } = await supabase
      .from('test_tasks')
      .insert([{
        case_id: case_id,
        triggered_by: req.user?.id ? String(req.user.id) : 'system',
        status: 'running',
        environment: environment || 'default',
        start_time: new Date().toISOString(),
        log: { username, password, message: '测试开始执行' }
      }])
      .select()
      .single();

    if (taskError) {
      throw new Error('创建测试任务失败: ' + taskError.message);
    }

    // 异步执行测试（不阻塞响应）
    executeTestAsync(task.id, testCase, { username, password, environment }).catch(err => {
      console.error(`测试任务 ${task.id} 异步执行失败:`, err);
    });

    // 立即返回任务ID
    res.status(201).json({
      success: true,
      data: {
        task_id: task.id,
        status: 'running',
        message: '测试任务已创建，正在执行中'
      }
    });

  } catch (error) {
    console.error('触发测试执行错误:', error);
    res.status(500).json({
      success: false,
      message: '触发测试执行失败',
      error: error.message
    });
  }
};

/**
 * 异步执行测试任务
 */
async function executeTestAsync(taskId, testCase, params) {
  let executor = null;

  try {
    console.log(`[测试任务 ${taskId}] 开始执行`);
    console.log(`[测试任务 ${taskId}] 测试用例:`, testCase.name);
    console.log(`[测试任务 ${taskId}] 步骤数量:`, testCase.steps?.length || 0);

    // 初始化 Playwright 执行器
    console.log(`[测试任务 ${taskId}] 初始化 Playwright...`);
    executor = new PlaywrightExecutor();
    await executor.init();
    console.log(`[测试任务 ${taskId}] Playwright 初始化成功`);

    // 处理步骤中的变量替换（如 username, password）
    const steps = testCase.steps.map(step => {
      let processedStep = { ...step };
      if (step.value && typeof step.value === 'string') {
        processedStep.value = step.value
          .replace('{{username}}', params.username || '')
          .replace('{{password}}', params.password || '');
      }
      return processedStep;
    });

    // 执行所有步骤
    console.log(`[测试任务 ${taskId}] 开始执行 ${steps.length} 个步骤`);
    const stepResults = await executor.executeSteps(steps);
    console.log(`[测试任务 ${taskId}] 步骤执行完成，结果数量:`, stepResults.length);

    // 保存每个步骤的执行记录到 test_steps 表
    for (const stepResult of stepResults) {
      await supabase.from('test_steps').insert([{
        task_id: taskId,
        ...stepResult
      }]);
    }

    // 判断任务整体状态
    const failedSteps = stepResults.filter(r => r.status === 'failed');
    const taskStatus = failedSteps.length > 0 ? 'failed' : 'success';

    // 生成测试报告
    const report = {
      total_steps: stepResults.length,
      success_steps: stepResults.filter(r => r.status === 'success').length,
      failed_steps: failedSteps.length,
      execution_time: null,
      failed_step_details: failedSteps.map(s => ({
        step_order: s.step_order,
        action: s.action,
        error: s.error
      }))
    };

    // 更新任务状态
    const endTime = new Date().toISOString();
    console.log(`[测试任务 ${taskId}] 更新任务状态为: ${taskStatus}`);
    const { data: updateData, error: updateError } = await supabase
      .from('test_tasks')
      .update({
        status: taskStatus,
        end_time: endTime,
        report: report
      })
      .eq('id', taskId);

    if (updateError) {
      console.error(`[测试任务 ${taskId}] 更新任务状态失败:`, updateError);
    } else {
      console.log(`[测试任务 ${taskId}] 任务状态更新成功`);
    }

    console.log(`[测试任务 ${taskId}] 执行完成，最终状态: ${taskStatus}`);

  } catch (error) {
    console.error(`[测试任务 ${taskId}] 执行异常:`, error.message);
    console.error(`[测试任务 ${taskId}] 错误堆栈:`, error.stack);

    // 更新任务为失败状态
    console.log(`[测试任务 ${taskId}] 更新任务状态为: failed (异常)`);
    const { error: failUpdateError } = await supabase
      .from('test_tasks')
      .update({
        status: 'failed',
        end_time: new Date().toISOString(),
        log: { error: error.message },
        report: { error: '执行过程中发生异常', details: error.message }
      })
      .eq('id', taskId);

    if (failUpdateError) {
      console.error(`[测试任务 ${taskId}] 更新失败状态失败:`, failUpdateError);
    } else {
      console.log(`[测试任务 ${taskId}] 失败状态更新成功`);
    }

  } finally {
    // 关闭浏览器
    if (executor) {
      await executor.close();
    }
  }
}

/**
 * 查询测试任务结果
 */
exports.getTaskResult = async (req, res) => {
  try {
    const { task_id } = req.params;

    // 查询任务信息
    const { data: task, error: taskError } = await supabase
      .from('test_tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({
        success: false,
        message: '测试任务不存在'
      });
    }

    // 查询步骤执行记录
    const { data: steps, error: stepsError } = await supabase
      .from('test_steps')
      .select('*')
      .eq('task_id', task_id)
      .order('step_order', { ascending: true });

    if (stepsError) {
      throw stepsError;
    }

    // 查询关联的测试用例信息
    const { data: testCase } = await supabase
      .from('test_cases')
      .select('id, name, description')
      .eq('id', task.case_id)
      .single();

    res.json({
      success: true,
      data: {
        task: {
          id: task.id,
          case_id: task.case_id,
          case_name: testCase?.name || null,
          status: task.status,
          environment: task.environment,
          triggered_by: task.triggered_by,
          start_time: task.start_time,
          end_time: task.end_time,
          report: task.report,
          retry_count: task.retry_count
        },
        steps: steps || []
      },
      message: '获取成功'
    });

  } catch (error) {
    console.error('查询测试任务结果错误:', error);
    res.status(500).json({
      success: false,
      message: '查询测试任务结果失败',
      error: error.message
    });
  }
};

/**
 * 查询测试任务列表（分页 + 筛选）
 */
exports.getTaskList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      environment
    } = req.query;

    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabase
      .from('test_tasks')
      .select(`
        *,
        test_cases!inner(id, name)
      `, { count: 'exact' })
      .order('start_time', { ascending: false });

    // 筛选条件
    if (status) {
      query = query.eq('status', status);
    }
    if (environment) {
      query = query.eq('environment', environment);
    }

    // 分页
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // 处理数据，计算 execution_time 和解析 report
    const list = (data || []).map(task => {
      // 计算执行时间（秒）
      let execution_time = null;
      if (task.start_time && task.end_time) {
        const start = new Date(task.start_time);
        const end = new Date(task.end_time);
        execution_time = Math.round((end - start) / 1000);
      }

      // 从 report 中解析步骤统计
      const report = task.report || {};
      const success_steps = report.success_steps || 0;
      const failed_steps = report.failed_steps || 0;
      const total_steps = report.total_steps || 0;

      return {
        id: task.id,
        case_id: task.case_id,
        case_name: task.test_cases?.name || null,
        status: task.status,
        environment: task.environment,
        triggered_by: task.triggered_by,
        start_time: task.start_time,
        end_time: task.end_time,
        execution_time,
        success_steps,
        failed_steps,
        total_steps,
        retry_count: task.retry_count
      };
    });

    res.json({
      success: true,
      data: {
        list,
        total: count
      }
    });

  } catch (error) {
    console.error('查询测试任务列表错误:', error);
    res.status(500).json({
      success: false,
      message: '查询测试任务列表失败',
      error: error.message
    });
  }
};

/**
 * 查询单个测试任务详情
 */
exports.getTaskDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询任务信息
    const { data: task, error: taskError } = await supabase
      .from('test_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({
        success: false,
        message: '测试任务不存在'
      });
    }

    // 查询关联的测试用例
    const { data: testCase, error: caseError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('id', task.case_id)
      .single();

    if (caseError) {
      console.error('查询测试用例失败:', caseError);
    }

    // 查询所有步骤记录
    const { data: steps, error: stepsError } = await supabase
      .from('test_steps')
      .select('*')
      .eq('task_id', id)
      .order('step_order', { ascending: true });

    if (stepsError) {
      throw stepsError;
    }

    // 计算执行时间
    let execution_time = null;
    if (task.start_time && task.end_time) {
      const start = new Date(task.start_time);
      const end = new Date(task.end_time);
      execution_time = Math.round((end - start) / 1000);
    }

    res.json({
      success: true,
      data: {
        task: {
          ...task,
          execution_time
        },
        case: testCase || null,
        steps: steps || []
      }
    });

  } catch (error) {
    console.error('查询测试任务详情错误:', error);
    res.status(500).json({
      success: false,
      message: '查询测试任务详情失败',
      error: error.message
    });
  }
};

module.exports = exports;
