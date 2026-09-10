import { describe, it, expect } from 'vitest';
import { DatasetParser } from '../../parsers/8.14-ds-dataset-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('DatasetParser', () => {
  const parser = new DatasetParser();

  describe('match', () => {
    it('应该匹配 [DS] 类型标识', () => {
      const tokens = tokenize('[1] 数据集标题[DS/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [DS/OL] 类型标识', () => {
      const tokens = tokenize('[1] 数据集标题[DS/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 数据集标题. https://example.com');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析数据集引用', () => {
      const input = '[1] 张三. 测试数据集[DS/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('DS');
      expect(result.title).toBe('测试数据集');
    });

    it('应该解析带有访问日期的数据集', () => {
      const input = '[2] 李四. 研究数据集[DS/OL]. [2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.accessDate).toBeDefined();
    });

    it('应该解析带有版本的数据集', () => {
      const input = '[3] 王五. 人口数据集[DS/OL]. v2.0. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.version).toBeDefined();
    });

    it('应该解析带有 URL 的数据集', () => {
      const input = '[4] 孙七. 经济数据集[DS/OL]. https://data.example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://data.example.com');
    });
  });
});
