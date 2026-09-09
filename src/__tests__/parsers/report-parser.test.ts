import { describe, it, expect } from 'vitest';
import { ReportParser } from '../../parsers/report-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ReportParser', () => {
  const parser = new ReportParser();

  describe('match', () => {
    it('应该匹配 [R] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 报告[R]. 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [R/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 报告[R/OL]. 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 报告.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有报告号的报告引用', () => {
      const input = '[1] 张三. 研究报告: No123[R]. 2025.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('R');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('张三');
      expect(result.title).toBe('研究报告');
      expect(result.reportNumber).toContain('No123');
    });

    it('应该解析没有报告号的报告引用', () => {
      const input = '[2] 李四. 调查报告[R]. 2024.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('R');
      expect(result.title).toBe('调查报告');
    });

    it('应该解析带有发布日期的报告', () => {
      const input = '[3] 王五. 技术报告[R]. 2025-01-01.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.releaseDate).toBeDefined();
    });

    it('应该解析带有页码的报告', () => {
      const input = '[4] 孙七. 项目报告[R]. 2025: 50.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.pages).toBe('50');
    });

    it('应该解析在线报告的URL', () => {
      const input = '[1] 张三. 研究报告[R/OL]. 2025. http://example.com/report.pdf.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('R');
      expect(result.url).toBe('http://example.com/report.pdf');
    });
  });

  describe('标准 §8.8 示例', () => {
    it('例[1] 应解析中文在线报告（含报告编号、发布日期、URL）', () => {
      const input =
        '[1] 汤万金，杨跃翔，刘文，等. 人体安全重要技术标准研制最终报告: 7178999X-2006BAK04A 10/10. 2013[R/OL]. 2013-09-30. http://www.nstrs.cn/xiangxiBG.aspx?id=41707.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('R');
      expect(r.authors).toHaveLength(3);
      expect(r.authors[0].name).toBe('汤万金');
      expect(r.title).toBe('人体安全重要技术标准研制最终报告');
      expect(r.reportNumber).toBe('7178999X-2006BAK04A 10/10');
      expect(r.releaseDate).toBe('2013-09-30');
      expect(r.url).toBe('http://www.nstrs.cn/xiangxiBG.aspx?id=41707');
      expect(r.mediaType).toBe('OL');
    });

    it('例[2] 应解析双冒号结构的在线报告（副题名格式）', () => {
      const input =
        '[2] 中国信息通信研究院，中国电信股份有限公司研究院，中国移动通信研究院，等. 电信业发展白皮书：2023：新时代高质量发展探索[R/OL]. 2023-12-28. http://www.caict.ac.cn/kxyj/qwfb/bps/202312/P020240326615399026294.pdf.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('R');
      expect(r.authors).toHaveLength(3);
      expect(r.authors[0].name).toBe('中国信息通信研究院');
      expect(r.title).toBe('电信业发展白皮书');
      expect(r.subtitle).toBe('新时代高质量发展探索');
      expect(r.reportNumber).toBeUndefined();
      expect(r.releaseDate).toBe('2023-12-28');
      expect(r.url).toBe('http://www.caict.ac.cn/kxyj/qwfb/bps/202312/P020240326615399026294.pdf');
      expect(r.mediaType).toBe('OL');
    });

    it('例[3] 应解析英文在线报告（含副题名、报告编号、页码、URL）', () => {
      const input =
        '[3] Calkin D E, Ager A A, Thompson M P, et al. A comparative risk assessment framework for wildland fire management: the 2010 cohesive strategy science report: RMRS-GTR-262[R/OL]. 2011: 8-9. https://www.fs.usda.gov/rm/pubs/rmrs_gtr262.pdf.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('R');
      expect(r.title).toBe('A comparative risk assessment framework for wildland fire management');
      expect(r.subtitle).toBe('the 2010 cohesive strategy science report');
      expect(r.reportNumber).toBe('RMRS-GTR-262');
      expect(r.releaseDate).toBe('2011');
      expect(r.pages).toBe('8-9');
      expect(r.url).toBe('https://www.fs.usda.gov/rm/pubs/rmrs_gtr262.pdf');
      expect(r.mediaType).toBe('OL');
    });

    it('例[4] 应解析带报告编号的英文报告（含出版地、页码）', () => {
      const input =
        '[4] U.S. Department of Transportation Federal Highway Administration. Guidelines for handling excavated acid-producing materials: PB 91-194001[R]. Springfield: U.S. Department of Commerce National Information Service, 1990: 25.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('R');
      expect(r.title).toBe('Guidelines for handling excavated acid-producing materials');
      expect(r.reportNumber).toBe('PB 91-194001');
      expect(r.releaseDate).toBe('1990');
      expect(r.pages).toBe('25');
    });
  });
});
