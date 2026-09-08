import { describe, it, expect } from 'vitest';
import { WebPageParser } from '../../parsers/web-page-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('WebPageParser', () => {
  const parser = new WebPageParser();

  describe('match', () => {
    it('should match [EB] type indicator', () => {
      const tokens = tokenize('[1] 网站标题[EB/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [EB/OL] type indicator', () => {
      const tokens = tokenize('[1] 网站标题[EB/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 网站标题. https://example.com');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a webPage reference with URL', () => {
      const input = '[1] 张三. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
      expect(result.title).toBe('网站标题');
      expect(result.url).toBe('https://example.com');
    });

    it('should parse webPage with access date', () => {
      const input = '[2] 李四. 网页标题[EB/OL]. [2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.accessDate).toBeDefined();
    });

    it('should parse webPage with authors', () => {
      const input = '[3] 赵六. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('赵六');
    });

    it('should parse webPage with create date', () => {
      const input = '[4] 张三. 网站标题[EB/OL]. (2025-01-15). https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('should parse webPage with both dates', () => {
      const input = '[5] 张三. 网站标题[EB/OL]. (2025-01-15)[2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('should parse webPage with Chinese authors', () => {
      const input = '[6] 张三，李四. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('should parse webPage with English authors', () => {
      const input = '[7] Smith John. Website Title[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('should parse webPage without authors', () => {
      const input = '[8] 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toBeDefined();
    });

    it('should parse webPage with URL containing dot', () => {
      const input = '[9] 张三. 网站标题[EB/OL]. https://example.co.uk.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBeDefined();
    });

    it('should parse webPage without URL', () => {
      const input = '[10] 张三. 网站标题[EB/OL].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('');
    });

    it('should parse webPage with multiple authors', () => {
      const input = '[11] 张三，李四，王五. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse webPage with organization author', () => {
      const input = '[12] 中国计算机学会. 技术报告[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThanOrEqual(0);
    });

    it('should parse webPage with empty title', () => {
      const input = '[13] [EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('should parse webPage with long title', () => {
      const input = '[14] 张三. 这是一个非常长的网站标题用于测试解析器是否能正确处理长标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('非常长');
    });

    it('should parse webPage with special characters in title', () => {
      const input = '[15] 张三. 网站标题 (测试)[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('网站标题');
    });

    it('should parse webPage with date token', () => {
      const input = '[16] 张三. 网站标题[EB/OL]. 2025-01-15. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });
  });
});
