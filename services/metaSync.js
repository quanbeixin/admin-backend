const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const supabase = require('../config/supabase');

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// 代理配置
const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : null;

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 获取日期范围（支持传入具体日期或天数）
function getDateRange(params) {
  // 如果传入了 since 和 until，直接使用
  if (params && params.since && params.until) {
    return {
      since: params.since,
      until: params.until
    };
  }

  // 否则使用天数计算（向后兼容）
  const days = params?.days || 3;
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return {
    since: formatDate(startDate),
    until: formatDate(endDate)
  };
}

// 解析 campaign_name，按下划线分割
function parseCampaignName(campaignName) {
  if (!campaignName) {
    return {
      brand: null,
      platform: null,
      region: null,
      app_type: null,
      device: null,
      extra_description: null
    };
  }

  const parts = campaignName.split('_');

  return {
    brand: parts[0] || null,
    platform: parts[1] || null,
    region: parts[2] || null,
    app_type: parts[3] || null,
    device: parts[4] || null,
    extra_description: parts.slice(5).join('_') || null
  };
}

// 转换数据类型
function parseInsightData(insight, companyId, adAccountId) {
  // 解析 campaign_name
  const campaignFields = parseCampaignName(insight.campaign_name);

  return {
    company_id: companyId,
    ad_account_id: adAccountId,
    date: insight.date_start,
    campaign_id: insight.campaign_id || null,
    campaign_name: insight.campaign_name || null,
    // campaign_name 切割字段
    brand: campaignFields.brand,
    platform: campaignFields.platform,
    region: campaignFields.region,
    app_type: campaignFields.app_type,
    device: campaignFields.device,
    extra_description: campaignFields.extra_description,
    // 原有字段
    adset_id: insight.adset_id || null,
    adset_name: insight.adset_name || null,
    ad_id: insight.ad_id || null,
    ad_name: insight.ad_name || null,
    impressions: parseInt(insight.impressions) || 0,
    clicks: parseInt(insight.clicks) || 0,
    spend: parseFloat(insight.spend) || 0,
    cpm: parseFloat(insight.cpm) || 0,
    cpc: parseFloat(insight.cpc) || 0,
    ctr: parseFloat(insight.ctr) || 0,
    reach: parseInt(insight.reach) || 0,
    conversions: insight.conversions || null,
    conversion_values: insight.conversion_values || null,
    cost_per_action_type: insight.cost_per_action_type || null,
    actions: insight.actions || null,
    created_at: new Date().toISOString()
  };
}

// 获取单个账户的 Insights 数据（支持分页）
async function fetchAccountInsights(accountId, accessToken, dateRange) {
  const allInsights = [];
  let nextUrl = null;

  const fields = [
    "campaign_id",
    "campaign_name",
    "account_id",
    "account_name",
    "account_currency",
    "impressions",
    "clicks",
    "spend",
    "ctr",
    "cpc",
    "cpm",
    "reach",
    "frequency",
    "conversions",
    "conversion_values",
    "cost_per_action_type",
    "actions"
  ].join(',');

  const initialUrl = `${META_API_BASE}/act_${accountId}/insights`;
  const params = {
    access_token: accessToken,
    fields: fields,
    time_range: JSON.stringify({
      since: dateRange.since,
      until: dateRange.until
    }),
    level: 'campaign',
  };

  try {
    // 第一次请求
    const response = await axios.get(initialUrl, {
      params,
      ...(proxyAgent && { httpsAgent: proxyAgent, proxy: false })
    });

    if (response.data.data) {
      allInsights.push(...response.data.data);
    }

    // 处理分页
    nextUrl = response.data.paging?.next;

    while (nextUrl) {
      const nextResponse = await axios.get(nextUrl, {
        ...(proxyAgent && { httpsAgent: proxyAgent, proxy: false })
      });

      if (nextResponse.data.data) {
        allInsights.push(...nextResponse.data.data);
      }

      nextUrl = nextResponse.data.paging?.next;

      // 防止无限循环
      if (allInsights.length > 10000) {
        console.warn(`账户 ${accountId} 数据量过大，已达到 10000 条限制`);
        break;
      }
    }

    return allInsights;
  } catch (error) {
    throw new Error(`Meta API 请求失败: ${error.message}`);
  }
}

// 批量 upsert 原始数据到数据库
async function upsertRawInsights(rawInsights) {
  if (!rawInsights || rawInsights.length === 0) {
    return { count: 0 };
  }

  const { data, error } = await supabase
    .from('fb_ad_insights_raw')
    .upsert(rawInsights, {
      onConflict: 'ad_account_id,campaign_id,date_start',
      ignoreDuplicates: false
    });

  if (error) {
    throw new Error(`原始数据写入失败: ${error.message}`);
  }

  return { count: rawInsights.length, data };
}

// 批量 upsert 广告数据到数据库
async function upsertInsights(insights) {
  if (!insights || insights.length === 0) {
    return { count: 0 };
  }

  const { data, error } = await supabase
    .from('fb_ad_insights')
    .upsert(insights, {
      onConflict: 'ad_account_id,campaign_id,date',
      ignoreDuplicates: false
    });

  if (error) {
    throw new Error(`数据库写入失败: ${error.message}`);
  }

  return { count: insights.length, data };
}

