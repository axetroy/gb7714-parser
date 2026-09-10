import { describe, it, expect } from 'vitest';
import { PatentFormatter } from '../../formatter/types/8.10-p-patent-formatter.js';
import type { Patent } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('PatentFormatter', () => {
  const formatter = new PatentFormatter({});

  describe('format', () => {
    it('应该格式化带有专利号的专利', () => {
      const reference: Patent = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. 2025-09-07.');
    });

    it('应该格式化带有页码的专利', () => {
      const reference: Patent = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
        pages: '10',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. 2025-09-07: 10.');
    });

    it('应该格式化没有公告日期的专利', () => {
      const reference: Patent = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P].');
    });

    it('应该格式化带有 URL 的专利', () => {
      const reference: Patent = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. 2025-09-07. https://example.com');
    });

    it('应该格式化带有 id 的专利', () => {
      const reference: Patent = {
        type: ReferenceType.P,
        id: '11',
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[11] 张三 发明名称: CN2025001[P]. 2025-09-07.');
    });

    it('应该格式化没有作者的专利', () => {
      const reference: Patent = {
        type: ReferenceType.P,
        authors: [],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe(' 发明名称: CN2025001[P]. 2025-09-07.');
    });
  });
});
