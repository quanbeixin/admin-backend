const express = require('express');
const router = express.Router();
const { syncAllAccounts, previewMetaData } = require('../services/metaSync');

// POST /api/meta/sync-insights - 同步 Meta Insights 数据
router.post('/sync-insights', async (req, res) => {
  try {
    const { since, until } = req.body;

    if (!since || !until) {
      return res.status(400).json({
        success: false,
        message: '请提供起止日期 (since, until)'
      });
    }

    console.log(`开始同步 Meta Insights 数据，日期范围: ${since} ~ ${until}...`);

    const results = await syncAllAccounts({ since, until });

    res.json({
      success: results.success,
      message: results.success
        ? `同步完成，共同步 ${results.totalSynced} 条数据`
        : '同步过程中出现错误',
      totalSynced: results.totalSynced,
      accounts: results.accounts,
      errors: results.errors.length > 0 ? results.errors : undefined
    });
  } catch (error) {
    console.error('同步接口错误:', error);
    res.status(500).json({
      success: false,
      message: '同步失败',
      error: error.message
    });
  }
});

// POST /api/meta/preview-insights - 预览 Meta Insights 数据（不写入数据库）
router.post('/preview-insights', async (req, res) => {
  try {
    const { since, until, limit = 1000 } = req.body;

    if (!since || !until) {
      return res.status(400).json({
        success: false,
        message: '请提供起止日期 (since, until)'
      });
    }

    console.log(`预览 Meta Insights 数据，日期范围: ${since} ~ ${until}，每个账户最多 ${limit} 条...`);

    const results = await previewMetaData({ since, until }, limit);

    res.json({
      success: results.success,
      message: results.success
        ? `预览成功，共获取 ${results.totalCount} 条数据`
        : '预览失败',
      totalCount: results.totalCount,
      accounts: results.accounts,
      errors: results.errors.length > 0 ? results.errors : undefined
    });
  } catch (error) {
    console.error('预览接口错误:', error);
    res.status(500).json({
      success: false,
      message: '预览失败',
      error: error.message
    });
  }
});

module.exports = router;
