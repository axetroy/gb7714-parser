import { describe, it, expect } from 'vitest';
import { SerialParser } from '../../parsers/serial-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('SerialParser', () => {
  const parser = new SerialParser();

  describe('match', () => {
    it('should match serial publication with dash pattern', () => {
      const tokens = tokenize('[1] 中华医学会湖北分会. 临床内科杂志[J]. 1984, 1(1)—. 武汉: 中华医学会湖北分会, 1984—.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should match serial publication with year range', () => {
      const tokens = tokenize('[2] 中国图书馆学会. 图书馆学通讯[J]. 1957(1)—1990(4). 北京: 北京图书馆, 1957—1990.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('should not match regular journal article', () => {
      const tokens = tokenize('[1] 张三. 论文标题[J]. 期刊名, 2025, 35(2): 15-22.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match [M] type indicator', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('should not match when no type indicator', () => {
      const tokens = tokenize('[1] 临床内科杂志. 1984, 1(1)—.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a serial publication reference', () => {
      const input = '[1] 中华医学会湖北分会. 临床内科杂志[J]. 1984, 1(1)—. 武汉: 中华医学会湖北分会, 1984—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.serialTitle).toBe('临床内科杂志');
      expect(result.startYear).toBe('1984');
      expect(result.startVolume).toBe('1');
      expect(result.startIssue).toBe('1');
    });

    it('should parse serial with year range', () => {
      const input = '[2] 中国图书馆学会. 图书馆学通讯[J]. 1957(1)—1990(4). 北京: 北京图书馆, 1957—1990.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.serialTitle).toBe('图书馆学通讯');
      expect(result.startYear).toBe('1957');
      expect(result.endYear).toBe('1990');
    });

    it('should parse serial with publisher info', () => {
      const input = '[3] American Association for the Advancement of Science. Science[J]. 1883, 1(1)—. Washington, D. C.: American Association for the Advancement of Science, 1883—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.serialTitle).toBe('Science');
      expect(result.publisherPlace).toBe('Washington, D. C.');
      expect(result.publisher).toBe('American Association for the Advancement of Science');
      expect(result.publicationStartYear).toBe('1883');
    });

    it('should parse serial with URL', () => {
      const input = '[4] Public Library Quarterly[J/OL]. 1979, 1(1)—. Philadelphia: Taylor & Francis, 1979—. http://www.tandfonline.com/journals/wplq20.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.url).toBe('http://www.tandfonline.com/journals/wplq20');
    });

    it('should parse serial without volume', () => {
      const input = '[5] 某期刊[J]. 2020(1)—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.startYear).toBe('2020');
      expect(result.startIssue).toBe('1');
      expect(result.startVolume).toBeUndefined();
    });

    it('should parse serial with authors', () => {
      const input = '[6] 张三, 李四. 某期刊[J]. 2020(1)—.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors.length).toBe(2);
      expect(result.authors[0].surname).toBe('张三');
      expect(result.authors[1].surname).toBe('李四');
    });
  });
});
