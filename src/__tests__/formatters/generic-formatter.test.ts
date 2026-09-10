import { describe, it, expect } from 'vitest';
import { GenericFormatter } from '../../formatter/types/generic-formatter.js';

import type { ReferenceUnion } from '../../types/index.js';

describe('GenericFormatter', () => {
  const formatter = new GenericFormatter({});

  describe('format', () => {
    it('应该处理通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        year: '2025',
      } as ReferenceUnion;
      const result = formatter.format(reference);
      expect(result).toBe('张三. 通用标题[X]. 2025.');
    });

    it('应该处理带有出版者信息的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        year: '2025',
        publisherPlace: '北京',
        publisher: '出版社',
      } as ReferenceUnion;
      const result = formatter.format(reference);
      expect(result).toBe('张三. 通用标题[X]. 2025. 北京: 出版社.');
    });

    it('应该处理带有 URL 的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        url: 'https://example.com',
      } as ReferenceUnion;
      const result = formatter.format(reference);
      expect(result).toBe('张三. 通用标题[X]. https://example.com');
    });

    it('应该处理没有年份的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
      } as ReferenceUnion;
      const result = formatter.format(reference);
      expect(result).toBe('张三. 通用标题[X].');
    });

    it('应该处理带有 id 的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        id: '42',
        authors: [{ name: '张三' }],
        title: '通用标题',
      } as ReferenceUnion;
      const result = formatter.format(reference);
      expect(result).toBe('[42] 张三. 通用标题[X].');
    });

    it('应该处理没有作者的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [],
        title: '通用标题',
      } as ReferenceUnion;
      const result = formatter.format(reference);
      expect(result).toBe('通用标题[X].');
    });

    it('应该处理没有出版地和出版者的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        year: '2025',
      } as ReferenceUnion;
      const result = formatter.format(reference);
      expect(result).toBe('张三. 通用标题[X]. 2025.');
    });
  });
});
