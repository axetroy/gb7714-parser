import { describe, it, expect } from 'vitest';
import { PreprintFormatter } from '../../formatter/types/8.15-pp-preprint-formatter.js';
import type { Preprint } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';
import { MediaType } from '../../types/index.js';

describe('PreprintFormatter', () => {
  const formatter = new PreprintFormatter({});

  describe('format', () => {
    it('应该格式化带有平台的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        platform: 'arXiv',
        createDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. arXiv (2025-09-07) [2025-10-01].');
    });

    it('应该格式化没有平台的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL].');
    });

    it('应该格式化带有 URL 的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. https://example.com');
    });

    it('应该格式化带有 id 的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        id: '44',
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('[44] 张三 预印本标题[PP/OL].');
    });

    it('应该格式化带有版本的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        version: 'v1.0',
        platform: 'arXiv',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. v1.0. arXiv [2025-10-01].');
    });

    it('应该格式化带有创建日期的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        platform: 'arXiv',
        createDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. arXiv (2025-09-07) [2025-10-01].');
    });

    it('应该格式化没有作者的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        authors: [],
        title: '预印本标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('预印本标题[PP/OL].');
    });

    it('应该格式化不带媒体类型的预印本', () => {
      const reference: Preprint = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 预印本标题[PP].');
    });
  });
});
