import { describe, it, expect } from 'vitest';
import { ThesisFormatter } from '../../formatter/types/8.7-d-thesis-formatter.js';
import type { Thesis } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('ThesisFormatter', () => {
  const formatter = new ThesisFormatter({});

  describe('format', () => {
    it('应该格式化完整的学位论文引用', () => {
      const reference: Thesis = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
        pages: '89',
      };
      const result = formatter.format(reference);
      expect(result).toBe('王五. 深度学习研究[D]. 北京: 北京大学, 2025: 89.');
    });

    it('应该格式化没有授予地的学位论文', () => {
      const reference: Thesis = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('王五. 深度学习研究[D]. 北京大学, 2025.');
    });

    it('应该格式化没有授予机构的学位论文', () => {
      const reference = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardYear: '2025',
      } as Thesis;
      const result = formatter.format(reference);
      expect(result).toBe('王五. 深度学习研究[D].');
    });

    it('应该格式化没有页码的学位论文', () => {
      const reference: Thesis = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('王五. 深度学习研究[D]. 北京: 北京大学, 2025.');
    });

    it('应该格式化带有 URL 的学位论文', () => {
      const reference: Thesis = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('王五. 深度学习研究[D]. 北京: 北京大学, 2025. https://example.com');
    });

    it('应该格式化带有 id 的学位论文', () => {
      const reference: Thesis = {
        type: ReferenceType.D,
        id: '8',
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[8] 王五. 深度学习研究[D]. 北京: 北京大学, 2025.');
    });

    it('应该格式化带有副标题的学位论文', () => {
      const reference: Thesis = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习',
        subtitle: '基于Transformer的研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('王五. 深度学习: 基于Transformer的研究[D]. 北京: 北京大学, 2025.');
    });

    it('应该格式化没有作者的学位论文', () => {
      const reference: Thesis = {
        type: ReferenceType.D,
        authors: [],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('深度学习研究[D]. 北京: 北京大学, 2025.');
    });
  });
});
