import { describe, it, expect } from 'vitest';
import { ProceedingsParser } from '../../parsers/proceedings-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ProceedingsParser', () => {
  const parser = new ProceedingsParser();

  describe('match', () => {
    it('应该匹配 [C] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文[C]. 会议名，2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [C/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文[C/OL]. 会议名，2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 论文.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有会议信息的会议录引用', () => {
      const input = '[1] 张三. 人工智能应用[C]//大会, 2025: 100-110.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('C');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.title).toBe('人工智能应用');
    });

    it('应该解析没有会议信息的会议录引用', () => {
      const input = '[2] 李四. 机器学习[C].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('C');
      expect(result.title).toBe('机器学习');
    });

    it('应该解析带有多个作者的会议录', () => {
      const input = '[3] 王五，赵六. 深度学习[C].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(2);
      expect(result.authors[0].surname).toBe('王五');
      expect(result.authors[1].surname).toBe('赵六');
    });
  });
});
