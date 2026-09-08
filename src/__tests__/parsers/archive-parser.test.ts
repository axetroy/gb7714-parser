import { describe, it, expect } from 'vitest';
import { ArchiveParser } from '../../parsers/archive-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ArchiveParser', () => {
  const parser = new ArchiveParser();

  describe('match', () => {
    it('should match [A] type indicator', () => {
      const tokens = tokenize('[1] 档案标题[A].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [A/OL] type indicator', () => {
      const tokens = tokenize('[1] 档案标题[A/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 档案标题.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse an archive reference', () => {
      const input = '[1] 张三. 档案: No456[A]. 北京: 档案馆, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('A');
      expect(result.title).toContain('档案');
    });

    it('should parse archive with archive number', () => {
      const input = '[2] 李四. 重要档案: ABC123[A].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.archiveNumber).toContain('ABC123');
    });

    it('should parse archive with collection place', () => {
      const input = '[3] 王五. 历史档案[A]. 上海: 上海档案馆, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.collectionPlace).toBeDefined();
    });

    it('should parse archive with URL', () => {
      const input = '[4] 赵六. 电子档案[A]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });
  });
});
