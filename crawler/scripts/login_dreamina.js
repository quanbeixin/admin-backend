/**
 * 一次性登录脚本
 * 运行：node crawler/scripts/login_dreamina.js
 *
 * 会打开一个真实浏览器窗口，手动完成登录后按回车，
 * session 自动保存到 crawler/sessions/dreamina.json，后续爬虫自动复用。
 */

require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const SESSION_PATH = path.resolve(__dirname, '../sessions/dreamina.json');
const PROXY = process.env.PROXY_URL || null;

async function main() {
  const launchOptions = {
    headless: false, // 必须有界面，方便手动操作
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  };
  if (PROXY) launchOptions.proxy = { server: PROXY };

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  await page.goto('https://dreamina.capcut.com/ai-tool/explore', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  console.log('\n========================================');
  console.log('浏览器已打开，请手动完成登录操作。');
  console.log('登录成功后，回到此终端按回车保存 session。');
  console.log('========================================\n');

  // 等待用户手动登录
  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('登录完成后按回车键...', () => {
      rl.close();
      resolve();
    });
  });

  // 保存 session（cookies + localStorage）
  const state = await context.storageState();
  fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true });
  fs.writeFileSync(SESSION_PATH, JSON.stringify(state, null, 2));

  console.log(`\nSession 已保存到 ${SESSION_PATH}`);
  console.log('现在可以运行 node crawler/run.js 进行爬取。\n');

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
