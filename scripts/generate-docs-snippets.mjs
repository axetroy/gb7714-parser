#!/usr/bin/env node
/**
 * 从标准示例 fixtures 生成文档代码片段
 *
 * 用法：
 *   node scripts/generate-docs-snippets.mjs        # 打印到终端，可粘贴到文档
 *   node scripts/generate-docs-snippets.mjs --write  # 写入 README.md 和 docs/
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const DOCS_FIXTURES = resolve(root, 'src/__tests__/__fixtures__/docs-examples.json');
const README_PATH = resolve(root, 'README.md');
const GUIDE_PATH = resolve(root, 'docs/guide/supported-types.md');

const data = JSON.parse(readFileSync(DOCS_FIXTURES, 'utf8'));
const examples = data.examples;

const TYPE_NAMES = {
  M: '图书 [M]', J: '期刊 [J]', D: '学位论文 [D]',
  C: '会议录 [C]', R: '报告 [R]', S: '标准 [S]',
  P: '专利 [P]', EB: '网站/网页 [EB]', N: '报纸 [N]',
  CM: '地图 [CM]', DS: '数据集 [DS]', PP: '预印本 [PP]',
};

function mdCodeBlock(content, lang = '') {
  return '```\n' + lang + '\n' + content + '\n```';
}

// ── 生成 README 替换块 ───────────────────────────────────────────────
function generateReadmeSnippets() {
  const lines = [];

  // 快速开始 - 用期刊示例（含 CJK 逗号，展示库能力）
  lines.push('```typescript');
  lines.push(`import { parse, format, validate } from "gb7714-parser";`);
  lines.push('');
  lines.push('// 解析参考文献（来自 GB/T 7714-2025 标准示例）');
  lines.push(`const result = parse(`);
  lines.push(`  "[1] ${examples.J.content}",`);
  lines.push(`);`);
  lines.push('console.log(result.reference);');
  lines.push('// {');
  lines.push("//   type: 'J',");
  lines.push("//   authors: [{ name: '杨洪升' }],");
  lines.push("//   title: '四库馆私家抄校书考略',");
  lines.push("//   journalTitle: '文献',");
  lines.push("//   year: '2013',");
  lines.push("//   issue: '1',");
  lines.push("//   pages: '56-75'");
  lines.push('// }');
  lines.push('');
  lines.push('// 校验格式');
  lines.push('const report = validate(result.reference);');
  lines.push("console.log(report.valid); // true");
  lines.push('');
  lines.push('// 格式化输出');
  lines.push("const str = format(result.reference);");
  lines.push('console.log(str);');
  lines.push('```');
  lines.push('');
  lines.push('## 支持的文献类型');
  lines.push('');
  lines.push('| 类型标识 | 名称 | 示例 |');
  lines.push('| :------- | :--- | :--- |');

  for (const [type, ex] of Object.entries(examples)) {
    const name = TYPE_NAMES[type] || type;
    const snippet = ex.content.length > 50
      ? ex.content.slice(0, 50) + '…'
      : ex.content;
    lines.push(`| \`${type}\` | ${name} | \`${snippet}\` |`);
  }

  lines.push('');
  lines.push('## 解析示例');
  lines.push('');

  for (const [type, ex] of Object.entries(examples)) {
    const name = TYPE_NAMES[type] || type;
    lines.push(`### ${name}`);
    lines.push('');
    lines.push('```typescript');
    lines.push(`const result = parse(`);
    lines.push(`  "[1] ${ex.content}",`);
    lines.push(`);`);
    lines.push('```');
    lines.push('');
    lines.push(`> 来源：GB/T 7714-2025 标准，${ex.section}，示例 [${ex.id}]`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── 生成 guide/supported-types.md 替换块 ────────────────────────────
function generateGuideSnippets() {
  const lines = ['\n## 解析示例\n\n'];

  for (const [type, ex] of Object.entries(examples)) {
    const name = TYPE_NAMES[type] || type;
    lines.push(`### ${name}`);
    lines.push('');
    lines.push('```typescript');
    lines.push(`const result = parse(`);
    lines.push(`  '[1] ${ex.content}',`);
    lines.push(`);`);
    lines.push('```');
    lines.push('');
    lines.push(`> 来源：GB/T 7714-2025 标准，${ex.section}，示例 [${ex.id}]`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── 主函数 ───────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes('--write');

  if (!existsSync(DOCS_FIXTURES)) {
    console.error('请先运行：node scripts/generate-docs-examples.mjs');
    process.exit(1);
  }

  const readmeSnippets = generateReadmeSnippets();
  const guideSnippets = generateGuideSnippets();

  if (writeMode) {
    // 写入 README（替换 ## 解析示例 到 ## 高级用法 之间的内容）
    let readme = readFileSync(README_PATH, 'utf8');
    readme = readme.replace(
      /## 解析示例[\s\S]*?## 高级用法/,
      `## 解析示例\n\n${readmeSnippets}\n## 高级用法`
    );
    writeFileSync(README_PATH, readme, 'utf8');
    console.log('Updated README.md');

    // 写入 guide（替换 ## 解析示例 之后到文件结尾的内容）
    let guide = readFileSync(GUIDE_PATH, 'utf8');
    guide = guide.replace(
      /## 解析示例[\s\S]*/,
      `## 解析示例\n\n${guideSnippets}`
    );
    writeFileSync(GUIDE_PATH, guide, 'utf8');
    console.log('Updated docs/guide/supported-types.md');
  } else {
    console.log('=== README 片段 ===');
    console.log(readmeSnippets);
    console.log('\n=== Guide 片段 ===');
    console.log(guideSnippets);
    console.log('\n使用 --write 参数写入文件。');
  }
}

main();
