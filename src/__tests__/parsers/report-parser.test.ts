import { describe, it, expect } from 'vitest';
import { ReportParser } from '../../parsers/report-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ReportParser', () => {
  const parser = new ReportParser();

  describe('match', () => {
    it('应该匹配 [R] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 报告[R]. 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [R/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 报告[R/OL]. 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 报告.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有报告号的报告引用', () => {
      const input = '[1] 张三. 研究报告: No123[R]. 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('R');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.title).toBe('研究报告');
      expect(result.reportNumber).toContain('No123');
    });

    it('应该解析没有报告号的报告引用', () => {
      const input = '[2] 李四. 调查报告[R]. 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('R');
      expect(result.title).toBe('调查报告');
    });

    it('应该解析带有发布日期的报告', () => {
      const input = '[3] 王五. 技术报告[R]. 2025-01-01.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.releaseDate).toBeDefined();
    });

    it('应该解析带有页码的报告', () => {
      const input = '[4] 孙七. 项目报告[R]. 2025: 50.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBe('50');
    });
  });
});
