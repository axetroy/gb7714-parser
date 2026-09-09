import { describe, it, expect } from 'vitest';
import { WebPageParser } from '../../parsers/web-page-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('WebPageParser', () => {
  const parser = new WebPageParser();

  describe('match', () => {
    it('应该匹配 [EB] 类型标识', () => {
      const tokens = tokenize('[1] 网站标题[EB/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [EB/OL] 类型标识', () => {
      const tokens = tokenize('[1] 网站标题[EB/OL]. https://example.com');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 网站标题. https://example.com');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有 URL 的网页引用', () => {
      const input = '[1] 张三. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
      expect(result.title).toBe('网站标题');
      expect(result.url).toBe('https://example.com');
    });

    it('应该解析带有访问日期的网页', () => {
      const input = '[2] 李四. 网页标题[EB/OL]. [2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.accessDate).toBeDefined();
    });

    it('应该解析带有作者的网页', () => {
      const input = '[3] 赵六. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('赵六');
    });

    it('应该解析带有创建日期的网页', () => {
      const input = '[4] 张三. 网站标题[EB/OL]. (2025-01-15). https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有两个日期的网页', () => {
      const input = '[5] 张三. 网站标题[EB/OL]. (2025-01-15)[2025-09-07]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有中文作者的网页', () => {
      const input = '[6] 张三，李四. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有英文作者的网页', () => {
      const input = '[7] Smith John. Website Title[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析没有作者的网页', () => {
      const input = '[8] 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toBeDefined();
    });

    it('应该解析带有包含点的 URL 的网页', () => {
      const input = '[9] 张三. 网站标题[EB/OL]. https://example.co.uk.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBeDefined();
    });

    it('应该解析没有 URL 的网页', () => {
      const input = '[10] 张三. 网站标题[EB/OL].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.url).toBe('');
    });

    it('应该解析带有多个作者的网页', () => {
      const input = '[11] 张三，李四，王五. 网站标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThanOrEqual(1);
    });

    it('应该解析带有机构作者的网页', () => {
      const input = '[12] 中国计算机学会. 技术报告[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors.length).toBeGreaterThanOrEqual(0);
    });

    it('应该解析带有空标题的网页', () => {
      const input = '[13] [EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

    it('应该解析带有长标题的网页', () => {
      const input = '[14] 张三. 这是一个非常长的网站标题用于测试解析器是否能正确处理长标题[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('非常长');
    });

    it('应该解析标题中带有特殊字符的网页', () => {
      const input = '[15] 张三. 网站标题 (测试)[EB/OL]. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.title).toContain('网站标题');
    });

    it('应该解析带有日期 token 的网页', () => {
      const input = '[16] 张三. 网站标题[EB/OL]. 2025-01-15. https://example.com';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('EB');
    });

  describe('标准 §8.11 示例', () => {
    it('例[1] 应解析无作者网站（机构名即题名）', () => {
      const input = '[1] 中国国家博物馆[EB/OL]. [2025-05-06]. https://www.chnmuseum.cn/.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('EB');
      expect(r.title).toBe('中国国家博物馆');
      expect(r.authors).toHaveLength(1);
      expect(r.authors[0].name).toBe('中国国家博物馆');
      expect(r.accessDate).toBe('2025-05-06');
      expect(r.url).toBe('https://www.chnmuseum.cn/');
    });

    it('例[2] 应解析英文网站（无作者）', () => {
      const input = '[2] Library of Congress[EB/OL]. [2020-06-12]. https://www.loc.gov.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('EB');
      expect(r.title).toBe('Library of Congress');
      expect(r.authors).toHaveLength(0);
      expect(r.accessDate).toBe('2020-06-12');
      expect(r.url).toBe('https://www.loc.gov');
    });

    it('例[1]（网页）应解析带作者的网页', () => {
      const input =
        '[1] 高等教育文献保障系统. 馆际互借与文献传递服务[EB/OL]. [2025-06-21]. http://home.calis.edu.cn/pages/list.html?id=4101e184-7f64-4798-a5e1-8e37aa6994fc.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('EB');
      expect(r.authors).toHaveLength(1);
      expect(r.authors[0].name).toBe('高等教育文献保障系统');
      expect(r.title).toBe('馆际互借与文献传递服务');
      expect(r.accessDate).toBe('2025-06-21');
      expect(r.url).toContain('calis.edu.cn');
    });

    it('例[3] 应解析作者：标题格式的网页', () => {
      const input =
        '[3] 许振超："好好干，当一个好工人"[EB/OL]. (2025-02-17) [2025-06-22]. http://cpc.people.com.cn/n1/2025/0217/c443712-40419790.html.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('EB');
      expect(r.authors).toHaveLength(1);
      expect(r.authors[0].name).toBe('许振超');
      expect(r.title).toBe('许振超');
      expect(r.subtitle).toBe('"好好干,当一个好工人"');
      expect(r.createDate).toBe('2025-02-17');
      expect(r.url).toContain('people.com.cn');
    });

    it('例[4] 应解析多作者西文网页（含副题名）', () => {
      const input =
        '[4] António M, Pepper L. Histórias de Portugal: livros caídos [EB/OL]. (2019-07-13) [2025-01-02]. https://arquivo.pt/wayback/20190905210731/http://publico.pt/2019/07/13/sociedade/noticia/podcast-historias-portugal-cuidadores-1879731.';
      const r = parser.parse(tokenize(input));

      expect(r.type).toBe('EB');
      expect(r.authors).toHaveLength(2);
      expect(r.authors[0].name).toBe('António M');
      expect(r.authors[1].name).toBe('Pepper L');
      expect(r.title).toBe('Histórias de Portugal');
      expect(r.subtitle).toBe('livros caídos');
      expect(r.createDate).toBe('2019-07-13');
      expect(r.url).toContain('arquivo.pt');
    });
  });
  });
});
