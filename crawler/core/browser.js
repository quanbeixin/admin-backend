const { chromium } = require('playwright');
const config = require('./config');
const logger = require('./logger').child('browser');

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    logger.info('Launching browser...');
    browserInstance = await chromium.launch({
      headless: config.browser.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

async function newPage() {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: config.browser.userAgent,
    viewport: config.browser.viewport,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(config.browser.timeout);
  return page;
}

async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.info('Browser closed.');
  }
}

module.exports = { getBrowser, newPage, closeBrowser };
