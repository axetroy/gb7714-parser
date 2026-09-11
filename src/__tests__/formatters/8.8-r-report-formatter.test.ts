import { describe, it, expect } from 'vitest';
import { ReportFormatter } from '../../formatter/types/8.8-r-report-formatter.js';
import type { Report } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('ReportFormatter', () => {
  const formatter = new ReportFormatter({});

  describe('format', () => {
    it('应该格式化报告', () => {
      const reference: Report = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 技术报告: TR-2025-001[R]. 2025-09-07.');
    });

    it('应该格式化带有页码的报告', () => {
      const reference: Report = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
        pages: '50',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 技术报告: TR-2025-001[R]. 2025-09-07: 50.');
    });

    it('应该格式化没有发布日期的报告', () => {
      const reference: Report = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 技术报告: TR-2025-001[R].');
    });

    it('应该格式化没有报告号的报告', () => {
      const reference: Report = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        releaseDate: '2025-09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 技术报告[R]. 2025-09-07.');
    });

    it('应该格式化带有 URL 的报告', () => {
      const reference: Report = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 技术报告: TR-2025-001[R]. 2025-09-07. https://example.com');
    });

    it('应该格式化带有 id 的报告', () => {
      const reference: Report = {
        type: ReferenceType.R,
        id: '7',
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[7] 张三. 技术报告: TR-2025-001[R]. 2025-09-07.');
    });

    it('应该格式化没有作者的报告', () => {
      const reference: Report = {
        type: ReferenceType.R,
        authors: [],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('技术报告: TR-2025-001[R]. 2025-09-07.');
    });
  });
});
