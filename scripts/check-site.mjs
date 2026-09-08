process.env.PLAYWRIGHT_DOWNLOAD_HOST = 'https://npmmirror.com/mirrors/playwright';

import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const page = await browser.newPage();
  
  try {
    // 先访问主页
    console.log('访问万方数据主页...');
    await page.goto('https://www.wanfangdata.com.cn/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 搜索一个关键词
    console.log('搜索 "人工智能"...');
    const searchInput = await page.locator('input[type="text"], input[type="search"], input.search-input, #txtSearch').first();
    await searchInput.fill('人工智能');
    await searchInput.press('Enter');
    await page.waitForTimeout(5000);
    
    console.log('搜索结果URL:', page.url());
    
    // 获取第一个 normal-list 元素的 button-area
    const firstItem = await page.locator('.normal-list').first();
    if (await firstItem.count() > 0) {
      // 获取 button-area 的内容
      const buttonArea = await firstItem.locator('.button-area').innerHTML();
      console.log('\n按钮区域HTML:');
      console.log(buttonArea);
      
      // 悬停在第一个结果上
      console.log('\n悬停在第一个结果上...');
      await firstItem.hover();
      await page.waitForTimeout(1000);
      
      // 再次获取按钮区域
      const buttonAreaAfterHover = await firstItem.locator('.button-area').innerHTML();
      console.log('\n悬停后按钮区域HTML:');
      console.log(buttonAreaAfterHover);
      
      // 查找所有按钮
      const buttons = await firstItem.locator('.button-area a, .button-area button, .button-area span').allTextContents();
      console.log('\n按钮文本:', buttons.filter(b => b.trim()));
    }
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

main();
