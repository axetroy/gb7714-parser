import { describe, it, expect } from 'vitest';
import { SerialParser } from '../../parsers/8.4-j-serial-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('SerialParser', () => {
  const parser = new SerialParser();

  describe('match', () => {
    it('应该匹配带有破折号模式的连续出版物', () => {
      const tokens = tokenize('[1] 中华医学会湖北分会. 临床内科杂志[J]. 1984, 1(1)—. 武汉: 中华医学会湖北分会, 1984—.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配带有年份范围的连续出版物', () => {
      const tokens = tokenize('[2] 中国图书馆学会. 图书馆学通讯[J]. 1957(1)—1990(4). 北京: 北京图书馆, 1957—1990.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配普通的期刊文章', () => {
      const tokens = tokenize('[1] 张三. 论文标题[J]. 期刊名, 2025, 35(2): 15-22.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 临床内科杂志. 1984, 1(1)—.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析连续出版物引用', () => {
      const input = '[1] 中华医学会湖北分会. 临床内科杂志[J]. 1984, 1(1)—. 武汉: 中华医学会湖北分会, 1984—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.serialTitle).toBe('临床内科杂志');
      expect(result.startYear).toBe('1984');
      expect(result.startVolume).toBe('1');
      expect(result.startIssue).toBe('1');
    });

    it('应该解析带有年份范围的连续出版物', () => {
      const input = '[2] 中国图书馆学会. 图书馆学通讯[J]. 1957(1)—1990(4). 北京: 北京图书馆, 1957—1990.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.serialTitle).toBe('图书馆学通讯');
      expect(result.startYear).toBe('1957');
      expect(result.endYear).toBe('1990');
    });

    it('应该解析带有出版者信息的连续出版物', () => {
      const input = '[3] American Association for the Advancement of Science. Science[J]. 1883, 1(1)—. Washington, D. C.: American Association for the Advancement of Science, 1883—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.serialTitle).toBe('Science');
      expect(result.publisherPlace).toBe('Washington, D. C.');
      expect(result.publisher).toBe('American Association for the Advancement of Science');
      expect(result.publicationStartYear).toBe('1883');
    });

    it('应该解析带有 URL 的连续出版物', () => {
      const input = '[4] Public Library Quarterly[J/OL]. 1979, 1(1)—. Philadelphia: Taylor & Francis, 1979—. http://www.tandfonline.com/journals/wplq20.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.url).toBe('http://www.tandfonline.com/journals/wplq20');
    });

    it('应该解析没有卷号的连续出版物', () => {
      const input = '[5] 某期刊[J]. 2020(1)—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.startYear).toBe('2020');
      expect(result.startIssue).toBe('1');
      expect(result.startVolume).toBeUndefined();
    });

    it('应该解析带有作者的连续出版物', () => {
      const input = '[6] 张三, 李四. 某期刊[J]. 2020(1)—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors.length).toBe(2);
      expect(result.authors[0].name).toBe('张三');
      expect(result.authors[1].name).toBe('李四');
    });
  });
});
