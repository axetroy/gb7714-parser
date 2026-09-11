import { describe, it, expect } from 'vitest';
import { parse, format } from '../index.js';
import type { ReferenceUnion } from '../types/index.js';
import appendixB from './__fixtures__/appendix-b-examples.json';

// 项目未引入 @types/node，此处仅声明用到的 process 子集
declare const process: { env: Record<string, string | undefined> };

/**
 * 附录 B 标准示例 round-trip 测试：parse → format → parse
 *
 * 策略（规范化 round-trip）：
 *   - format 是「规范化」工具：允许把全角标点、空格等规范化为半角/标准格式
 *   - 核心断言：parse(input) 与 parse(format(parse(input))) 的 reference 语义一致
 *   - 即两次解析的字段值一致（排除纯格式字段 authorComma、pid 尾点号）
 *
 * 这验证 parser 不丢**语义**信息：只要 format 规范化没有丢失任何字段，
 * 二次解析就能还原出与首次解析相同的结构化数据。
 *
 * 严格全量相等（parse → format === 原文）可通过环境变量开启：
 *   STRICT_ROUNDTRIP=1 npx vitest run src/__tests__/appendix-b-roundtrip.test.ts
 * 该模式为可选开关，默认关闭，不阻塞发布。
 */
const STRICT = process.env.STRICT_ROUNDTRIP === '1';

/**
 * 归一化：剔除纯格式字段，用于语义比较
 * - authorComma：作者间原始分隔符（"，"/","），规范化后必然变化，非语义
 * - pid 尾点号：tokenizer 会把原文句点包进 pid，规范化后消失，非语义
 */
function normalizeForSemanticCompare(reference: ReferenceUnion): ReferenceUnion {
  const copy = JSON.parse(JSON.stringify(reference)) as ReferenceUnion;
  delete copy.authorComma;
  if (copy.pid) {
    copy.pid = copy.pid.replace(/\.$/, '');
  }
  return copy;
}

describe('appendix-b roundtrip (parse → format → parse)', () => {
  let globalIndex = 0;

  for (const group of appendixB.groups) {
    for (const ex of group.examples) {
      globalIndex += 1;
      it(`[${globalIndex}] ${group.section} 示例 ${ex.id}`, () => {
        const input = `[${globalIndex}] ${ex.content}`;
        const result = parse(input);
        const formatted = format(result.reference).trim();

        // 基础断言：可解析、可格式化、不抛异常
        expect(result.reference.type).toBeDefined();
        expect(() => format(result.reference)).not.toThrow();

        // 格式输出不为空
        expect(formatted.length).toBeGreaterThan(0);

        // 二次解析：parse(format(parse(input)))
        const reparsed = parse(formatted).reference;

        // 核心断言：两次解析语义一致（format 规范化不丢字段）
        expect(normalizeForSemanticCompare(reparsed)).toEqual(
          normalizeForSemanticCompare(result.reference),
        );

        // 严格模式（可选）：全量字符串相等，默认关闭
        if (STRICT) {
          expect(formatted).toBe(ex.content.trim());
        }
      });
    }
  }

  // 汇总报告
  it('roundtrip 汇总统计', () => {
    expect(globalIndex).toBe(appendixB.groups.reduce((sum, g) => sum + g.examples.length, 0));
  });
});
