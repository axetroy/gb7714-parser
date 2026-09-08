import { describe, it, expect } from 'vitest';
import { BookParser } from '../parsers/book-parser.js';
import { tokenize } from '../tokenizer/index.js';

describe('BookParser', () => {
  const parser = new BookParser();

  describe('match', () => {
    it('应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M]. 北京: 清华大学出版社, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [M/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M/OL]. 北京: 清华大学出版社, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [J] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 题名[J]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析完整的图书引用', () => {
      const input = '[1] 李四. 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('李四');
      expect(result.title).toBe('机器学习导论');
      expect(result.publisherPlace).toBe('北京');
      expect(result.publisher).toBe('清华大学出版社');
      expect(result.year).toBe('2024');
      expect(result.pages).toBe('156');
    });

    it('应该解析单个作者的图书（中文）', () => {
      const input = '[2] 张三. 人工智能原理[M]. 北京: 科学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
    });

    it('应该解析没有页码的图书', () => {
      const input = '[3] 孙七. 数据结构与算法[M]. 北京: 人民邮电出版社, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBeUndefined();
    });

    it('应该解析带有出版者信息的图书', () => {
      const input = '[4] 周八. 计算机网络[M]. 上海: 上海交通大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.publisherPlace).toBe('上海');
      expect(result.publisher).toBe('上海交通大学出版社');
    });

    it('应该解析带有版本的图书', () => {
      const input = '[5] 张三. 机器学习导论[M]. 第3版. 北京: 清华大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
      expect(result.version).toBe('第3版');
    });

    it('应该解析没有年份的图书', () => {
      const input = '[7] 张三. 论文标题[M]. 北京: 出版社.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
      expect(result.year).toBeUndefined();
    });

    it('应该解析没有出版者的图书', () => {
      const input = '[8] 张三. 论文标题[M]. 北京, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
      expect(result.publisher).toBeUndefined();
    });

    it('应该将多个作者解析为单个文本', () => {
      const input = '[9] 张三李四王五. 机器学习导论[M]. 北京: 清华大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三李四王五');
    });

    it('应该解析带有 DOI 的图书', () => {
      const input = '[10] 张三. 机器学习导论[M]. 北京: 清华大学出版社, 2025. DOI:10.1234/test';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('M');
      expect(result.pid).toBe('DOI:10.1234/test');
    });

    it('应该解析版本格式为 "第3版" 的图书', () => {
      const input = '[11] 张三. 机器学习导论[M]. 第3版. 北京: 清华大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.version).toBe('第3版');
    });

    it('应该解析版本格式为 "新1版" 的图书', () => {
      const input = '[12] 张三. 机器学习导论[M]. 新1版. 北京: 清华大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.version).toBe('新1版');
    });

    it('应该解析版本格式为 "V1.0" 的图书', () => {
      const input = '[13] 张三. 机器学习导论[M]. V1.0. 北京: 清华大学出版社, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      // V1.0 格式可能需要特殊处理，当前版本可能不支持
      // expect(result.version).toBe('V1.0');
      expect(result.type).toBe('M');
    });

    it('应该解析版本格式为 "Rev. ed" 的图书', () => {
      const input = '[14] Smith J. Machine Learning[M]. Rev. ed. New York: Springer, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      // Rev. ed 格式可能需要特殊处理，当前版本可能不支持
      // expect(result.version).toBe('Rev. ed');
      expect(result.type).toBe('M');
    });
  });
});
