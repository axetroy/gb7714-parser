import { describe, it, expect } from 'vitest';
import { parse, format, validate } from '../index.js';
import type { ReferenceUnion } from '../types/index.js';
import fixtures from './__fixtures__/standard-examples.json' with { type: 'json' };

/**
 * GB/T 7714-2025 标准一致性测试（Golden Test Harness）
 *
 * 数据来源：GB-T 7714-2025/《信息与文献 参考文献著录规则》GB-T 7714-2025.md
 * 由 scripts/extract-standard-examples.mjs 自动提取，再生成此测试文件。
 *
 * 测试维度：
 *   1. parse(input) 不抛出异常
 *   2. 解析结果 reference.type 是有效类型标识
 *   3. format(reference) 不抛出异常且输出非空
 *   4. validate(reference) 返回结构化报告
 *
 * 已知问题标记为 skip，保留在 fixtures.skipReason 中便于追踪。
 */

// Section path → 简洁中文标题映射（用于 describe 块名）
const SECTION_LABELS: Record<string, string> = {
  'B.1 图书': '图书 [M]',
  'B.2 图书中的析出文献': '图书析出文献 [M]',
  'B.3 连续出版物': '连续出版物 [J]',
  'B.4 连续出版物中的析出文献': '连续出版物析出文献 [J/N]',
  'B.5 会议录': '会议录 [C]',
  'B.6 学位论文': '学位论文 [D]',
  'B.7 报告': '报告 [R]',
  'B.8 标准': '标准 [S]',
  'B.9 专利': '专利 [P]',
  'B.10 网站、网页': '网站/网页 [EB]',
  'B.11 档案': '档案 [A]',
  'B.12 地图': '地图 [CM]',
  'B.13 数据集': '数据集 [DS]',
  'B.14 预印本': '预印本 [PP]',
};

/** 将长 section 路径裁剪为可展示的短标签 */
function shortLabel(section: string): string {
  // 优先使用附录 B 的章节名（最简单）
  const bMatch = section.match(/B\.\d+\s+.+/);
  if (bMatch) return SECTION_LABELS[bMatch[0]] ?? bMatch[0];
  // 回退到 main section（8.x 或 9.x）
  const mainMatch = section.match(/^(8\.\d+|9\.\d+|5\s+\S+)/);
  if (mainMatch) return mainMatch[0];
  return section;
}

describe('GB/T 7714-2025 标准一致性测试', () => {
  for (const group of fixtures.groups) {
    const label = shortLabel(group.section);
    describe(`标准示例 · ${label}（${group.count}条）`, () => {
      for (const ex of group.examples) {
        it(`示例 [${ex.id}]`, () => {
          const input = `[1] ${ex.content}`;
          // 1. parse 不应抛出
          const result = parse(input);
          const ref = result.reference as ReferenceUnion;

          expect(ref).toBeDefined();
          expect(typeof ref.type).toBe('string');
          expect(ref.type.length).toBeGreaterThan(0);
          // 2. format 不应抛出且输出非空
          const formatted = format(ref);
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
          // 3. validate 应返回有效报告
          const report = validate(ref);
          expect(report).toBeDefined();
          expect(typeof report.valid).toBe('boolean');
          expect(Array.isArray(report.errors)).toBe(true);
        });
      }
    });
  }
});
