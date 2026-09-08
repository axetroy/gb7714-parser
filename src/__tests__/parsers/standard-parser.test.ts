import { describe, it, expect } from 'vitest';
import { StandardParser } from '../../parsers/standard-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('StandardParser', () => {
  const parser = new StandardParser();

  describe('match', () => {
    it('should match [S] type indicator', () => {
      const tokens = tokenize('GB/T 3792—2021 标准名称[S].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [S/OL] type indicator', () => {
      const tokens = tokenize('GB/T 3792—2021 标准名称[S/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('GB/T 3792—2021 标准名称.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a standard reference with GB prefix', () => {
      const input = 'GB/T 3792—2021 信息与文献馆藏操作[S].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('S');
      expect(result.standardNumber).toContain('GB/T');
      expect(result.standardName).toContain('信息与文献馆藏操作');
    });

    it('should parse a standard reference with GB prefix (no /T)', () => {
      const input = 'GB 7714—2015 信息与文献参考文献著录规则[S].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('S');
      expect(result.standardNumber).toContain('GB');
    });

    it('should parse standard with URL', () => {
      const input = 'ISO 9001:2015 质量管理体系[S]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('should parse standard without URL', () => {
      const input = 'GB/T 2828.1—2012 计数抽样检验程序[S].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBeUndefined();
    });
  });
});
