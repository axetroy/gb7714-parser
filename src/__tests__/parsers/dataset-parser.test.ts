import { describe, it, expect } from 'vitest';
import { DatasetParser } from '../../parsers/dataset-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('DatasetParser', () => {
  const parser = new DatasetParser();

  describe('match', () => {
    it('should match [DS] type indicator', () => {
      const tokens = tokenize('[1] 数据集标题[DS/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [DS/OL] type indicator', () => {
      const tokens = tokenize('[1] 数据集标题[DS/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 数据集标题. https://example.com');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a dataset reference', () => {
      const input = '[1] 张三. 测试数据集[DS/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('DS');
      expect(result.title).toBe('测试数据集');
    });

    it('should parse dataset with access date', () => {
      const input = '[2] 李四. 研究数据集[DS/OL]. [2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.accessDate).toBeDefined();
    });

    it('should parse dataset with version', () => {
      const input = '[3] 王五. 人口数据集[DS/OL]. v2.0. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.version).toBeDefined();
    });

    it('should parse dataset with URL', () => {
      const input = '[4] 孙七. 经济数据集[DS/OL]. https://data.example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://data.example.com');
    });
  });
});
