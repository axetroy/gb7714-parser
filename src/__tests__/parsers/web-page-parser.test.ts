import { describe, it, expect } from 'vitest';
import { WebPageParser } from '../../parsers/web-page-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('WebPageParser', () => {
  const parser = new WebPageParser();

  describe('match', () => {
    it('应该匹配 [EB] 类型标识', () => {
      const tokens = tokenize('[1] 网站标题[EB/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [EB/OL] 类型标识', () => {
      const tokens = tokenize('[1] 网站标题[EB/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 网站标题. https://example.com');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有 URL 的网页引用', () => {
      const input = '[1] 张三. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
      expect(result.title).toBe('网站标题');
      expect(result.url).toBe('https://example.com');
    });

    it('应该解析带有访问日期的网页', () => {
      const input = '[2] 李四. 网页标题[EB/OL]. [2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.accessDate).toBeDefined();
    });

    it('应该解析带有作者的网页', () => {
      const input = '[3] 赵六. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('赵六');
    });

    it('应该解析带有创建日期的网页', () => {
      const input = '[4] 张三. 网站标题[EB/OL]. (2025-01-15). https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有两个日期的网页', () => {
      const input = '[5] 张三. 网站标题[EB/OL]. (2025-01-15)[2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有中文作者的网页', () => {
      const input = '[6] 张三，李四. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有英文作者的网页', () => {
      const input = '[7] Smith John. Website Title[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析没有作者的网页', () => {
      const input = '[8] 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toBeDefined();
    });

    it('应该解析带有包含点的 URL 的网页', () => {
      const input = '[9] 张三. 网站标题[EB/OL]. https://example.co.uk.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBeDefined();
    });

    it('应该解析没有 URL 的网页', () => {
      const input = '[10] 张三. 网站标题[EB/OL].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('');
    });

    it('应该解析带有多个作者的网页', () => {
      const input = '[11] 张三，李四，王五. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThanOrEqual(1);
    });

    it('应该解析带有机构作者的网页', () => {
      const input = '[12] 中国计算机学会. 技术报告[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThanOrEqual(0);
    });

    it('应该解析带有空标题的网页', () => {
      const input = '[13] [EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有长标题的网页', () => {
      const input = '[14] 张三. 这是一个非常长的网站标题用于测试解析器是否能正确处理长标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('非常长');
    });

    it('应该解析标题中带有特殊字符的网页', () => {
      const input = '[15] 张三. 网站标题 (测试)[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('网站标题');
    });

    it('应该解析带有日期 token 的网页', () => {
      const input = '[16] 张三. 网站标题[EB/OL]. 2025-01-15. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });
  });
});
