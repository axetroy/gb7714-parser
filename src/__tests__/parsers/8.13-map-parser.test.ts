import { describe, it, expect } from 'vitest';
import { MapParser } from '../../parsers/8.13-map-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('MapParser', () => {
  const parser = new MapParser();

  describe('match', () => {
    it('应该匹配 [CM] 类型标识', () => {
      const tokens = tokenize('[1] 地图标题[CM].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [CM/OL] 类型标识', () => {
      const tokens = tokenize('[1] 地图标题[CM/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 地图标题.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析地图引用', () => {
      const input = '[1] 张三. 北京地图[CM]. 北京: 地图出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('CM');
      expect(result.title).toContain('北京地图');
    });

    it('应该解析带有比例尺的地图', () => {
      const input = '[2] 李四. 中国地图. 1 : 25 000[CM].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.scale).toBeDefined();
    });

    it('应该解析带有出版者信息的地图', () => {
      const input = '[3] 王五. 世界地图[CM]. 北京: 中国地图出版社, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.publisherPlace).toBeDefined();
      expect(result.publisher).toBeDefined();
    });

    it('应该解析带有 URL 的地图', () => {
      const input = '[4] 孙七. 电子地图[CM]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });
  });
});
