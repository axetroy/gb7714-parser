process.env.PLAYWRIGHT_DOWNLOAD_HOST = 'https://npmmirror.com/mirrors/playwright';

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_FILE = join(PROJECT_ROOT, 'scripts', 'wanfang-data.json');
const USER_DATA_DIR = join(PROJECT_ROOT, 'scripts', '.browser-data');

const ITEMS_PER_TYPE = 10;
const KEYWORD = '人工智能';

const RESOURCE_TYPES = [
  { name: '期刊论文', searchType: 'paper', filter: 'tops' },
  { name: '学位论文', searchType: 'paper', filter: 'degree' },
  { name: '会议论文', searchType: 'paper', filter: 'conf' },
  { name: '专利', searchType: 'patent', filter: null },
  { name: '科技成果', searchType: 'paper', filter: 'achieve' },
  { name: '标准', searchType: 'standard', filter: null },
  { name: '科技报告', searchType: 'report', filter: null },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

function buildUrl(rt) {
  const kw = encodeURIComponent(KEYWORD);
  let url = `https://s.wanfangdata.com.cn/${rt.searchType}?q=${kw}`;
  if (rt.filter) url += `&f=${rt.filter}`;
  return url;
}

function loadData() {
  try { return JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8')); } catch { return {}; }
}

function saveData(data) {
  writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function main() {
  if (!existsSync(USER_DATA_DIR)) mkdirSync(USER_DATA_DIR, { recursive: true });

  const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false, channel: 'chrome',
    args: ['--start-maximized'], viewport: { width: 1920, height: 1080 },
  });
  const page = ctx.pages()[0] || await ctx.newPage();

  try {
    await page.goto('https://www.wanfangdata.com.cn/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);

    // 检查登录
    const loggedIn = await page.locator('text=登录 / 注册').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (!loggedIn) {
      console.log('✅ 已登录');
    } else {
      console.log('\n请登录万方数据，登录后脚本自动继续...\n');
      while (true) {
        await sleep(2000);
        const visible = await page.locator('text=登录 / 注册').first().isVisible({ timeout: 2000 }).catch(() => false);
        if (!visible) { console.log('✅ 已登录\n'); break; }
      }
    }

    const allData = loadData();

    for (const rt of RESOURCE_TYPES) {
      if ((allData[rt.name] || []).length >= ITEMS_PER_TYPE) {
        console.log(`⏭️ ${rt.name}: 已有，跳过`);
        continue;
      }

      console.log(`\n🔍 ${rt.name}`);
      const url = buildUrl(rt);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await sleep(2000);
      } catch { console.log(`  ⚠️ 加载失败`); continue; }

      // 滚动页面
      await page.mouse.wheel(0, 300);
      await sleep(500);

      let count;
      try {
        await page.waitForSelector('.normal-list', { timeout: 8000 });
        count = await page.locator('.normal-list').count();
      } catch { console.log(`  ⚠️ 无结果`); continue; }

      let collected = 0;
      for (let i = 0; i < count && collected < ITEMS_PER_TYPE; i++) {
        try {
          // 提取标题
          const title = await page.locator('.normal-list').nth(i).locator('.title').first().textContent();
          const cleanTitle = title.trim().replace(/\s+/g, ' ');
          if (!cleanTitle) continue;

          // 去重
          if ((allData[rt.name] || []).some(e => e.title === cleanTitle)) continue;

          // 随机鼠标移动
          if (Math.random() > 0.5) {
            await page.mouse.move(200 + Math.random() * 800, 200 + Math.random() * 400);
            await sleep(100);
          }

          // 点击引用按钮 (用 JS)
          const btnClicked = await page.evaluate((idx) => {
            const btn = document.querySelectorAll('.normal-list')[idx]?.querySelector('.wf-button-quote');
            if (btn) { btn.click(); return true; }
            return false;
          }, i);

          if (!btnClicked) continue;

          // 等待弹窗
          await sleep(800);

          // 提取引文
          const citation = await page.evaluate(() => {
            for (const t of document.querySelectorAll('.export-reference-title')) {
              if (t.textContent.includes('GB/T 7714')) {
                const ref = t.nextElementSibling;
                if (ref?.classList.contains('export-reference')) return ref.textContent.trim();
              }
            }
            return null;
          });

          // 关闭弹窗
          await page.evaluate(() => {
            document.querySelectorAll('.ivu-modal').forEach(m => {
              if (getComputedStyle(m).display !== 'none')
                m.querySelector('.ivu-modal-close')?.click();
            });
          });
          await sleep(200);

          if (citation) {
            collected++;
            const authors = await page.locator('.normal-list').nth(i).locator('.authors').allTextContents().catch(() => []);
            const source = await page.locator('.normal-list').nth(i).locator('.periodical-title').first().textContent().catch(() => '');
            const yearText = await page.locator('.normal-list').nth(i).locator('.authors').last().textContent().catch(() => '');
            const yearM = yearText.match(/(\d{4})/);

            if (!allData[rt.name]) allData[rt.name] = [];
            allData[rt.name].push({
              type: rt.name, title: cleanTitle,
              authors: authors.map(a => a.trim()).filter(a => a && a !== '[' && a !== ']' && !a.includes('年')),
              source: source.trim(), year: yearM ? yearM[1] : '', citation,
            });
            saveData(allData);
            console.log(`  ✅ [${collected}/${ITEMS_PER_TYPE}] ${cleanTitle.substring(0, 45)}`);
          }

          await sleep(rand(400, 1000));
        } catch (e) {
          console.log(`  ⚠️ 第${i+1}条失败: ${e.message.substring(0, 30)}`);
        }
      }

      console.log(`  📊 ${rt.name}: ${collected} 条`);
      await sleep(rand(1000, 2000));
    }

    console.log('\n========================================');
    console.log('✅ 完成');
    const total = Object.values(allData).reduce((s, v) => s + v.length, 0);
    Object.entries(allData).forEach(([k, v]) => { if (v.length > 0) console.log(`   ${k}: ${v.length} 条`); });
    console.log(`   总计: ${total} 条`);
    console.log('========================================');

  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await ctx.close();
  }
}

main();
