import { describe, it, expect } from 'vitest';
import { ArchiveFormatter } from '../../formatter/types/8.12-a-archive-formatter.js';
import type { Archive } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('ArchiveFormatter', () => {
  const formatter = new ArchiveFormatter({});

  describe('format', () => {
    it('应该格式化档案', () => {
      const reference: Archive = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
        collectionPlace: '北京',
        collector: '档案馆',
        formedDate: '1887',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A]. 北京: 档案馆, 1887.');
    });

    it('应该格式化没有收藏地的档案', () => {
      const reference: Archive = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A].');
    });

    it('应该格式化没有档案号的档案', () => {
      const reference: Archive = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 档案标题[A].');
    });

    it('应该格式化带有 URL 的档案', () => {
      const reference: Archive = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 档案标题[A]. https://example.com');
    });

    it('应该格式化带有收藏地的档案', () => {
      const reference: Archive = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        collectionPlace: '北京',
        collector: '档案馆',
        formedDate: '1887',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 档案标题[A]. 北京: 档案馆, 1887.');
    });

    it('应该格式化带有 id 的档案', () => {
      const reference: Archive = {
        type: ReferenceType.A,
        id: '9',
        authors: [{ name: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[9] 张三 档案标题: ABC123[A].');
    });

    it('应该格式化没有作者的档案', () => {
      const reference: Archive = {
        type: ReferenceType.A,
        authors: [],
        title: '档案标题',
        archiveNumber: 'ABC123',
      };
      const result = formatter.format(reference);
      expect(result).toBe('档案标题: ABC123[A].');
    });
  });
});
