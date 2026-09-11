import { describe, it, expect } from 'vitest';
import { format } from '../formatter/index.js';
import type { ReferenceUnion } from '../types/index.js';
import { ReferenceType } from '../types/index.js';

/**
 * Formatter integration tests.
 * Tests the top-level `format` function which dispatches to type-specific formatters.
 * Per-formatter unit tests are in src/__tests__/formatters/
 */
describe('Formatter (integration)', () => {
  describe('format', () => {
    it('应该格式化学位论文引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
        pages: '89',
      };
      const result = format(reference);
      expect(result).toBe('王五. 深度学习研究[D]. 北京: 北京大学, 2025: 89.');
    });

    it('应该在存在 id 时格式化 id', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        id: '1',
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('[1] 张三. 论文标题[J]. 期刊名, 2025.');
    });

    it('应该格式化报纸引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.N,
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '2025',
        monthDay: '09-07',
        edition: '03',
      };
      const result = format(reference);
      expect(result).toBe('张三. 新闻标题[N]. 人民日报, 2025-09-07 (03).');
    });
  });
});
