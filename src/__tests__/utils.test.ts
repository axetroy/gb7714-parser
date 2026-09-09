import { describe, it, expect } from 'vitest';
import { parseAuthors, formatAuthors, isValidDate, isValidYear, truncate, removeTrailingDot, normalizeWhitespace } from '../utils/index.js';

describe('Utils', () => {
  describe('parseAuthors', () => {
    it('应该解析空字符串', () => {
      expect(parseAuthors('')).toEqual([]);
      expect(parseAuthors('  ')).toEqual([]);
    });

    it('应该解析中文作者', () => {
      const result = parseAuthors('张三');
      expect(result).toEqual([{ name: '张三' }]);
    });

    it('应该解析多个中文作者', () => {
      const result = parseAuthors('张三，李四，王五');
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('张三');
      expect(result[1].name).toBe('李四');
      expect(result[2].name).toBe('王五');
    });

    it('应该解析英文作者', () => {
      const result = parseAuthors('John Smith');
      expect(result).toEqual([{ name: 'John Smith' }]);
    });

    it('应该解析机构作者', () => {
      const result = parseAuthors('中国计算机学会');
      expect(result).toEqual([{ name: '中国计算机学会', isOrganization: true }]);
    });

    it('应该解析带 Institute 的机构作者', () => {
      const result = parseAuthors('MIT Institute');
      expect(result).toEqual([{ name: 'MIT Institute', isOrganization: true }]);
    });

    it('应该解析带 University 的机构作者', () => {
      const result = parseAuthors('Beijing University');
      expect(result).toEqual([{ name: 'Beijing University', isOrganization: true }]);
    });

    it('应该解析带 Society 的机构作者', () => {
      const result = parseAuthors('IEEE Society');
      expect(result).toEqual([{ name: 'IEEE Society', isOrganization: true }]);
    });

    it('应该解析单个姓氏', () => {
      const result = parseAuthors('Smith');
      expect(result).toEqual([{ name: 'Smith' }]);
    });

    it('应该过滤 et al', () => {
      const result = parseAuthors('et al.');
      expect(result).toEqual([]);
    });

    it('应该过滤 et al（无点号）', () => {
      const result = parseAuthors('et al');
      expect(result).toEqual([]);
    });

    it('应该过滤 等', () => {
      const result = parseAuthors('等');
      expect(result).toEqual([]);
    });

    it('应该在作者列表中过滤 et al', () => {
      const result = parseAuthors('Smith J, Doe A, et al.');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Smith J');
      expect(result[1].name).toBe('Doe A');
    });

    it('应该在作者列表中过滤 等', () => {
      const result = parseAuthors('张三，李四，等');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('张三');
      expect(result[1].name).toBe('李四');
    });

    it('应该解析多个英文作者', () => {
      const result = parseAuthors('Smith J, Doe A, Johnson B');
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Smith J');
      expect(result[1].name).toBe('Doe A');
      expect(result[2].name).toBe('Johnson B');
    });

    it('应该解析带缩写名的作者', () => {
      const result = parseAuthors('A A Myburg');
      expect(result).toEqual([{ name: 'A A Myburg' }]);
    });

    it('应该解析多个中文作者', () => {
      const result = parseAuthors('张三，李四，王五，赵六');
      expect(result).toHaveLength(4);
    });
  });

  describe('formatAuthors', () => {
    it('应该格式化空数组', () => {
      expect(formatAuthors([])).toBe('');
    });

    it('应该格式化单个中文作者', () => {
      expect(formatAuthors([{ name: '张三' }])).toBe('张三');
    });

    it('应该格式化机构作者', () => {
      expect(formatAuthors([{ name: '中国计算机学会', isOrganization: true }])).toBe('中国计算机学会');
    });

    it('应该格式化多个作者（3个以内）', () => {
      const authors = [
        { name: '张三' },
        { name: '李四' },
        { name: '王五' },
      ];
      expect(formatAuthors(authors)).toBe('张三, 李四, 王五');
    });

    it('应该格式化多个作者（超过3个）', () => {
      const authors = [
        { name: '张三' },
        { name: '李四' },
        { name: '王五' },
        { name: '赵六' },
      ];
      expect(formatAuthors(authors)).toBe('张三, 李四, 王五, et al.');
    });
  });

  describe('isValidDate', () => {
    it('应该验证有效日期', () => {
      expect(isValidDate('2025-01-15')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
    });

    it('应该拒绝无效日期', () => {
      expect(isValidDate('2025/01/15')).toBe(false);
      expect(isValidDate('25-01-15')).toBe(false);
      expect(isValidDate('2025-1-15')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('isValidYear', () => {
    it('应该验证有效年份', () => {
      expect(isValidYear('2025')).toBe(true);
      expect(isValidYear('1999')).toBe(true);
    });

    it('应该拒绝无效年份', () => {
      expect(isValidYear('25')).toBe(false);
      expect(isValidYear('20250')).toBe(false);
      expect(isValidYear('')).toBe(false);
    });
  });

  describe('truncate', () => {
    it('应该截取长字符串', () => {
      expect(truncate('Hello World', 5)).toBe('He...');
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('不应该截取短字符串', () => {
      expect(truncate('Hi', 5)).toBe('Hi');
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('removeTrailingDot', () => {
    it('应该移除末尾句点', () => {
      expect(removeTrailingDot('Hello.')).toBe('Hello');
      expect(removeTrailingDot('Hello...')).toBe('Hello..');
    });

    it('不应该移除非末尾句点', () => {
      expect(removeTrailingDot('Hello.World')).toBe('Hello.World');
      expect(removeTrailingDot('Hello')).toBe('Hello');
    });
  });

  describe('normalizeWhitespace', () => {
    it('应该规范化空白字符', () => {
      expect(normalizeWhitespace('  Hello   World  ')).toBe('Hello World');
      expect(normalizeWhitespace('Hello\t\nWorld')).toBe('Hello World');
    });

    it('不应该修改单个空格', () => {
      expect(normalizeWhitespace('Hello World')).toBe('Hello World');
    });
  });
});
