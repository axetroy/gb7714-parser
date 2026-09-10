import { describe, it, expect } from 'vitest';
import { WebPageFormatter } from '../../formatter/types/8.11-eb-web-page-formatter.js';
import type { WebPage } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';
import { MediaType } from '../../types/index.js';

describe('WebPageFormatter', () => {
  const formatter = new WebPageFormatter({});

  describe('format', () => {
    it('应该格式化网页引用', () => {
      const reference: WebPage = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网站标题',
        createDate: '2025-01-01',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 网站标题[EB/OL]. (2025-01-01) [2025-09-07]. https://example.com.');
    });

    it('应该格式化没有创建日期的网页', () => {
      const reference: WebPage = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 网页标题[EB/OL]. [2025-09-07]. https://example.com.');
    });

    it('应该格式化没有作者的网页', () => {
      const reference: WebPage = {
        type: ReferenceType.EB,
        authors: [],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('网页标题[EB/OL]. [2025-09-07]. https://example.com.');
    });

    it('应该格式化带有 id 的网页', () => {
      const reference: WebPage = {
        type: ReferenceType.EB,
        id: '6',
        authors: [{ name: '张三' }],
        title: '网页标题',
        createDate: '2025-01-01',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('[6] 张三. 网页标题[EB/OL]. (2025-01-01) [2025-09-07]. https://example.com.');
    });

    it('应该格式化不带媒体类型的网页', () => {
      const reference: WebPage = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        createDate: '2025-01-01',
        accessDate: '2025-09-07',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 网页标题[EB]. (2025-01-01) [2025-09-07]. https://example.com.');
    });
  });
});
