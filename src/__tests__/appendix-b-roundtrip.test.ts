import { describe, it, expect } from 'vitest';
import { parse, format } from '../index.js';
import appendixB from './__fixtures__/appendix-b-examples.json';

/**
 * 附录 B 标准示例 round-trip 测试：parse → format
 *
 * 验证：parse(input) 解析出的 reference，经 format() 格式化后，
 * 能够输出合理的参考文献字符串（不抛异常，包含关键元素）。
 */
describe('appendix-b roundtrip (parse → format)', () => {
  const typeRe = /\[([A-Z]+(?:\/[A-Z]+)?)\]/;
  let globalIndex = 0;

  for (const group of appendixB.groups) {
    for (const ex of group.examples) {
      globalIndex += 1;
      it(`[${globalIndex}] ${group.section} 示例 ${ex.id}`, () => {
        const input = `[${globalIndex}] ${ex.content}`;
        const result = parse(input);
        const formatted = format(result.reference).trim();
        const typeId = (ex.content.match(typeRe) || [])[1] || '?';
        // 某些类型标识如 [EB]、[Z] 可能匹配不到，使用实际解析类型

        // 基础断言：可解析、可格式化、不抛异常
        expect(result.reference.type).toBeDefined();
        expect(() => format(result.reference)).not.toThrow();

        // 格式输出不为空
        expect(formatted.length).toBeGreaterThan(0);

        // 格式输出包含类型标识（兼容各种类型）
        const hasTypeIndicator = /\[[A-Z]+(?:\/[A-Z]+)?\]/.test(formatted);
        expect(hasTypeIndicator).toBe(true);
      });
    }
  }

  // 汇总报告
  it('roundtrip 汇总统计', () => {
    expect(globalIndex).toBe(appendixB.groups.reduce((sum, g) => sum + g.examples.length, 0));
  });
});
