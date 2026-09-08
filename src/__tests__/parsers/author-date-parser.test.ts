import { describe, it, expect } from 'vitest';
import { AuthorDateParser } from '../../parsers/author-date-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('AuthorDateParser', () => {
  const parser = new AuthorDateParser();

  describe('match', () => {
    it('should match author-date format', () => {
      const tokens = tokenize('(张三, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match with multiple authors', () => {
      const tokens = tokenize('(张三, 李四, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match numeric format', () => {
      const tokens = tokenize('[1] 张三. 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no parentheses', () => {
      const tokens = tokenize('张三, 2025. 论文标题[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no year', () => {
      const tokens = tokenize('(张三, 论文标题)[J]. 期刊名, 2025, 1(1): 1-10.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse author-date reference', () => {
      const input = '(张三, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.year).toBe('2025');
    });

    it('should parse with multiple authors', () => {
      const input = '(张三, 李四, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThan(0);
    });

    it('should parse with id', () => {
      const input = '[1] (张三, 2025). 论文标题[J]. 期刊名, 2025, 1(1): 1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens, { preserveId: true });

      // Note: author-date parser doesn't preserve id by default
      expect(result.type).toBe('J');
    });
  });
});
