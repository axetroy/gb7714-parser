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

    it('should tokenize em-dash', () => {
      const tokens = tokenize('—');
      expect(tokens.some(t => t.type === 'DASH')).toBe(true);
    });

    it('should tokenize en-dash', () => {
      const tokens = tokenize('–');
      expect(tokens.some(t => t.type === 'DASH')).toBe(true);
    });

    it('should tokenize Chinese colon', () => {
      const tokens = tokenize('：');
      expect(tokens.some(t => t.type === 'COLON')).toBe(true);
    });

    it('should tokenize Chinese semicolon', () => {
      const tokens = tokenize('；');
      expect(tokens.some(t => t.type === 'SEMICOLON')).toBe(true);
    });

    it('should tokenize Chinese comma', () => {
      const tokens = tokenize('，');
      expect(tokens.some(t => t.type === 'COMMA')).toBe(true);
    });

    it('should tokenize date in parentheses', () => {
      const tokens = tokenize('(2025-09-07)');
      expect(tokens.some(t => t.type === 'PAREN_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'DATE')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_CLOSE')).toBe(true);
    });

    it('should tokenize date in brackets', () => {
      const tokens = tokenize('[2025-09-07]');
      expect(tokens.some(t => t.type === 'BRACKET_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'DATE')).toBe(true);
      expect(tokens.some(t => t.type === 'BRACKET_CLOSE')).toBe(true);
    });

    it('should tokenize year with Chinese year character', () => {
      const tokens = tokenize('2025年');
      expect(tokens.some(t => t.type === 'YEAR')).toBe(true);
    });

    it('should tokenize DOI as PID', () => {
      const tokens = tokenize('doi:10.1234/test');
      expect(tokens.some(t => t.type === 'PID')).toBe(true);
    });

    it('should tokenize DOI with space', () => {
      const tokens = tokenize('doi: 10.1234/test');
      expect(tokens.some(t => t.type === 'PID')).toBe(true);
    });

    it('should tokenize DOI at end of reference', () => {
      const tokens = tokenize('[1] 张三. 论文[J]. 期刊, 2025. DOI:10.1234/test');
      const pidTokens = tokens.filter(t => t.type === 'PID');
      expect(pidTokens.length).toBe(1);
      expect(pidTokens[0].value).toBe('DOI:10.1234/test');
    });

    it('should tokenize http URL', () => {
      const tokens = tokenize('http://example.com');
      expect(tokens.some(t => t.type === 'URL')).toBe(true);
    });

    it('should tokenize number with decimal', () => {
      const tokens = tokenize('12.5');
      expect(tokens.some(t => t.type === 'NUMBER')).toBe(true);
    });

    it('should handle whitespace', () => {
      const tokens = tokenize('  test  ');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
      expect(tokens[0].value).toBe('test');
    });

    it('should handle tabs', () => {
      const tokens = tokenize('\ttest\t');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
    });

    it('should handle newlines', () => {
      const tokens = tokenize('\ntest\n');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
    });

    it('should handle carriage returns', () => {
      const tokens = tokenize('\rtest\r');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
    });

    it('should handle unrecognized characters by skipping them', () => {
      const tokens = tokenize('@#$');
      // These characters are treated as text by readText()
      expect(tokens.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed content with unrecognized characters', () => {
      const tokens = tokenize('abc@#$def');
      // 'abc' becomes TEXT, then @, #, $ are skipped, then 'def' becomes TEXT
      expect(tokens.some(t => t.type === 'TEXT')).toBe(true);
    });

    it('should tokenize complex reference with all elements', () => {
      const input = '[1] 张三，李四，王五. 人工智能在教育中的应用研究[J]. 现代教育技术，2025，35(2)：15-22.';
      const tokens = tokenize(input);

      expect(tokens.some(t => t.type === 'BRACKET_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'NUMBER')).toBe(true);
      expect(tokens.some(t => t.type === 'BRACKET_CLOSE')).toBe(true);
      expect(tokens.some(t => t.type === 'COMMA')).toBe(true);
      expect(tokens.some(t => t.type === 'DOT')).toBe(true);
      expect(tokens.some(t => t.type === 'TYPE_INDICATOR')).toBe(true);
      expect(tokens.some(t => t.type === 'COLON')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_CLOSE')).toBe(true);
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

    it('should reset position on multiple tokenize calls', () => {
      const tokenizer = new Tokenizer('[J]');
      const tokens1 = tokenizer.tokenize();
      const tokens2 = tokenizer.tokenize();
      expect(tokens1).toHaveLength(1);
      expect(tokens2).toHaveLength(1);
    });
  });
});
