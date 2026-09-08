import { describe, it, expect } from 'vitest';
import { ComponentPartParser } from '../../parsers/component-part-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ComponentPartParser', () => {
  const parser = new ComponentPartParser();

  describe('match', () => {
    it('当包含 // 时应该匹配', () => {
      const tokens = tokenize('[1] 张三. 析出文献//图书作者. 图书题名.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('当没有 // 时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 题名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('应该匹配多个 //', () => {
      const tokens = tokenize('[1] 张三. 析出文献//作者1. 书1//作者2. 书2.');
      expect(parser.match(tokens)).toBe(true);
    });
  });

  describe('parse', () => {
    it('应该解析析出文献引用', () => {
      const input = '[1] 张三. 人工智能综述//李四. 人工智能导论. 北京: 清华大学出版社, 2024: 100-120.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('人工智能综述');
      expect(result.host).toBeDefined();
    });

    it('应该解析带有主机作者的析出文献', () => {
      const input = '[2] 王五. 深度学习//赵六，孙七. 机器学习手册. 上海: 上海交通大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.host.authors).toBeDefined();
    });

    it('应该解析带有页码的析出文献', () => {
      const input = '[3] 周八. 自然语言处理//吴九. AI基础. 北京: 科学出版社, 2024: 50-75.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBe('50-75');
    });

    it('应该解析带有 URL 的析出文献', () => {
      const input = '[4] 王十一. 计算机网络//网络技术. 北京: 电子工业出版社, 2024. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('应该从析出文献标题继承类型标识', () => {
      const input = '[5] 张三. 析出文献[M]//李四. 图书题名. 北京: 出版社, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
    });

    it('应该继承期刊类型标识', () => {
      const input = '[6] 张三. 论文标题[J]//李四. 期刊名, 2024, 10(2): 15-20.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
    });

    it('当析出文献标题中没有类型标识时应该默认为 Z', () => {
      const input = '[7] 张三. 析出文献//李四. 图书题名. 北京: 出版社, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('Z');
    });
  });
});
