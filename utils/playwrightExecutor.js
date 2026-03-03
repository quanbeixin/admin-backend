const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;
const { uploadBufferToOSS } = require('../config/oss');

/**
 * Playwright 测试执行器
 */
class PlaywrightExecutor {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * 初始化浏览器
   */
  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    this.page = await this.context.newPage();
  }

  /**
   * 执行单个步骤
   * @param {Object} step - 步骤对象
   * @param {number} stepOrder - 步骤序号
   * @returns {Object} 执行结果
   */
  async executeStep(step, stepOrder) {
    const result = {
      step_order: stepOrder,
      action: step.action,
      selector: step.selector || null,
      value: step.value || null,
      status: 'success',
      error: null,
      screenshot: null,
      executed_at: new Date().toISOString()
    };

    // 每步超时：优先取 step.timeout，否则默认 30 秒
    const timeout = parseInt(step.timeout) || 30000;

    try {
      switch (step.action) {
        case 'goto':
          // 用 load 替代 networkidle，对 SPA 更稳定
          await this.page.goto(step.value, { waitUntil: 'load', timeout });
          break;

        case 'click':
          // locator API：自动等待元素可交互后再点击
          await this.page.locator(step.selector).click({ timeout });
          break;

        case 'fill':
          // locator API：自动等待元素可见后再填写
          await this.page.locator(step.selector).fill(step.value, { timeout });
          break;

        case 'waitForSelector': {
          // 用 locator().waitFor() 替代已废弃的 page.waitForSelector()
          const state = step.state || 'visible'; // 支持 visible / attached / hidden / detached
          await this.page.locator(step.selector).waitFor({ state, timeout });
          break;
        }

        case 'expect': {
          const locator = this.page.locator(step.selector);
          // 先等元素出现，再断言文本
          await locator.waitFor({ state: 'visible', timeout });
          if (step.value) {
            const text = await locator.textContent();
            if (!text.includes(step.value)) {
              throw new Error(`期望文本 "${step.value}" 未找到，实际文本: "${text}"`);
            }
          }
          break;
        }

        case 'waitForURL': {
          // 等待页面 URL 变为指定值（支持字符串包含匹配或正则）
          await this.page.waitForURL(step.value, { timeout });
          break;
        }

        case 'wait': {
          const waitTime = parseInt(step.value) || 1000;
          await this.page.waitForTimeout(waitTime);
          break;
        }

        default:
          throw new Error(`不支持的操作: ${step.action}`);
      }

      // 执行成功后截图
      result.screenshot = await this.takeScreenshot(stepOrder);

    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      // 失败时也截图
      result.screenshot = await this.takeScreenshot(stepOrder, 'error');
    }

    return result;
  }

  /**
   * 截图并上传到 OSS
   * @param {number} stepOrder - 步骤序号
   * @param {string} type - 截图类型
   * @returns {string} OSS 文件 URL
   */
  async takeScreenshot(stepOrder, type = 'success') {
    try {
      const timestamp = Date.now();
      const filename = `step_${stepOrder}_${type}_${timestamp}.png`;

      // 截图到 Buffer
      const screenshotBuffer = await this.page.screenshot({ fullPage: true });

      // 上传到 OSS
      const ossPath = `screenshots/${filename}`;
      const ossUrl = await uploadBufferToOSS(ossPath, screenshotBuffer);

      console.log(`截图已上传到 OSS: ${ossUrl}`);

      // 返回 OSS URL
      return ossUrl;
    } catch (error) {
      console.error('截图上传失败:', error);
      return null;
    }
  }

  /**
   * 执行测试用例的所有步骤
   * @param {Array} steps - 步骤数组
   * @returns {Array} 所有步骤的执行结果
   */
  async executeSteps(steps) {
    const results = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const result = await this.executeStep(step, i + 1);
      results.push(result);

      // 如果步骤失败，停止执行后续步骤
      if (result.status === 'failed') {
        break;
      }
    }

    return results;
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

module.exports = PlaywrightExecutor;
