import { describe, it, expect } from 'vitest';
import { DatasetFormatter } from '../../formatter/types/8.14-ds-dataset-formatter.js';
import type { Dataset } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';
import { MediaType } from '../../types/index.js';

describe('DatasetFormatter', () => {
  const formatter = new DatasetFormatter({});

  describe('format', () => {
    it('应该格式化带有平台的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        platform: '国家数据中心',
        releaseDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 数据集标题[DS/OL]. 国家数据中心 (2025-09-07) [2025-10-01].');
    });

    it('应该格式化没有平台的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 数据集标题[DS/OL].');
    });

    it('应该格式化带有 URL 的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 数据集标题[DS/OL]. https://example.com');
    });

    it('应该格式化带有 id 的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        id: '43',
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('[43] 张三. 数据集标题[DS/OL].');
    });

    it('应该格式化带有版本的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        version: 'v2.0',
        platform: '国家数据中心',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 数据集标题[DS/OL]. v2.0. 国家数据中心 [2025-10-01].');
    });

    it('应该格式化带有发布日期的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        platform: '国家数据中心',
        releaseDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 数据集标题[DS/OL]. 国家数据中心 (2025-09-07) [2025-10-01].');
    });

    it('应该格式化没有作者的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        authors: [],
        title: '数据集标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = formatter.format(reference);
      expect(result).toBe('数据集标题[DS/OL].');
    });

    it('应该格式化不带媒体类型的数据集', () => {
      const reference: Dataset = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 数据集标题[DS].');
    });
  });
});
