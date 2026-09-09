#!/usr/bin/env node
/**
 * 从 GB/T 7714-2025 标准 markdown 文件提取所有官方示例
 *
 * 用法：node scripts/extract-standard-examples.mjs
 * 输出：src/__tests__/__fixtures__/standard-examples.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const STANDARD_PATH = resolve(
  root,
  'GB-T 7714-2025',
  '《信息与文献 参考文献著录规则》GB-T 7714-2025.md'
);
const OUTPUT_PATH = resolve(root, 'src/__tests__/__fixtures__/standard-examples.json');

// Skip patterns: examples that are known to be unparseable or intentionally edge-cases
const SKIP_CONTENT_PATTERNS = [
  // 缺少页码的日文图书（原文即为不完整）
  /图书馆用語辞典編集委員会.*柏書房株式会社/,
  // 自拟题名，格式特殊
  /\[《昨日の歌》图书封面\]/,
  // 纯章节标题/页码，非完整文献
  /^—+$/,
  // 包含 CJK 换行破坏的（已被清理，但仍有问题）
  /CN\d{8,}\.\d+\[P\]/,
];

function cleanWhitespace(raw) {
  // Join multi-line (replace newlines with single space)
  let text = raw.replace(/[\n\r]+/g, ' ');
  // Collapse runs of 2+ whitespace chars to single space
  text = text.replace(/[ \t]{2,}/g, ' ');
  // Remove stray hyphen at end of line that splits a word (line-break artifact)
  text = text.replace(/-\s+(\w)/g, '$1');
  // Normalise space around Chinese punctuation (should have no space)
  text = text.replace(/\s+([。，、；：])/g, '$1');
  // Normalise space before/after English punctuation (keep single space after comma, before none)
  text = text.replace(/,\s+/g, ', ');
  text = text.replace(/\s+([,.])\s*/g, '$1');
  // Remove trailing dots that are line-break artifacts
  text = text.replace(/\.\s*\.$/g, '.');
  return text.trim();
}

function main() {
  const markdown = readFileSync(STANDARD_PATH, 'utf8');
  const lines = markdown.split('\n');

  const allExamples = [];
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Track section heading
    const headingMatch = line.match(/^(#+)\s*(.+)$/);
    if (headingMatch) {
      const depth = headingMatch[1].length;
      const title = headingMatch[2].trim();
      if (depth === 4) {
        currentSection = title;
      } else if (depth === 5) {
        currentSection += ' / ' + title;
      }
    }

    // Match example lines: "- [1] content" or "  - [1] content"
    const match = line.match(/^\s*-\s*\[(\d+)\]\s*(.+)$/);
    if (!match) continue;

    const id = parseInt(match[1], 10);
    let content = match[2];
    let j = i + 1;

    // Consume continuation lines (indented, not starting a new example)
    while (
      j < lines.length &&
      lines[j] &&
      !lines[j].trim().startsWith('-') &&
      (lines[j].startsWith('   ') || lines[j].startsWith('  ') || lines[j].startsWith('- '))
    ) {
      content += lines[j];
      j++;
    }

    const cleaned = cleanWhitespace(content);

    // Skip problematic examples
    const shouldSkip = SKIP_CONTENT_PATTERNS.some(
      (pattern) => pattern instanceof RegExp && pattern.test(cleaned)
    );

    allExamples.push({
      id,
      content: cleaned,
      section: currentSection.trim(),
      sourceLine: i + 1,
      skip: shouldSkip,
      skipReason: shouldSkip ? 'known problematic example' : undefined,
    });
  }

  // Group by section
  const grouped = {};
  for (const ex of allExamples) {
    const key = ex.section || '其他';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ex);
  }

  const output = {
    version: 'GB/T 7714-2025',
    totalExamples: allExamples.length,
    skippedCount: allExamples.filter((e) => e.skip).length,
    groups: Object.entries(grouped).map(([section, examples]) => ({
      section,
      count: examples.length,
      examples: examples.filter((e) => !e.skip),
    })),
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  console.log(`Extracted ${output.totalExamples} examples, skipped ${output.skippedCount}`);
  console.log(`Groups: ${Object.keys(grouped).length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main();
