import { describe, it, expect } from 'vitest';
import { PreprintParser } from '../../parsers/8.15-pp-preprint-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('PreprintParser', () => {
  const parser = new PreprintParser();

  describe('match', () => {
    it('应该匹配 [PP] 类型标识', () => {
      const tokens = tokenize('[1] 预印本标题[PP/OL]. https://arxiv.org');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [PP/OL] 类型标识', () => {
      const tokens = tokenize('[1] 预印本标题[PP/OL]. https://arxiv.org');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 预印本标题. https://arxiv.org');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析预印本引用', () => {
      const input = '[1] 张三. 人工智能预印本[PP/OL]. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('PP');
      expect(result.title).toBe('人工智能预印本');
    });

    it('应该解析带有访问日期的预印本', () => {
      const input = '[2] 李四. 机器学习预印本[PP/OL]. [2025-09-07]. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.accessDate).toBeDefined();
    });

    it('应该解析带有版本的预印本', () => {
      const input = '[3] 赵六. 自然语言处理预印本[PP/OL]. v1.0. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.version).toBeDefined();
    });

    it('应该解析带有 URL 的预印本', () => {
      const input = '[4] 孙七. 计算机视觉预印本[PP/OL]. https://arxiv.org/abs/2025.001';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toContain('arxiv.org');
    });

    it('应该解析没有作者的预印本', () => {
      const input = '[5] 无作者预印本[PP/OL]. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('PP');
      expect(result.authors).toHaveLength(0);
      expect(result.title).toBe('无作者预印本');
    });

    it('应该解析带有多个作者的预印本', () => {
      const input = '[6] 张三, 李四, 王五. 多作者预印本[PP/OL]. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThan(0);
    });

    it('应该解析带有创建日期的预印本', () => {
      const input = '[7] 张三. 预印本[PP/OL]. arXiv (2025-01-15). https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('PP');
    });

    it('应该解析带有平台的预印本', () => {
      const input = '[8] 张三. 预印本[PP/OL]. arXiv. https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('PP');
    });

    it('应该解析带有 PID 的预印本', () => {
      const input = '[9] 张三. 预印本[PP/OL]. https://arxiv.org. DOI:10.1234/test';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('PP');
    });

    it('应该解析带有括号版本的预印本', () => {
      const input = '[10] 张三. 预印本[PP/OL]. (v1.0). https://arxiv.org';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('PP');
    });
  });
});
