import { describe, it, expect } from 'vitest';
import { ComponentPartParser } from '../../parsers/component-part-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ComponentPartParser', () => {
  const parser = new ComponentPartParser();

  describe('match', () => {
    it('should match when contains //', () => {
      const tokens = tokenize('[1] 张三. 析出文献//图书作者. 图书题名.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match when no //', () => {
      const tokens = tokenize('[1] 张三. 题名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should match with multiple //', () => {
      const tokens = tokenize('[1] 张三. 析出文献//作者1. 书1//作者2. 书2.');
      expect(parser.match(tokens)).toBe(true);
    });
  });

  describe('parse', () => {
    it('should parse a component part reference', () => {
      const input = '[1] 张三. 人工智能综述//李四. 人工智能导论. 北京: 清华大学出版社, 2024: 100-120.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('人工智能综述');
      expect(result.host).toBeDefined();
    });

    it('should parse component part with host authors', () => {
      const input = '[2] 王五. 深度学习//赵六，孙七. 机器学习手册. 上海: 上海交通大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.host.authors).toBeDefined();
    });

    it('should parse component part with pages', () => {
      const input = '[3] 周八. 自然语言处理//吴九. AI基础. 北京: 科学出版社, 2024: 50-75.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBe('50-75');
    });

    it('should parse component part with URL', () => {
      const input = '[4] 王十一. 计算机网络//网络技术. 北京: 电子工业出版社, 2024. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });
  });
});
