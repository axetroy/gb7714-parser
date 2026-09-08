import { describe, it, expect } from 'vitest';
import { PatentParser } from '../../parsers/patent-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('PatentParser', () => {
  const parser = new PatentParser();

  describe('match', () => {
    it('应该匹配 [P] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123[P].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [P/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123[P/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有专利号的专利引用', () => {
      const input = '[1] 张三. 人工智能方法: CN2025001[P]. 2025-09-07.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('P');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.title).toBe('人工智能方法');
      expect(result.patentNumber).toBe('CN2025001');
    });

    it('应该解析带有公告日期的专利', () => {
      const input = '[2] 李四. 机器学习装置: CN2025002[P]. 2024-12-01.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.announceDate).toBeDefined();
    });

    it('应该解析带有 URL 的专利', () => {
      const input = '[3] 王五. 深度学习系统: CN2025003[P]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('应该解析带有多个作者的专利', () => {
      const input = '[4] 赵六，孙七. 数据处理方法: CN2025004[P].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(2);
    });
  });
});
