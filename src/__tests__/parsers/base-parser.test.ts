import { describe, it, expect } from 'vitest';
import { Parser, type ParserStrategy } from '../../parsers/base.js';
import { tokenize } from '../../tokenizer/index.js';
import { ReferenceType } from '../../types/index.js';

describe('Parser (base.ts)', () => {
  describe('Parser class', () => {
    it('should register and use a strategy', () => {
      const parser = new Parser();
      const mockStrategy: ParserStrategy = {
        match: (tokens) => tokens.some(t => t.value === 'test'),
        parse: () => ({
          type: ReferenceType.J,
          authors: [],
          title: 'Test Title',
        }),
      };

      parser.register(mockStrategy);
      const tokens = tokenize('[J] test content');
      const result = parser.parse(tokens);

      expect(result.reference.title).toBe('Test Title');
      expect(result.warnings).toHaveLength(0);
    });

    it('should try multiple strategies in order', () => {
      const parser = new Parser();
      let matchOrder: string[] = [];

      const strategy1: ParserStrategy = {
        match: () => {
          matchOrder.push('strategy1');
          return false;
        },
        parse: () => ({
          type: ReferenceType.J,
          authors: [],
          title: 'From Strategy 1',
        }),
      };

      const strategy2: ParserStrategy = {
        match: () => {
          matchOrder.push('strategy2');
          return true;
        },
        parse: () => ({
          type: ReferenceType.M,
          authors: [],
          title: 'From Strategy 2',
        }),
      };

      parser.register(strategy1);
      parser.register(strategy2);

      const tokens = tokenize('[M] test content');
      parser.parse(tokens);

      expect(matchOrder).toEqual(['strategy1', 'strategy2']);
    });

    it('should catch errors from strategy.parse() and add warning', () => {
      const parser = new Parser();
      const errorStrategy: ParserStrategy = {
        match: () => true,
        parse: () => {
          throw new Error('Parse error occurred');
        },
      };

      parser.register(errorStrategy);

      const tokens = tokenize('test content');
      const result = parser.parse(tokens);

      // After error, it falls back to generic parser
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('解析失败') || w.includes('通用解析器'))).toBe(true);
    });

    it('should catch non-Error throws and add warning', () => {
      const parser = new Parser();
      const errorStrategy: ParserStrategy = {
        match: () => true,
        parse: () => {
          throw 'string error';
        },
      };

      parser.register(errorStrategy);

      const tokens = tokenize('test content');
      const result = parser.parse(tokens);

      // After error, it falls back to generic parser
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('string error') || w.includes('通用解析器'))).toBe(true);
    });

    it('should fall back to generic parser when no strategy matches', () => {
      const parser = new Parser();
      const falseStrategy: ParserStrategy = {
        match: () => false,
        parse: () => ({
          type: ReferenceType.J,
          authors: [],
          title: 'Should not be called',
        }),
      };

      parser.register(falseStrategy);

      const tokens = tokenize('[Z] test content');
      const result = parser.parse(tokens);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('通用解析器');
    });
  });

  describe('parseGeneric', () => {
    it('should handle tokens with type indicator', () => {
      const parser = new Parser();
      const tokens = tokenize('[Z] 张三. 测试标题');
      const result = parser.parse(tokens);

      expect(result.reference.type).toBe('Z');
      expect(result.reference.title).toBe('测试标题');
      expect(result.warnings).toContain('使用通用解析器，结果可能不完整');
    });

    it('should handle tokens with two text tokens (author + title)', () => {
      const parser = new Parser();
      const tokens = tokenize('张三. 测试标题');
      const result = parser.parse(tokens);

      expect(result.reference.authors).toHaveLength(1);
      expect(result.reference.authors[0].surname).toBe('张三');
      expect(result.reference.title).toBe('测试标题');
    });

    it('should handle tokens with only one text token (title)', () => {
      const parser = new Parser();
      const tokens = tokenize('测试标题');
      const result = parser.parse(tokens);

      expect(result.reference.authors).toHaveLength(0);
      expect(result.reference.title).toBe('测试标题');
    });

    it('should handle multiple authors as single text', () => {
      const parser = new Parser();
      const tokens = tokenize('张三李四. 测试标题');
      const result = parser.parse(tokens);

      // Without commas in text, it's treated as single author
      expect(result.reference.authors).toHaveLength(1);
      expect(result.reference.authors[0].surname).toBe('张三李四');
    });

    it('should preserve id when preserveId option is true', () => {
      const parser = new Parser();
      const tokens = tokenize('[42] 测试标题');
      const result = parser.parse(tokens, { preserveId: true });

      expect(result.reference.id).toBe('42');
    });

    it('should not preserve id when preserveId option is false', () => {
      const parser = new Parser();
      const tokens = tokenize('[42] 测试标题');
      const result = parser.parse(tokens, { preserveId: false });

      expect(result.reference.id).toBeUndefined();
    });

    it('should handle tokens without type indicator', () => {
      const parser = new Parser();
      const tokens = tokenize('张三. 测试标题');
      const result = parser.parse(tokens);

      expect(result.reference.type).toBe('Z');
    });

    it('should handle tokens with only brackets and type', () => {
      const parser = new Parser();
      const tokens = tokenize('[1] [J]');
      const result = parser.parse(tokens);

      expect(result.reference.type).toBe('J');
    });
  });

  describe('parseAuthors', () => {
    it('should handle single author', () => {
      const parser = new Parser();
      const tokens = tokenize('张三. 测试标题');
      const result = parser.parse(tokens);

      expect(result.reference.authors).toHaveLength(1);
      expect(result.reference.authors[0].surname).toBe('张三');
    });
  });
});
