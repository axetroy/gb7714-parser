import { describe, it, expect } from 'vitest';
import { Tokenizer, tokenize } from '../tokenizer/index.js';

describe('Tokenizer', () => {
  describe('tokenize', () => {
    it('should tokenize a simple journal reference', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.';
      const tokens = tokenize(input);

      expect(tokens).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);

      // 检查关键 token 类型
      const types = tokens.map(t => t.type);
      expect(types).toContain('BRACKET_OPEN');
      expect(types).toContain('NUMBER');
      expect(types).toContain('BRACKET_CLOSE');
      expect(types).toContain('TYPE_INDICATOR');
    });

    it('should handle empty input', () => {
      const tokens = tokenize('');
      expect(tokens).toEqual([]);
    });

    it('should tokenize brackets', () => {
      const tokens = tokenize('[1]');
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('BRACKET_OPEN');
      expect(tokens[1].type).toBe('NUMBER');
      expect(tokens[2].type).toBe('BRACKET_CLOSE');
    });

    it('should tokenize type indicators', () => {
      const tokens = tokenize('[J]');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TYPE_INDICATOR');
      expect(tokens[0].value).toBe('[J]');
    });

    it('should tokenize type indicators with OL suffix', () => {
      const tokens = tokenize('[J/OL]');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TYPE_INDICATOR');
      expect(tokens[0].value).toBe('[J/OL]');
    });

    it('should tokenize dates', () => {
      const tokens = tokenize('2025');
      expect(tokens.some(t => t.type === 'YEAR')).toBe(true);
    });

    it('should tokenize full dates', () => {
      const tokens = tokenize('2025-09-07');
      expect(tokens.some(t => t.type === 'DATE')).toBe(true);
    });

    it('should tokenize URLs', () => {
      const tokens = tokenize('https://example.com');
      expect(tokens.some(t => t.type === 'URL')).toBe(true);
    });

    it('should tokenize punctuation', () => {
      const tokens = tokenize('.，：；/');
      expect(tokens.some(t => t.type === 'DOT')).toBe(true);
      expect(tokens.some(t => t.type === 'COMMA')).toBe(true);
      expect(tokens.some(t => t.type === 'COLON')).toBe(true);
      expect(tokens.some(t => t.type === 'SEMICOLON')).toBe(true);
      expect(tokens.some(t => t.type === 'SLASH')).toBe(true);
    });

    it('should tokenize double slash', () => {
      const tokens = tokenize('//');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('DOUBLE_SLASH');
    });

    it('should tokenize parentheses', () => {
      const tokens = tokenize('(2)');
      expect(tokens.some(t => t.type === 'PAREN_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_CLOSE')).toBe(true);
    });

    it('should tokenize dashes', () => {
      const tokens = tokenize('15-22');
      expect(tokens.some(t => t.type === 'DASH')).toBe(true);
    });
  });

  describe('Tokenizer class', () => {
    it('should create a Tokenizer instance', () => {
      const tokenizer = new Tokenizer('test');
      expect(tokenizer).toBeInstanceOf(Tokenizer);
    });

    it('should tokenize input string', () => {
      const tokenizer = new Tokenizer('[J]');
      const tokens = tokenizer.tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TYPE_INDICATOR');
    });
  });
});