// 同步所有账户的 Insights 数据
async function syncAllAccounts(params) {
  const dateRange = getDateRange(params);
  const results = {
    success: true,
    totalSynced: 0,
    accounts: [],
    errors: []
  };

  try {
    // 获取所有活跃的广告账户
    const { data: accounts, error: fetchError } = await supabase
      .from('fb_ad_accounts')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      throw new Error(`获取广告账户失败: ${fetchError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        totalSynced: 0,
        message: '没有找到活跃的广告账户',
        accounts: []
      };
    }

    console.log(`开始同步 ${accounts.length} 个广告账户，日期范围: ${dateRange.since} ~ ${dateRange.until}`);

    // 生成同步批次ID
    const syncBatchId = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // 逐个同步账户
    for (const account of accounts) {
      const accountResult = {
        accountId: account.account_id,
        accountName: account.account_name,
        synced: 0,
        error: null
      };

      try {
        // 获取 Meta Insights 数据
        const insights = await fetchAccountInsights(
          account.account_id,
          account.access_token,
          dateRange
        );

        if (insights.length > 0) {
          // 1. 先写入原始数据
          const rawInsights = insights.map(insight => ({
            company_id: account.company_id,
            ad_account_id: account.id,
            raw_data: insight,
            date_start: insight.date_start,
            campaign_id: insight.campaign_id || null,
            ad_id: insight.ad_id || null,
            sync_batch_id: syncBatchId
          }));

          await upsertRawInsights(rawInsights);

          // 2. 再写入处理后的数据
          const parsedInsights = insights.map(insight =>
            parseInsightData(insight, account.company_id, account.id)
          );

          const { count } = await upsertInsights(parsedInsights);
          accountResult.synced = count;
          results.totalSynced += count;

          console.log(`✓ 账户 ${account.account_name} 同步成功: ${count} 条 (批次: ${syncBatchId})`);
        } else {
          console.log(`- 账户 ${account.account_name} 无数据`);
        }
      } catch (error) {
        accountResult.error = error.message;
        results.errors.push({
          accountId: account.account_id,
          accountName: account.account_name,
          error: error.message
        });
        console.error(`✗ 账户 ${account.account_name} 同步失败:`, error.message);
      }

      results.accounts.push(accountResult);
    }

    // 如果所有账户都失败，标记为失败
    if (results.errors.length === accounts.length) {
      results.success = false;
    }

    return results;
  } catch (error) {
    console.error('同步过程发生错误:', error);
    return {
      success: false,
      totalSynced: 0,
      message: error.message,
      accounts: [],
      errors: [{ error: error.message }]
    };
  }
}

// 预览 Meta 数据（不写入数据库）
async function previewMetaData(params, limit = 100) {
  const dateRange = getDateRange(params);
  const results = {
    success: true,
    totalCount: 0,
    accounts: [],
    errors: []
  };

  try {
    // 获取所有活跃的广告账户
    const { data: accounts, error: fetchError } = await supabase
      .from('fb_ad_accounts')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      throw new Error(`获取广告账户失败: ${fetchError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        totalCount: 0,
        message: '没有找到活跃的广告账户',
        accounts: []
      };
    }

    console.log(`开始预览 ${accounts.length} 个广告账户，日期范围: ${dateRange.since} ~ ${dateRange.until}`);

    // 逐个获取账户数据
    for (const account of accounts) {
      const accountResult = {
        accountId: account.account_id,
        accountName: account.account_name,
        companyId: account.company_id,
        dataCount: 0,
        sampleData: [],
        error: null
      };

      try {
        // 获取 Meta Insights 数据
        const insights = await fetchAccountInsights(
          account.account_id,
          account.access_token,
          dateRange
        );

        if (insights.length > 0) {
          accountResult.dataCount = insights.length;

          // 只取前 N 条作为样本数据
          const sampleInsights = insights.slice(0, limit);

          // 返回原始数据和处理后的数据
          accountResult.sampleData = sampleInsights;
          accountResult.processedData = sampleInsights.map(insight =>
            parseInsightData(insight, account.company_id, account.id)
          );

          results.totalCount += insights.length;

          console.log(`✓ 账户 ${account.account_name} 预览成功: ${insights.length} 条数据`);
        } else {
          console.log(`- 账户 ${account.account_name} 无数据`);
        }
      } catch (error) {
        accountResult.error = error.message;
        results.errors.push({
          accountId: account.account_id,
          accountName: account.account_name,
          error: error.message
        });
        console.error(`✗ 账户 ${account.account_name} 预览失败:`, error.message);
      }

      results.accounts.push(accountResult);
    }

    // 如果所有账户都失败，标记为失败
    if (results.errors.length === accounts.length) {
      results.success = false;
    }

    return results;
  } catch (error) {
    console.error('预览过程发生错误:', error);
    return {
      success: false,
      totalCount: 0,
      message: error.message,
      accounts: [],
      errors: [{ error: error.message }]
    };
  }
}

module.exports = {
  syncAllAccounts,
  previewMetaData,
  fetchAccountInsights,
  getDateRange
};
