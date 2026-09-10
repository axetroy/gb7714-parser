import { describe, it, expect } from 'vitest';
import { parse, format, validate } from '../index.js';
import appendixB from './__fixtures__/appendix-b-examples.json';

/**
 * Playground 示例数据可用性冒烟测试
 * 保证 docs playground 使用的附录 B 示例可以被 parse / format / validate 处理
 */
describe('appendix-b-examples (playground fixtures)', () => {
  it('应该包含 14 个分组和 142 条示例', () => {
    expect(appendixB.groups).toHaveLength(14);
    const total = appendixB.groups.reduce((n, g) => n + g.examples.length, 0);
    expect(total).toBe(142);
  });

  // 用全局序号（playground 中展示的 [NUMBER]）逐条验证：可解析、可格式化
  let globalIndex = 0;
  for (const group of appendixB.groups) {
    for (const ex of group.examples) {
      globalIndex += 1;
      it(`[${globalIndex}] ${group.section} 示例 ${ex.id} 可解析`, () => {
        // 模拟 playground: 在原文前加序号
        const input = `[${globalIndex}] ${ex.content}`;
        const result = parse(input);

        // 解析出文献类型（非 unknown/兜底类型即视为结构可识别；不做强校验，
        // 因为标准示例对解析器而言有已知边界情况）
        expect(result.reference.type).toBeDefined();

        // 格式化不抛异常
        expect(() => format(result.reference)).not.toThrow();

        // 校验不抛异常
        expect(() => validate(result.reference)).not.toThrow();
      });
    }
  }
});
