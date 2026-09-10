import { describe, it, expect } from 'vitest';
import { parse, format } from '../index.js';
import appendixB from './__fixtures__/appendix-b-examples.json';

/**
 * 附录 B 标准示例 round-trip 测试：parse → format
 *
 * 验证：parse(input) 解析出的 reference，经 format() 格式化后，
 * 输出与原始内容完全一致。
 *
 * 已知失败根因（formatter bug，待修复）：
 *   1. author-dot-missing (122例)：所有 formatter 在作者后缺少 DOT 分隔符
 *      parts.join(' ') 将 "作者" + "题名[M]." 拼接为 "作者 题名[M]." 而非 "作者. 题名[M]."
 *   2. colon-normalized (1例)：全角冒号 ：→ ASCII :
 *   3. content-loss (3例)：析出文献 [M/OL]// 格式内容丢失
 *   4. access-date-loss (3例)：EB/OL 中 [accessDate] 被丢弃
 *   5. other (3例)：格式细节差异
 *
 * 目前通过率：10/142 (7%)，全部为 [S] 标准类型（无作者、无格式复杂性）。
 */
describe('appendix-b roundtrip (parse → format)', () => {
  const typeRe = /\[([A-Z]+(?:\/[A-Z]+)?)\]/;
  let globalIndex = 0;
  const results: Array<{
    index: number;
    section: string;
    typeId: string;
    exId: number;
    input: string;
    formatted: string;
    passed: boolean;
    failCategory?: string;
  }> = [];

  for (const group of appendixB.groups) {
    for (const ex of group.examples) {
      globalIndex += 1;
      it(`[${globalIndex}] ${group.section} 示例 ${ex.id}`, () => {
        const input = `[${globalIndex}] ${ex.content}`;
        const result = parse(input);
        const formatted = format(result.reference).trim();
        const expected = ex.content.trim();

        // 基础断言：可解析、可格式化、不抛异常
        expect(result.reference.type).toBeDefined();
        expect(() => format(result.reference)).not.toThrow();

        // Round-trip 断言
        const passed = formatted === expected;
        const typeId = (ex.content.match(typeRe) || [])[1] || '?';
        const failCategory = classifyFailure(expected, formatted, result.reference);

        results.push({
          index: globalIndex,
          section: group.section,
          typeId,
          exId: ex.id,
          input: expected,
          formatted,
          passed,
          failCategory: passed ? undefined : failCategory,
        });

        if (!passed) {
          // 详细错误信息便于调试
          const msg = [
            `Round-trip mismatch #${globalIndex} [${typeId}]`,
            `  expected: ${expected.substring(0, 100)}`,
            `  got:      ${formatted.substring(0, 100)}`,
            `  cause:    ${failCategory}`,
          ].join('\n');
          expect(formatted, msg).toBe(expected);
        }
      });
    }
  }

  // 汇总报告
  it('roundtrip 汇总统计', () => {
    const total = results.length;
    const pass = results.filter(r => r.passed).length;
    const fail = total - pass;

    // 按类型统计
    const byType: Record<string, { total: number; pass: number }> = {};
    for (const r of results) {
      if (!byType[r.typeId]) byType[r.typeId] = { total: 0, pass: 0 };
      byType[r.typeId].total++;
      if (r.passed) byType[r.typeId].pass++;
    }

    // 按失败原因统计
    const byCause: Record<string, number> = {};
    for (const r of results) {
      if (r.failCategory) {
        byCause[r.failCategory] = (byCause[r.failCategory] || 0) + 1;
      }
    }

    
    
    
    for (const [_t, s] of Object.entries(byType).sort()) {
      const _pct = Math.round(s.pass / s.total * 100);
      
    }
    
    for (const [_c, _n] of Object.entries(byCause).sort((a, b) => b[1] - a[1])) {
      
    }

    // 核心断言：通过率 ≥ 7%（当前基线，[S] 类型全部通过）
    expect(pass).toBeGreaterThanOrEqual(7);
    expect(fail).toBeLessThanOrEqual(135);
  });
});

/**
 * 对失败的 round-trip 进行分类诊断
 */
function classifyFailure(
  expected: string,
  formatted: string,
  _ref: ReturnType<typeof parse>['reference'],
): string {
  if (formatted === expected) return 'none';

  // 1. 作者后缺 DOT（最大根因：122/132）
  const tiIdx = expected.indexOf('[');
  const prefix = tiIdx >= 0 ? expected.substring(0, tiIdx).trim() : expected;
  const hasAuthor = prefix.includes('.');
  const firstWord = prefix.split(/[\s\.]+/)[0];
  if (hasAuthor && firstWord && !formatted.includes(firstWord + '.')) {
    return 'author-dot-missing';
  }

  // 2. 全角冒号归一化
  if (
    formatted.replace(/：/g, ':').replace(/\s+/g, ' ') ===
    expected.replace(/：/g, ':').replace(/\s+/g, ' ')
  ) {
    return 'colon-normalized';
  }

  // 3. 内容大量丢失
  if (formatted.length < expected.length * 0.5) {
    return 'content-loss';
  }

  // 4. accessDate 被丢弃（EB/OL 中 [...] 格式的日期）
  const accessDateMatch = expected.match(/\[\d{4}-\d{2}-\d{2}\]/);
  if (accessDateMatch && !formatted.includes(accessDateMatch[0])) {
    return 'access-date-loss';
  }

  // 5. 其他格式差异
  return 'other';
}
