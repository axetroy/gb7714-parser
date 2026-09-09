import { describe, it, expect } from 'vitest';
import { DatabaseParser } from '../../parsers/database-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('DatabaseParser', () => {
  const parser = new DatabaseParser();

  describe('match', () => {
    it('应该匹配 [DB] 类型标识', () => {
      const tokens = tokenize('[1] 数据库名[DB].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [DB/OL] 类型标识', () => {
      const tokens = tokenize('[1] 数据库名[DB/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [J] 类型标识', () => {
      const tokens = tokenize('[1] 作者. 论文[J].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 作者. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析基本的数据库', () => {
      const tokens = tokenize('[1] 学术论文数据库[DB]. 北京: 中国知网, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('学术论文数据库');
      expect(result.databaseName).toBe('学术论文数据库');
    });

    it('应该解析带有作者的数据库', () => {
      const tokens = tokenize('[1] 张三. 学术论文数据库[DB]. 北京: 中国知网, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('学术论文数据库');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('张三');
    });

    it('应该解析带有出版者信息的数据库', () => {
      const tokens = tokenize('[1] 期刊数据库[DB]. 北京: 万方数据股份有限公司, 2024.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('期刊数据库');
      expect(result.publisherPlace).toBe('北京');
      expect(result.publisher).toBe('万方数据股份有限公司');
      expect(result.year).toBe('2024');
    });

    it('应该解析带有媒体类型的数据库', () => {
      const tokens = tokenize('[1] 期刊数据库[DB/OL]. 重庆: 重庆维普资讯有限公司, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('期刊数据库');
      expect(result.mediaType).toBe('OL');
    });

    it('应该解析带有 URL 的数据库', () => {
      const tokens = tokenize('[1] 学术期刊数据库[DB]. 北京: 同方知网, 2025. https://www.cnki.net');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('学术期刊数据库');
      expect(result.url).toBe('https://www.cnki.net');
    });

    it('应该解析没有作者的数据库', () => {
      const tokens = tokenize('[1] 专利数据库[DB]. 北京: 国家知识产权局, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('专利数据库');
      expect(result.authors).toHaveLength(0);
    });

    it('应该解析带有多个作者的数据库', () => {
      const tokens = tokenize('[2] 张三, 李四. 数据库[DB]. 北京: 出版社, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.authors.length).toBeGreaterThan(0);
    });

    it('应该解析带有英文作者的数据库', () => {
      const tokens = tokenize('[3] Smith J. Database[DB]. New York: Publisher, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
    });

    it('应该解析带有 PID 的数据库', () => {
      const tokens = tokenize('[4] 数据库[DB]. 北京: 出版社, 2025. DOI:10.1234/test');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
    });
  });
});
