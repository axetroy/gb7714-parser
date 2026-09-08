import { describe, it, expect } from 'vitest';
import { parse, parseAll, validate, format } from '../index.js';

describe('API', () => {
  describe('parse', () => {
    it('should parse a journal reference', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，2：15-22.';
      const result = parse(input);

      expect(result.reference.type).toBe('J');
      expect(result.reference.authors).toHaveLength(2);
      expect(result.reference.title).toBe('人工智能在教育中的应用');
    });

    it('should parse a book reference', () => {
      const input = '[1] 李四. 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.';
      const result = parse(input);

      expect(result.reference.type).toBe('M');
      expect(result.reference.title).toBe('机器学习导论');
    });

    it('should parse without preserveId by default', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);

      expect(result.reference.id).toBeUndefined();
    });

    it('should return warnings for unsupported format', () => {
      const input = '张三 论文标题';
      const result = parse(input);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('parseAll', () => {
    it('should parse multiple references', () => {
      const inputs = [
        '[1] 张三. 论文1[J]. 期刊1，2025，1：1-10.',
        '[2] 李四. 书1[M]. 北京: 出版社, 2024.',
      ];
      const results = parseAll(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].reference.type).toBe('J');
      expect(results[1].reference.type).toBe('M');
    });
  });

  describe('validate', () => {
    it('should validate a correct reference', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const report = validate(result.reference);

      expect(report.valid).toBe(true);
    });

    it('should validate with version option', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const report = validate(result.reference, { version: '2015' });

      expect(report.valid).toBe(true);
    });
  });

  describe('format', () => {
    it('should format a reference to string', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const formatted = format(result.reference);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('张三');
      expect(formatted).toContain('论文标题');
    });

    it('should format with options', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const formatted = format(result.reference, { version: '2015' });

      expect(typeof formatted).toBe('string');
    });
  });

  describe('DOI parsing', () => {
    it('should parse DOI from journal reference', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10. DOI:10.1234/test';
      const result = parse(input);

      expect(result.reference.pid).toBe('DOI:10.1234/test');
    });

    it('should parse DOI from book reference', () => {
      const input = '[1] 张三. 书名[M]. 北京: 出版社, 2025. DOI:10.1234/test';
      const result = parse(input);

      expect(result.reference.pid).toBe('DOI:10.1234/test');
    });

    it('should handle reference without DOI', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);

      expect(result.reference.pid).toBeUndefined();
    });
  });
});
