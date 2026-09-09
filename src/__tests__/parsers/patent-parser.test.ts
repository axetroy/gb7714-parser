import { describe, it, expect } from 'vitest';
import { PatentParser } from '../../parsers/patent-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('PatentParser', () => {
  const parser = new PatentParser();

  describe('match', () => {
    it('应该匹配 [P] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123[P].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [P/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123[P/OL].');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 发明: CN123.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有专利号的专利引用', () => {
      const input = '[1] 张三. 人工智能方法: CN2025001[P]. 2025-09-07.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('P');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('张三');
      expect(result.title).toBe('人工智能方法');
      expect(result.patentNumber).toBe('CN2025001');
    });

    it('应该解析带有公告日期的专利', () => {
      const input = '[2] 李四. 机器学习装置: CN2025002[P]. 2024-12-01.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.announceDate).toBeDefined();
    });

    it('应该解析带有 URL 的专利', () => {
      const input = '[3] 王五. 深度学习系统: CN2025003[P]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('https://example.com');
    });

    it('应该解析带有多个作者的专利', () => {
      const input = '[4] 赵六，孙七. 数据处理方法: CN2025004[P].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(2);
    });
  });

  describe('标准 §8.10 示例', () => {
    it('例[1] 应解析中文专利（含页码、带检验位的专利申请号）', () => {
      const input = '[1] 邓一刚. 全智能节电器: CN200610171314.3[P]. 2008-01-16: 8-9.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('P');
      expect(r.authors).toHaveLength(1);
      expect(r.authors[0].name).toBe('邓一刚');
      expect(r.title).toBe('全智能节电器');
      expect(r.patentNumber).toBe('CN200610171314.3');
      expect(r.announceDate).toBe('2008-01-16');
      expect(r.pages).toBe('8-9');
    });

    it('例[2] 应解析在线中文专利（含 URL）', () => {
      const input =
        '[2] 西安电子科技大学. 光折变自适应光外差探测方法: CN01128777.2[P/OL]. 2002-03-06. http://211.152.9.47/sipoasp/zljs/hyjs-yx-new.asp?recid=01128777.2&leixin=0.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('P');
      expect(r.authors).toHaveLength(1);
      expect(r.authors[0].name).toBe('西安电子科技大学');
      expect(r.title).toBe('光折变自适应光外差探测方法');
      expect(r.patentNumber).toBe('CN01128777.2');
      expect(r.announceDate).toBe('2002-03-06');
      expect(r.url).toBe('http://211.152.9.47/sipoasp/zljs/hyjs-yx-new.asp?recid=01128777.2&leixin=0');
      expect(r.mediaType).toBe('OL');
    });

    it('例[3] 应解析日文专利（含 URL）', () => {
      const input =
        '[3] 中国科学院苏州生物医学工程技术研究所. 光コヒーレンス断層拡張現実に基づく手術顕微鏡撮像システム及び方法 : JP2021578120A[P/OL]. 2022-09-13. https://psssystem.cponline.cnipa.gov.cn/documents/detail?prevPageTit=changgui.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('P');
      expect(r.authors).toHaveLength(1);
      expect(r.authors[0].name).toBe('中国科学院苏州生物医学工程技术研究所');
      expect(r.title).toBe('光コヒーレンス断層拡張現実に基づく手術顕微鏡撮像システム及び方法');
      expect(r.patentNumber).toBe('JP2021578120A');
      expect(r.announceDate).toBe('2022-09-13');
      expect(r.url).toBe('https://psssystem.cponline.cnipa.gov.cn/documents/detail?prevPageTit=changgui');
      expect(r.mediaType).toBe('OL');
    });

    it('例[4] 应解析英文专利（含 URL）', () => {
      const input =
        '[4] Trisco Icap Pty Ltd. Storage and delivery system: AU2022228203A1[P/OL]. 2022-10-06. https://worldwide.espacenet.com/patent/search/family/061561249/publication/AU2022228203A1?q=AU2022228203A.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('P');
      expect(r.authors).toHaveLength(1);
      expect(r.authors[0].name).toBe('Trisco Icap Pty Ltd');
      expect(r.title).toBe('Storage and delivery system');
      expect(r.patentNumber).toBe('AU2022228203A1');
      expect(r.announceDate).toBe('2022-10-06');
      expect(r.url).toBe('https://worldwide.espacenet.com/patent/search/family/061561249/publication/AU2022228203A1?q=AU2022228203A');
      expect(r.mediaType).toBe('OL');
    });
  });
});
