import { describe, it, expect } from 'vitest';
import { ReportParser } from '../../parsers/report-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ReportParser', () => {
  const parser = new ReportParser();

  describe('match', () => {
    it('should match [R] type indicator', () => {
      const tokens = tokenize('[1] 张三. 报告[R]. 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [R/OL] type indicator', () => {
      const tokens = tokenize('[1] 张三. 报告[R/OL]. 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 张三. 报告.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a report reference with report number', () => {
      const input = '[1] 张三. 研究报告: No123[R]. 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('R');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.title).toBe('研究报告');
      expect(result.reportNumber).toContain('No123');
    });

    it('should parse a report reference without report number', () => {
      const input = '[2] 李四. 调查报告[R]. 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('R');
      expect(result.title).toBe('调查报告');
    });

    it('should parse report with release date', () => {
      const input = '[3] 王五. 技术报告[R]. 2025-01-01.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.releaseDate).toBeDefined();
    });

    it('should parse report with pages', () => {
      const input = '[4] 孙七. 项目报告[R]. 2025: 50.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBe('50');
    });
  });
});
