import { describe, it, expect } from 'vitest';
import { parse, parseAll, validate, format, formatCitation, parseCitation } from '../index.js';
import { ReferenceType } from '../types/index.js';

describe('API', () => {
  describe('parse', () => {
    it('应该解析期刊引用', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，2：15-22.';
      const result = parse(input);

      expect(result.reference.type).toBe('J');
      expect(result.reference.authors).toHaveLength(2);
      expect(result.reference.title).toBe('人工智能在教育中的应用');
    });

    it('应该解析图书引用', () => {
      const input = '[1] 李四. 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.';
      const result = parse(input);

      expect(result.reference.type).toBe('M');
      expect(result.reference.title).toBe('机器学习导论');
    });

    it('默认不应该保留 id', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);

      expect(result.reference.id).toBeUndefined();
    });

    it('应该对不支持的格式返回警告', () => {
      const input = '张三 论文标题';
      const result = parse(input);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('parseAll', () => {
    it('应该解析多个引用', () => {
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
    it('应该验证正确的引用', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const report = validate(result.reference);

      expect(report.valid).toBe(true);
    });

    it('应该使用版本选项进行验证', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const report = validate(result.reference, { version: '2015' });

      expect(report.valid).toBe(true);
    });
  });

  describe('format', () => {
    it('应该将引用格式化为字符串', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const formatted = format(result.reference);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('张三');
      expect(formatted).toContain('论文标题');
    });

    it('应该使用选项进行格式化', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);
      const formatted = format(result.reference, { version: '2015' });

      expect(typeof formatted).toBe('string');
    });
  });

  describe('DOI parsing', () => {
    it('应该从期刊引用中解析 DOI', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10. DOI:10.1234/test';
      const result = parse(input);

      expect(result.reference.pid).toBe('DOI:10.1234/test');
    });

    it('应该从图书引用中解析 DOI', () => {
      const input = '[1] 张三. 书名[M]. 北京: 出版社, 2025. DOI:10.1234/test';
      const result = parse(input);

      expect(result.reference.pid).toBe('DOI:10.1234/test');
    });

    it('应该处理没有 DOI 的引用', () => {
      const input = '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.';
      const result = parse(input);

      expect(result.reference.pid).toBeUndefined();
    });
  });

  describe('formatCitation', () => {
    it('应该格式化数字引用', () => {
      const reference = {
        id: '1',
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const citation = formatCitation(reference);

      expect(citation).toBe('[1]');
    });

    it('应该格式化作者-年份引用', () => {
      const reference = {
        id: '1',
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const citation = formatCitation(reference, { citationStyle: 'author-date' });

      expect(citation).toContain('张三');
      expect(citation).toContain('2025');
    });
  });

  describe('parseCitation', () => {
    it('应该解析数字引用 [1]', () => {
      const result = parseCitation('[1]');
      expect(result.type).toBe('numeric');
      expect(result.ids).toEqual(['1']);
    });

    it('应该解析数字引用 [1,2,3]', () => {
      const result = parseCitation('[1,2,3]');
      expect(result.type).toBe('numeric');
      expect(result.ids).toEqual(['1', '2', '3']);
    });

    it('应该解析数字引用 [1-5]', () => {
      const result = parseCitation('[1-5]');
      expect(result.type).toBe('numeric');
      expect(result.ids).toEqual(['1', '2', '3', '4', '5']);
    });

    it('应该解析作者-年份引用 (张三, 2025)', () => {
      const result = parseCitation('(张三, 2025)');
      expect(result.type).toBe('author-date');
      expect(result.author).toBe('张三');
      expect(result.year).toBe('2025');
    });

    it('应该解析带有后缀的作者-年份引用', () => {
      const result = parseCitation('(张三, 2025, p. 10)');
      expect(result.type).toBe('author-date');
      expect(result.author).toBe('张三');
      expect(result.year).toBe('2025');
      expect(result.suffix).toBe('p. 10');
    });

    it('应该处理无法识别的格式', () => {
      const result = parseCitation('unknown format');
      expect(result.type).toBe('numeric');
      expect(result.ids).toEqual(['unknown format']);
    });
  });
});
