import { describe, it, expect } from 'vitest';
import { NewspaperParser } from '../../parsers/8.5-n-newspaper-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('NewspaperParser', () => {
  const parser = new NewspaperParser();

  describe('match', () => {
    it('应该匹配 [N] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 新闻标题[N]. 人民日报, 2025-09-07 (1).');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [N/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 新闻标题[N/OL]. 人民日报, 2025-09-07 (1).');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 新闻标题.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析报纸引用', () => {
      const input = '[1] 张三. 重要新闻[N]. 人民日报, 2025-09-07 (1).';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('N');
      expect(result.title).toContain('重要新闻');
    });

    it('应该解析带有作者的报纸', () => {
      const input = '[2] 李四. 经济报道[N]. 新华社, 2025-09-07 (5).';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThan(0);
    });

    it('应该解析带有日期的报纸', () => {
      const input = '[3] 王五. 科技新闻[N]. 科技日报, 2025-01-15 (3).';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.year).toBeDefined();
    });

    it('应该解析带有版次的报纸', () => {
      const input = '[4] 赵六. 体育报道[N]. 体坛周报, 2025-09-07 (8).';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('N');
    });

    it('应该解析带有 URL 的报纸', () => {
      const input = '[5] 张三. 网络新闻[N/OL]. 新华社, 2025-09-07 (1). https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBeDefined();
    });

    it('应该解析没有作者的报纸', () => {
      const input = '[6] 简短新闻[N]. 人民日报, 2025-09-07 (1).';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('N');
    });
  });
});
