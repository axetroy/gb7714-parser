#!/usr/bin/env node
/**
 * 从 standard-examples.json 中提取适合文档展示的示例
 *
 * 规则：
 *   - 跳过 skip 条目
 *   - 内容长度适中（< 100 字符）
 *   - 不含行续断字符（如 "202 4"）
 *   - 每个类型取第一条符合条件的
 *
 * 输出：src/__tests__/__fixtures__/docs-examples.json
 *       同时在终端打印可直接写入 README 的 markdown 片段
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const FIXTURES_PATH = resolve(root, 'src/__tests__/__fixtures__/standard-examples.json');
const OUTPUT_PATH = resolve(root, 'src/__tests__/__fixtures__/docs-examples.json');

const TYPE_PRIORITY = ['M', 'J', 'D', 'C', 'R', 'S', 'P', 'EB', 'N', 'CM', 'DS', 'PP'];

function isClean(content) {
  // 过滤行续断产生的奇怪空格
  if (/ \d{2} \d/.test(content)) return false;
  if (/\s{2,}/.test(content)) return false;
  return content.length <= 100 && !content.includes('—') && !content.includes('增 刊');
}

function main() {
  const data = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'));
  const picks = {};

  for (const group of data.groups) {
    for (const ex of group.examples) {
      if (ex.skip || !ex.content) continue;
      const c = ex.content.replace(/\s+/g, ' ').trim();
      if (!isClean(c)) continue;

      for (const type of TYPE_PRIORITY) {
        if (picks[type]) continue;
        if (c.includes(`[${type}]`) || c.includes(`[${type}/`)) {
          picks[type] = {
            content: c,
            section: group.section.split('/').pop().trim(),
            sourceLine: ex.sourceLine,
            id: ex.id,
          };
          break;
        }
      }
    }
  }

  const output = {
    version: data.version,
    source: 'GB-T 7714-2025/《信息与文献 参考文献著录规则》GB-T 7714-2025.md',
    examples: picks,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  // 打印 markdown 片段
  console.log('## 文档示例（来自 GB/T 7714-2025 标准）\n');
  for (const [type, ex] of Object.entries(picks)) {
    const typeNames = {
      M: '图书 [M]', J: '期刊 [J]', D: '学位论文 [D]',
      C: '会议录 [C]', R: '报告 [R]', S: '标准 [S]',
      P: '专利 [P]', EB: '网站/网页 [EB]', N: '报纸 [N]',
      CM: '地图 [CM]', DS: '数据集 [DS]', PP: '预印本 [PP]',
    };
    console.log(`### ${typeNames[type] || type}`);
    console.log(`来源：${ex.section}，示例 [${ex.id}]，第 ${ex.sourceLine} 行`);
    console.log('');
    console.log('```');
    console.log(ex.content);
    console.log('```');
    console.log('');
  }

  console.log(`共选取 ${Object.keys(picks).length} 条示例`);
  console.log(`输出：${OUTPUT_PATH}`);
}

main();
