import { describe, it, expect } from 'vitest';
import { Formatter, format } from '../../formatter/index.js';
import type { ReferenceUnion } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('Formatter base functionality', () => {
  describe('locale support', () => {
    it('应该在中文区域设置（默认）中使用 "等"', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const formatter = new Formatter();
      const result = formatter.format(reference);
      expect(result).toContain('等');
      expect(result).not.toContain('et al.');
    });

    it('应该在英文区域设置中使用 "et al."', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: 'Smith' },
          { name: 'Johnson' },
          { name: 'Williams' },
          { name: 'Brown' },
        ],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const formatter = new Formatter({ locale: 'en' });
      const result = formatter.format(reference);
      expect(result).toContain('et al.');
      expect(result).not.toContain('等');
    });
  });

  describe('subtitle support', () => {
    it('应该格式化带有副标题的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '机器学习',
        subtitle: '理论与实践',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四. 机器学习: 理论与实践[M]. 北京: 出版社, 2025.');
    });

    it('应该格式化带有副标题的期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '人工智能研究',
        subtitle: '综述篇',
        journalTitle: '计算机学报',
        year: '2025',
        volume: '48',
        issue: '1',
      };
      const result = format(reference);
      expect(result).toBe('张三. 人工智能研究: 综述篇[J]. 计算机学报, 2025, 48(1).');
    });

    it('应该格式化带有副标题的学位论文', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习',
        subtitle: '基于Transformer的研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五. 深度学习: 基于Transformer的研究[D]. 北京: 北京大学, 2025.');
    });
  });

  describe('otherAuthors support', () => {
    it('应该格式化带有其他作者（译者）的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: 'Smith' }],
        title: 'AI Handbook',
        otherAuthors: [{ name: '张三' }],
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('Smith. AI Handbook[M]. 张三. 北京: 出版社, 2025.');
    });

    it('应该格式化带有多个其他作者的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: 'Smith' }],
        title: 'AI Handbook',
        otherAuthors: [
          { name: '张三' },
          { name: '李四' },
        ],
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('Smith. AI Handbook[M]. 张三, 李四. 北京: 出版社, 2025.');
    });
  });

  describe('component part with pages', () => {
    it('应该格式化带有主机信息和页码的析出文献', () => {
      const reference: ReferenceUnion = {
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
      } as ReferenceUnion;
      const result = format(reference);
      // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
      expect(result).toBe('张三. 析出文献标题[Z]// 李四. 图书标题. 北京: 出版社, 2025: 100-110.');
    });

    it('应该格式化没有页码的析出文献', () => {
      const reference: ReferenceUnion = {
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
      } as ReferenceUnion;
      const result = format(reference);
      // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
      expect(result).toBe('张三. 析出文献标题[Z]// 李四. 图书标题. 北京: 出版社, 2025.');
    });

    it('应该格式化带有副标题的析出文献', () => {
      const reference: ReferenceUnion = {
        type: 'Z' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '析出文献',
        subtitle: '副标题',
        host: {
          title: '图书标题',
        },
      } as ReferenceUnion;
      const result = format(reference);
      // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
      expect(result).toBe('张三. 析出文献: 副标题[Z]// 图书标题.');
    });
  });

  describe('Formatter class', () => {
    it('应该使用默认选项创建 Formatter', () => {
      const formatter = new Formatter();
      expect(formatter).toBeDefined();
    });

    it('应该创建 2015 版本的 Formatter', () => {
      const formatter = new Formatter({ version: '2015' });
      expect(formatter).toBeDefined();
    });

    it('应该使用 format 方法格式化引用', () => {
      const formatter = new Formatter();
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三. 论文标题[J]. 期刊名, 2025.');
    });
  });
});
