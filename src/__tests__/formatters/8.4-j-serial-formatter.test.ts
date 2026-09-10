import { describe, it, expect } from 'vitest';
import { SerialFormatter } from '../../formatter/types/8.4-j-serial-formatter.js';
import type { Serial, ReferenceUnion } from '../../types/index.js';

describe('SerialFormatter', () => {
  const formatter = new SerialFormatter({});

  describe('format', () => {
    it('应该格式化连续出版物', () => {
      const reference: Serial = {
        type: 'J' as never,
        authors: [{ name: '中华医学会湖北分会' }],
        title: '临床内科杂志',
        serialTitle: '临床内科杂志',
        startYear: '1984',
        startVolume: '1',
        startIssue: '1',
        endYear: undefined,
        publisherPlace: '武汉',
        publisher: '中华医学会湖北分会',
        publicationStartYear: '1984',
      };
      const result = formatter.format(reference as ReferenceUnion);
      expect(result).toBe('中华医学会湖北分会. 临床内科杂志[J]. 1984, 1(1)—. 武汉: 中华医学会湖北分会, 1984—.');
    });

    it('应该格式化带有年份范围的连续出版物', () => {
      const reference: Serial = {
        type: 'J' as never,
        authors: [{ name: '中国图书馆学会' }],
        title: '图书馆学通讯',
        serialTitle: '图书馆学通讯',
        startYear: '1957',
        startIssue: '1',
        endYear: '1990',
        endIssue: '4',
        publisherPlace: '北京',
        publisher: '北京图书馆',
        publicationStartYear: '1957',
        publicationEndYear: '1990',
      };
      const result = formatter.format(reference as ReferenceUnion);
      expect(result).toBe('中国图书馆学会. 图书馆学通讯[J]. 1957(1)—1990(4). 北京: 北京图书馆, 1957—1990.');
    });

    it('应该格式化带有续篇部分的连续出版物', () => {
      const reference: Serial = {
        type: 'J' as never,
        serialTitle: '期刊名',
        startYear: '2011',
        startVolume: '33',
        startIssue: '2',
        continuationParts: ['2011, 33 (3): 26-30'],
        authors: [],
        title: '期刊名',
      };
      const result = formatter.format(reference as ReferenceUnion);
      expect(result).toContain('2011, 33(2)—; 2011, 33 (3): 26-30');
    });

    it('应该格式化没有出版者的连续出版物', () => {
      const formatter = new SerialFormatter({});
      const reference: Serial = {
        type: 'J' as never,
        authors: [{ name: '测试' }],
        title: '测试刊',
        serialTitle: '测试刊',
        startYear: '2020',
        startVolume: '1',
        startIssue: '1',
      };
      const result = formatter.format(reference as ReferenceUnion);
      expect(result).toContain('测试刊[J]');
    });
  });
});
