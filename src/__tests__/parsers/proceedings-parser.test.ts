import { describe, it, expect } from 'vitest';
import { ProceedingsParser } from '../../parsers/proceedings-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ProceedingsParser', () => {
  const parser = new ProceedingsParser();

  describe('match', () => {
    it('should match [C] type indicator', () => {
      const tokens = tokenize('[1] 张三. 论文[C]. 会议名，2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [C/OL] type indicator', () => {
      const tokens = tokenize('[1] 张三. 论文[C/OL]. 会议名，2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 张三. 论文.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a proceedings reference with conference info', () => {
      const input = '[1] 张三. 人工智能应用[C]//大会, 2025: 100-110.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('C');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.title).toBe('人工智能应用');
    });

    it('should parse proceedings reference without conference info', () => {
      const input = '[2] 李四. 机器学习[C].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('C');
      expect(result.title).toBe('机器学习');
    });

    it('should parse proceedings with multiple authors', () => {
      const input = '[3] 王五，赵六. 深度学习[C].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(2);
      expect(result.authors[0].surname).toBe('王五');
      expect(result.authors[1].surname).toBe('赵六');
    });
  });
});
