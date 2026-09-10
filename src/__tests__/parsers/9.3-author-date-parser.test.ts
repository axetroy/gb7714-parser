import { describe, it, expect } from 'vitest';
import { AuthorDateParser } from '../../parsers/9.3-author-date-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('AuthorDateParser', () => {
  const parser = new AuthorDateParser();

  describe('match', () => {
    it('应该匹配作者-年份格式', () => {
      const tokens = tokenize('(张三, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配带有多个作者的格式', () => {
      const tokens = tokenize('(张三, 李四, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配数字格式', () => {
      const tokens = tokenize('[1] 张三. 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有括号时不应该匹配', () => {
      const tokens = tokenize('张三, 2025. 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有年份时不应该匹配', () => {
      const tokens = tokenize('(张三, 论文标题)[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析作者-年份引用', () => {
      const input = '(张三, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('张三');
      expect(result.year).toBe('2025');
    });

    it('应该解析带有多个作者的格式', () => {
      const input = '(张三, 李四, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThan(0);
    });

    it('应该解析带有 id 的格式', () => {
      const input = '[1] (张三, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens, { preserveId: true });

      // Note: author-date parser doesn't preserve id by default
      expect(result.type).toBe('J');
    });
  });
});
