import { describe, it, expect } from 'vitest';
import { JournalParser } from '../parsers/journal-parser.js';
import { tokenize } from '../tokenizer/index.js';

describe('JournalParser', () => {
  const parser = new JournalParser();

  describe('match', () => {
    it('应该匹配 [J] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 题名[J]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [J/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 题名[J/OL]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 题名[M]. 出版地: 出版社, 2025.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 题名.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析完整的期刊引用', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，(2)：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(2);
      expect(result.authors[0].name).toBe('张三');
      expect(result.authors[1].name).toBe('李四');
      expect(result.title).toBe('人工智能在教育中的应用');
      expect(result.journalTitle).toBe('现代教育技术');
      expect(result.year).toBe('2025');
      expect(result.issue).toBe('2');
      expect(result.pages).toBe('15-22');
    });

    it('应该解析单个作者的期刊', () => {
      const input = '[2] 王五. 深度学习研究[J]. 计算机学报，2024，1：100-115.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('王五');
      expect(result.journalTitle).toBe('计算机学报');
      expect(result.year).toBe('2024');
    });

    it('应该解析没有期号的期刊', () => {
      const input = '[3] 赵六. 机器学习综述[J]. 人工智能，2025：1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.issue).toBeUndefined();
    });

    it('应该解析没有页码的期刊', () => {
      const input = '[4] 孙七. 自然语言处理[J]. 语言科学，2025，2.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.pages).toBeUndefined();
    });

    it('应该解析没有卷号的期刊', () => {
      const input = '[5] 周八. 机器学习综述[J]. 人工智能，2025(2)：1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.volume).toBeUndefined();
      expect(result.issue).toBe('2');
    });

    it('应该解析没有年份的期刊', () => {
      const input = '[8] 张三. 论文标题[J]. 期刊名，35(2)：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.year).toBe('');
    });

    it('应该解析没有卷号和期号的期刊', () => {
      const input = '[9] 张三. 论文标题[J]. 期刊名，2025：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.volume).toBeUndefined();
      expect(result.issue).toBeUndefined();
    });

    it('应该解析带有 DOI 的期刊', () => {
      const input = '[10] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22. DOI:10.1234/test';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.pid).toBe('DOI:10.1234/test');
    });

    it('应该解析 DOI 在末尾的期刊', () => {
      const input = '[11] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22. DOI:10.1234/test.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.pid).toContain('DOI:10.1234/test');
    });
  });
});
