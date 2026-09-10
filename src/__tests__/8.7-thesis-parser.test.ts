import { describe, it, expect } from 'vitest';
import { ThesisParser } from '../parsers/8.7-thesis-parser.js';
import { tokenize } from '../tokenizer/index.js';

describe('ThesisParser', () => {
  const parser = new ThesisParser();

  describe('match', () => {
    it('应该匹配 [D] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文题目[D]. 北京: 北京大学, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [D/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文题目[D/OL]. 北京: 北京大学, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M]. 北京: 清华大学出版社, 2025.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析完整的学位论文引用', () => {
      const input = '[1] 王五. 深度学习在自然语言处理中的应用[D]. 北京: 北京大学, 2025: 89.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('D');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('王五');
      expect(result.title).toBe('深度学习在自然语言处理中的应用');
      expect(result.awardPlace).toBe('北京');
      expect(result.awardInstitution).toBe('北京大学');
      expect(result.awardYear).toBe('2025');
      expect(result.pages).toBe('89');
    });

    it('应该解析带有授予地的学位论文', () => {
      const input = '[2] 赵六. 机器学习算法研究[D]. 上海: 上海交通大学, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.awardPlace).toBe('上海');
      expect(result.awardInstitution).toBe('上海交通大学');
      expect(result.awardYear).toBe('2024');
    });

    it('应该解析带有 URL 的学位论文', () => {
      const input = '[3] 孙七. 计算机视觉[D]. 北京: 北京大学, 2025. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('应该解析没有页码的学位论文', () => {
      const input = '[4] 周八. 数据挖掘[D]. 广州: 中山大学, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBeUndefined();
    });

    it('应该保留学位授予地中的空格', () => {
      const input = '[5] Smith J. Deep learning[D]. New York: Columbia University, 2023.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.awardPlace).toBe('New York');
      expect(result.awardInstitution).toBe('Columbia University');
      expect(result.awardYear).toBe('2023');
    });

    it('应该保留学位授予单位和授予地中的多个空格', () => {
      const input = '[6] author. Research[D]. Boston  MA:  Massachusetts  Institute  of  Technology, 2022.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.awardPlace).toBe('Boston  MA');
      expect(result.awardInstitution).toBe('Massachusetts  Institute  of  Technology');
      expect(result.awardYear).toBe('2022');
    });
  });
});
