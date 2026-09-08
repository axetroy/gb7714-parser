import { describe, it, expect } from 'vitest';
import { MapParser } from '../../parsers/map-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('MapParser', () => {
  const parser = new MapParser();

  describe('match', () => {
    it('should match [CM] type indicator', () => {
      const tokens = tokenize('[1] 地图标题[CM].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [CM/OL] type indicator', () => {
      const tokens = tokenize('[1] 地图标题[CM/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 地图标题.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a map reference', () => {
      const input = '[1] 张三. 北京地图[CM]. 北京: 地图出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('CM');
      expect(result.title).toContain('北京地图');
    });

    it('should parse map with scale', () => {
      const input = '[2] 李四. 中国地图. 1 : 25 000[CM].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.scale).toBeDefined();
    });

    it('should parse map with publisher info', () => {
      const input = '[3] 王五. 世界地图[CM]. 北京: 中国地图出版社, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.publisherPlace).toBeDefined();
      expect(result.publisher).toBeDefined();
    });

    it('should parse map with URL', () => {
      const input = '[4] 孙七. 电子地图[CM]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });
  });
});
