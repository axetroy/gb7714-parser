import { describe, it, expect } from 'vitest';
import { StandardFormatter } from '../../formatter/types/8.9-s-standard-formatter.js';
import type { Standard } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('StandardFormatter', () => {
  const formatter = new StandardFormatter({});

  describe('format', () => {
    it('应该格式化带有标准号的标准', () => {
      const reference: Standard = {
        type: ReferenceType.S,
        authors: [],
        title: '标准名称',
        standardNumber: 'GB/T 3792—2021',
        standardName: '信息与文献馆藏操作',
      };
      const result = formatter.format(reference);
      expect(result).toBe('GB/T 3792—2021 信息与文献馆藏操作[S].');
    });

    it('应该格式化带有 URL 的标准', () => {
      const reference: Standard = {
        type: ReferenceType.S,
        authors: [],
        title: '标准名称',
        standardNumber: 'GB/T 3792—2021',
        standardName: '信息与文献馆藏操作',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('GB/T 3792—2021 信息与文献馆藏操作[S]. https://example.com');
    });

    it('应该格式化带有 id 的标准', () => {
      const reference: Standard = {
        type: ReferenceType.S,
        id: '45',
        authors: [],
        title: '标准名称',
        standardNumber: 'GB/T 3792—2021',
        standardName: '信息与文献馆藏操作',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[45] GB/T 3792—2021 信息与文献馆藏操作[S].');
    });

    it('当 includeTypeIndicator 为 false 时应该格式化没有类型标识的标准', () => {
      const reference: Standard = {
        type: ReferenceType.S,
        standardNumber: 'GB/T 7714-2025',
        standardName: '信息与文献 参考文献著录规则',
        includeTypeIndicator: false,
        authors: [],
        title: '信息与文献 参考文献著录规则',
      };
      const result = formatter.format(reference);
      expect(result).not.toContain('[S]');
    });

    it('应该格式化空作者数组的标准', () => {
      const reference: Standard = {
        type: ReferenceType.S,
        authors: [],
        title: '标准标题',
        standardNumber: 'GB/T 1234',
        standardName: '标准名称',
      };
      const result = formatter.format(reference);
      expect(result).toBe('GB/T 1234 标准名称[S].');
    });
  });
});
