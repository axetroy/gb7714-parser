import { describe, it, expect } from 'vitest';
import { ThesisParser } from '../parsers/thesis-parser.js';
import { tokenize } from '../tokenizer/index.js';

describe('ThesisParser', () => {
  const parser = new ThesisParser();

  describe('match', () => {
    it('should match [D] type indicator', () => {
      const tokens = tokenize('[1] 张三. 论文题目[D]. 北京: 北京大学, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [D/OL] type indicator', () => {
      const tokens = tokenize('[1] 张三. 论文题目[D/OL]. 北京: 北京大学, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M]. 北京: 清华大学出版社, 2025.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a complete thesis reference', () => {
      const input = '[1] 王五. 深度学习在自然语言处理中的应用[D]. 北京: 北京大学, 2025: 89.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('D');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('王五');
      expect(result.title).toBe('深度学习在自然语言处理中的应用');
      expect(result.awardPlace).toBe('北京');
      expect(result.awardInstitution).toBe('北京大学');
      expect(result.awardYear).toBe('2025');
      expect(result.pages).toBe('89');
    });

    it('should parse thesis with award place', () => {
      const input = '[2] 赵六. 机器学习算法研究[D]. 上海: 上海交通大学, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.awardPlace).toBe('上海');
      expect(result.awardInstitution).toBe('上海交通大学');
      expect(result.awardYear).toBe('2024');
    });

    it('should parse thesis with URL', () => {
      const input = '[3] 孙七. 计算机视觉[D]. 北京: 北京大学, 2025. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('should parse thesis without pages', () => {
      const input = '[4] 周八. 数据挖掘[D]. 广州: 中山大学, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBeUndefined();
    });
  });
});
