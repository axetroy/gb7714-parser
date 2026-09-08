import { describe, it, expect } from 'vitest';
import { DatabaseParser } from '../../parsers/database-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('DatabaseParser', () => {
  const parser = new DatabaseParser();

  describe('match', () => {
    it('should match [DB] type indicator', () => {
      const tokens = tokenize('[1] 数据库名[DB].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match [DB/OL] type indicator', () => {
      const tokens = tokenize('[1] 数据库名[DB/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match [J] type indicator', () => {
      const tokens = tokenize('[1] 作者. 论文[J].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 作者. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse basic database', () => {
      const tokens = tokenize('[1] 学术论文数据库[DB]. 北京: 中国知网, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('学术论文数据库');
      expect(result.databaseName).toBe('学术论文数据库');
    });

    it('should parse database with author', () => {
      const tokens = tokenize('[1] 张三. 学术论文数据库[DB]. 北京: 中国知网, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('学术论文数据库');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].surname).toBe('张三');
    });

    it('should parse database with publisher info', () => {
      const tokens = tokenize('[1] 期刊数据库[DB]. 北京: 万方数据股份有限公司, 2024.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('期刊数据库');
      expect(result.publisherPlace).toBe('北京');
      expect(result.publisher).toBe('万方数据股份有限公司');
      expect(result.year).toBe('2024');
    });

    it('should parse database with media type', () => {
      const tokens = tokenize('[1] 期刊数据库[DB/OL]. 重庆: 重庆维普资讯有限公司, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('期刊数据库');
      expect(result.mediaType).toBe('OL');
    });

    it('should parse database with URL', () => {
      const tokens = tokenize('[1] 学术期刊数据库[DB]. 北京: 同方知网, 2025. https://www.cnki.net');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('学术期刊数据库');
      expect(result.url).toBe('https://www.cnki.net');
    });

    it('should parse database without author', () => {
      const tokens = tokenize('[1] 专利数据库[DB]. 北京: 国家知识产权局, 2025.');
      const result = parser.parse(tokens);

      expect(result.type).toBe('DB');
      expect(result.title).toBe('专利数据库');
      expect(result.authors).toHaveLength(0);
    });
  });
});
