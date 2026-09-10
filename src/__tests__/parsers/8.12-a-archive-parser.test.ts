import { describe, it, expect } from 'vitest';
import { ArchiveParser } from '../../parsers/8.12-a-archive-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ArchiveParser', () => {
  const parser = new ArchiveParser();

  describe('match', () => {
    it('应该匹配 [A] 类型标识', () => {
      const tokens = tokenize('[1] 档案标题[A].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [A/OL] 类型标识', () => {
      const tokens = tokenize('[1] 档案标题[A/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 档案标题.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析档案引用', () => {
      const input = '[1] 张三. 档案: No456[A]. 北京: 档案馆, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('A');
      expect(result.title).toContain('档案');
    });

    it('应该解析带有档案号的档案', () => {
      const input = '[2] 李四. 重要档案: ABC123[A].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.archiveNumber).toContain('ABC123');
    });

    it('应该解析带有收藏地的档案', () => {
      const input = '[3] 王五. 历史档案[A]. 上海: 上海档案馆, 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.collectionPlace).toBeDefined();
    });

    it('应该解析带有 URL 的档案', () => {
      const input = '[4] 赵六. 电子档案[A]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('应该解析没有作者的档案', () => {
      const input = '[5] 无名档案[A]. 北京: 档案馆, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('A');
      expect(result.authors).toHaveLength(0);
      expect(result.title).toBe('无名档案');
    });

    it('应该解析带有多个作者的档案', () => {
      const input = '[6] 张三, 李四. 合作档案[A]. 北京: 档案馆, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThan(0);
    });

    it('应该解析带有英文作者的档案', () => {
      const input = '[7] Smith John. Archive Record[A]. New York: Archives, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('A');
    });

    it('应该解析带有 OL 媒体类型的档案', () => {
      const input = '[8] 电子档案[A/OL]. 北京: 档案馆, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.mediaType).toBe('OL');
    });

    it('应该解析标题中没有冒号的档案', () => {
      const input = '[9] 张三. 简单档案[A]. 北京: 档案馆, 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('A');
      expect(result.title).toContain('简单档案');
    });

    it('应该解析只有收藏者的档案（没有逗号）', () => {
      const input = '[10] 档案[A]. 北京: 北京档案馆';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('A');
    });
  });
});
