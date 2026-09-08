import { describe, it, expect } from 'vitest';
import { PatentParser } from '../../parsers/patent-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('PatentParser', () => {
  const parser = new PatentParser();

  describe('match', () => {
    it('should match [P] type indicator', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123[P].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [P/OL] type indicator', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123[P/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a patent reference with patent number', () => {
      const input = '[1] 张三. 人工智能方法: CN2025001[P]. 2025-09-07.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('P');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.title).toBe('人工智能方法');
      expect(result.patentNumber).toBe('CN2025001');
    });

    it('should parse patent with announce date', () => {
      const input = '[2] 李四. 机器学习装置: CN2025002[P]. 2024-12-01.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.announceDate).toBeDefined();
    });

    it('should parse patent with URL', () => {
      const input = '[3] 王五. 深度学习系统: CN2025003[P]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('should parse patent with multiple authors', () => {
      const input = '[4] 赵六，孙七. 数据处理方法: CN2025004[P].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(2);
    });
  });
});
