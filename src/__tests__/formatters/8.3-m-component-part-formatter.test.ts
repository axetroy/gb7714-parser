import { describe, it, expect } from 'vitest';
import { ComponentPartFormatter } from '../../formatter/types/8.3-m-component-part-formatter.js';
import type { ComponentPart, ReferenceUnion } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('ComponentPartFormatter', () => {
  const formatter = new ComponentPartFormatter({});

  describe('format', () => {
    it('应该格式化带有主机信息和页码的析出文献', () => {
      const reference: ComponentPart = {
        type: ReferenceType.M,
        authors: [{ name: '张三' }],
        title: '析出文献标题',
        host: {
          authors: [{ name: '李四' }],
          title: '图书标题',
          publisherPlace: '北京',
          publisher: '出版社',
          year: '2025',
        },
        pages: '100-110',
      };
      const result = formatter.format(reference as ReferenceUnion);
      expect(result).toBe('张三. 析出文献标题[M]// 李四. 图书标题. 北京: 出版社, 2025: 100-110.');
    });

    it('应该格式化带有主机信息和页码的析出文献', () => {
      const reference: ComponentPart = {
        type: 'Z' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '析出文献标题',
        host: {
          authors: [{ name: '李四' }],
          title: '图书标题',
          publisherPlace: '北京',
          publisher: '出版社',
          year: '2025',
        },
        pages: '100-110',
      };
      const result = formatter.format(reference as ReferenceUnion);
      // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
      expect(result).toBe('张三. 析出文献标题[Z]// 李四. 图书标题. 北京: 出版社, 2025: 100-110.');
    });

    it('应该格式化没有页码的析出文献', () => {
      const reference: ComponentPart = {
        type: 'Z' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '析出文献标题',
        host: {
          authors: [{ name: '李四' }],
          title: '图书标题',
          publisherPlace: '北京',
          publisher: '出版社',
          year: '2025',
        },
      };
      const result = formatter.format(reference as ReferenceUnion);
      expect(result).toBe('张三. 析出文献标题[Z]// 李四. 图书标题. 北京: 出版社, 2025.');
    });

    it('应该格式化带有副标题的析出文献', () => {
      const reference: ComponentPart = {
        type: 'Z' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '析出文献',
        subtitle: '副标题',
        host: {
          title: '图书标题',
        },
      };
      const result = formatter.format(reference as ReferenceUnion);
      expect(result).toBe('张三. 析出文献: 副标题[Z]// 图书标题.');
    });
  });
});
