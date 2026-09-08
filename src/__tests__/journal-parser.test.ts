import { describe, it, expect } from 'vitest';
import { JournalParser } from '../parsers/journal-parser.js';
import { tokenize } from '../tokenizer/index.js';

describe('JournalParser', () => {
  const parser = new JournalParser();

  describe('match', () => {
    it('should match [J] type indicator', () => {
      const tokens = tokenize('[1] 张三. 题名[J]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [J/OL] type indicator', () => {
      const tokens = tokenize('[1] 张三. 题名[J/OL]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 题名[M]. 出版地: 出版社, 2025.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 张三. 题名.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a complete journal reference', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，(2)：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(2);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.authors[1].surname).toBe('李四');
      expect(result.title).toBe('人工智能在教育中的应用');
      expect(result.journalTitle).toBe('现代教育技术');
      expect(result.year).toBe('2025');
      expect(result.issue).toBe('2');
      expect(result.pages).toBe('15-22');
    });

    it('should parse journal with single author', () => {
      const input = '[2] 王五. 深度学习研究[J]. 计算机学报，2024，1：100-115.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('王五');
      expect(result.journalTitle).toBe('计算机学报');
      expect(result.year).toBe('2024');
    });

    it('should parse journal without issue', () => {
      const input = '[3] 赵六. 机器学习综述[J]. 人工智能，2025：1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.issue).toBeUndefined();
    });

    it('should parse journal without pages', () => {
      const input = '[4] 孙七. 自然语言处理[J]. 语言科学，2025，2.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.pages).toBeUndefined();
    });

    it('should parse journal without volume', () => {
      const input = '[5] 周八. 机器学习综述[J]. 人工智能，2025(2)：1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.volume).toBeUndefined();
      expect(result.issue).toBe('2');
    });

    it('should parse journal without year', () => {
      const input = '[8] 张三. 论文标题[J]. 期刊名，35(2)：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.year).toBe('');
    });

    it('should parse journal without volume and issue', () => {
      const input = '[9] 张三. 论文标题[J]. 期刊名，2025：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.volume).toBeUndefined();
      expect(result.issue).toBeUndefined();
    });
  });
});
