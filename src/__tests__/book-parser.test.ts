import { describe, it, expect } from 'vitest';
import { BookParser } from '../parsers/book-parser.js';
import { tokenize } from '../tokenizer/index.js';

describe('BookParser', () => {
  const parser = new BookParser();

  describe('match', () => {
    it('should match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M]. 北京: 清华大学出版社, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [M/OL] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M/OL]. 北京: 清华大学出版社, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [J] type indicator', () => {
      const tokens = tokenize('[1] 张三. 题名[J]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a complete book reference', () => {
      const input = '[1] 李四. 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('李四');
      expect(result.title).toBe('机器学习导论');
      expect(result.publisherPlace).toBe('北京');
      expect(result.publisher).toBe('清华大学出版社');
      expect(result.year).toBe('2024');
      expect(result.pages).toBe('156');
    });

    it('should parse book with single author (Chinese)', () => {
      const input = '[2] 张三. 人工智能原理[M]. 北京: 科学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
    });

    it('should parse book without pages', () => {
      const input = '[3] 孙七. 数据结构与算法[M]. 北京: 人民邮电出版社, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBeUndefined();
    });

    it('should parse book with publisher info', () => {
      const input = '[4] 周八. 计算机网络[M]. 上海: 上海交通大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.publisherPlace).toBe('上海');
      expect(result.publisher).toBe('上海交通大学出版社');
    });
  });
});
