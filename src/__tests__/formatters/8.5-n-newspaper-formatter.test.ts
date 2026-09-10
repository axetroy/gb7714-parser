import { describe, it, expect } from 'vitest';
import { NewspaperFormatter } from '../../formatter/types/8.5-n-newspaper-formatter.js';

import type { Newspaper } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('NewspaperFormatter', () => {
  const formatter = new NewspaperFormatter({});

  describe('format', () => {
    it('应该格式化报纸引用', () => {
      const reference: Newspaper = {
        type: ReferenceType.N,
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '2025',
        monthDay: '09-07',
        edition: '03',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 新闻标题[N]. 人民日报, 2025, 09-07: 03.');
    });

    it('应该格式化没有版次的报纸引用', () => {
      const reference: Newspaper = {
        type: ReferenceType.N,
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '2025',
        monthDay: '09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 新闻标题[N]. 人民日报, 2025, 09-07.');
    });

    it('应该格式化没有日期的报纸引用', () => {
      const reference = {
        type: ReferenceType.N,
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
      } as Newspaper;
      const result = formatter.format(reference);
      expect(result).toBe('张三. 新闻标题[N]. 人民日报.');
    });

    it('应该格式化带有 URL 的报纸引用', () => {
      const reference: Newspaper = {
        type: ReferenceType.N,
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '2025',
        monthDay: '09-07',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 新闻标题[N]. 人民日报, 2025, 09-07. https://example.com');
    });

    it('应该格式化带有 id 的报纸引用', () => {
      const reference: Newspaper = {
        type: ReferenceType.N,
        id: '10',
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '2025',
        monthDay: '09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[10] 张三. 新闻标题[N]. 人民日报, 2025, 09-07.');
    });

    it('应该格式化没有作者的报纸引用', () => {
      const reference: Newspaper = {
        type: ReferenceType.N,
        authors: [],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '2025',
        monthDay: '09-07',
      };
      const result = formatter.format(reference);
      expect(result).toBe('新闻标题[N]. 人民日报, 2025, 09-07.');
    });
  });
});
