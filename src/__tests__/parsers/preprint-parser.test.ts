import { describe, it, expect } from 'vitest';
import { PreprintParser } from '../../parsers/preprint-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('PreprintParser', () => {
  const parser = new PreprintParser();

  describe('match', () => {
    it('should match [PP] type indicator', () => {
      const tokens = tokenize('[1] 预印本标题[PP/OL]. https://arxiv.org');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [PP/OL] type indicator', () => {
      const tokens = tokenize('[1] 预印本标题[PP/OL]. https://arxiv.org');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 预印本标题. https://arxiv.org');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a preprint reference', () => {
      const input = '[1] 张三. 人工智能预印本[PP/OL]. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('PP');
      expect(result.title).toBe('人工智能预印本');
    });

    it('should parse preprint with access date', () => {
      const input = '[2] 李四. 机器学习预印本[PP/OL]. [2025-09-07]. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.accessDate).toBeDefined();
    });

    it('should parse preprint with version', () => {
      const input = '[3] 赵六. 自然语言处理预印本[PP/OL]. v1.0. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.version).toBeDefined();
    });

    it('should parse preprint with URL', () => {
      const input = '[4] 孙七. 计算机视觉预印本[PP/OL]. https://arxiv.org/abs/2025.001';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toContain('arxiv.org');
    });
  });
});
