import { describe, it, expect } from 'vitest';
import { StandardParser } from '../../parsers/standard-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('StandardParser', () => {
  const parser = new StandardParser();

  describe('match', () => {
    it('应该匹配 [S] 类型标识', () => {
      const tokens = tokenize('GB/T 3792—2021 标准名称[S].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [S/OL] 类型标识', () => {
      const tokens = tokenize('GB/T 3792—2021 标准名称[S/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('GB/T 3792—2021 标准名称.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有 GB 前缀的标准引用', () => {
      const input = 'GB/T 3792—2021 信息与文献馆藏操作[S].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('S');
      expect(result.standardNumber).toContain('GB/T');
      expect(result.standardName).toContain('信息与文献馆藏操作');
    });

    it('应该解析带有 GB 前缀（没有 /T）的标准引用', () => {
      const input = 'GB 7714—2015 信息与文献参考文献著录规则[S].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('S');
      expect(result.standardNumber).toContain('GB');
    });

    it('应该解析带有 URL 的标准', () => {
      const input = 'ISO 9001:2015 质量管理体系[S]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('应该解析没有 URL 的标准', () => {
      const input = 'GB/T 2828.1—2012 计数抽样检验程序[S].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBeUndefined();
    });
  });
});
