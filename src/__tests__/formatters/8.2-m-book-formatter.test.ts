import { describe, it, expect } from 'vitest';
import { BookFormatter } from '../../formatter/types/8.2-m-book-formatter.js';
import type { Book } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('BookFormatter', () => {
  const formatter = new BookFormatter({});

  describe('format', () => {
    it('应该格式化图书引用', () => {
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '机器学习导论',
        publisherPlace: '北京',
        publisher: '清华大学出版社',
        year: '2024',
        pages: '156',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.');
    });

    it('应该格式化没有页码的图书', () => {
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 书名[M]. 北京: 出版社, 2025.');
    });

    it('应该格式化带有版本的图书', () => {
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        version: '第3版',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 书名[M]. 第3版. 北京: 出版社, 2025.');
    });

    it('应该格式化带有 URL 的图书', () => {
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 书名[M]. 北京: 出版社, 2025. https://example.com');
    });

    it('应该格式化带有 id 的图书', () => {
      const reference: Book = {
        type: ReferenceType.M,
        id: '50',
        authors: [{ name: '李四' }],
        title: '书名',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[50] 李四. 书名[M].');
    });

    it('应该格式化 2015 版本中使用 DOI 的图书', () => {
      const formatter2015 = new BookFormatter({ version: '2015' });
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
        pid: '10.1234/test',
      };
      const result = formatter2015.format(reference);
      expect(result).toBe('李四. 书名[M]. 北京: 出版社, 2025. DOI:10.1234/test');
    });

    it('应该格式化 2025 版本中使用 PID 的图书', () => {
      const formatter2025 = new BookFormatter({ version: '2025' });
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
        pid: '10.1234/test',
      };
      const result = formatter2025.format(reference);
      expect(result).toBe('李四. 书名[M]. 北京: 出版社, 2025. PID:10.1234/test');
    });

    it('应该使用替代年份格式化年份', () => {
      const formatter = new BookFormatter({});
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '张三' }],
        title: '图书标题',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '1947',
        alternativeYear: '民国三十六年',
      };
      const result = formatter.format(reference);
      expect(result).toContain('1947（民国三十六年）');
    });

    it('应该格式化带有其他作者（译者）的图书', () => {
      const formatter = new BookFormatter({});
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: 'Smith' }],
        title: 'AI Handbook',
        otherAuthors: [{ name: '张三' }],
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('Smith. AI Handbook[M]. 张三. 北京: 出版社, 2025.');
    });

    it('应该格式化带有多个其他作者的图书', () => {
      const formatter = new BookFormatter({});
      const reference: Book = {
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
      const result = formatter.format(reference);
      expect(result).toBe('Smith. AI Handbook[M]. 张三, 李四. 北京: 出版社, 2025.');
    });

    it('应该格式化带有副标题的图书', () => {
      const formatter = new BookFormatter({});
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '机器学习',
        subtitle: '理论与实践',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 机器学习: 理论与实践[M]. 北京: 出版社, 2025.');
    });

    it('应该处理没有出版地的图书', () => {
      const formatter = new BookFormatter({});
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisher: '出版社',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 书名[M].');
    });

    it('应该处理没有出版者的图书', () => {
      const formatter = new BookFormatter({});
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 书名[M].');
    });

    it('应该处理没有年份的图书', () => {
      const formatter = new BookFormatter({});
      const reference: Book = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
      };
      const result = formatter.format(reference);
      expect(result).toBe('李四. 书名[M].');
    });
  });
});
