import { describe, it, expect } from 'vitest';
import { JournalParser } from '../parsers/journal-parser.js';
import { tokenize } from '../tokenizer/index.js';
import { parse } from '../index.js';
import type { Journal } from '../types/index.js';

describe('JournalParser', () => {
  const parser = new JournalParser();

  describe('match', () => {
    it('应该匹配 [J] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 题名[J]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [J/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 题名[J/OL]. 刊名，2025，35(2)：15-22.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 题名[M]. 出版地: 出版社, 2025.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 题名.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析完整的期刊引用', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，(2)：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(2);
      expect(result.authors[0].name).toBe('张三');
      expect(result.authors[1].name).toBe('李四');
      expect(result.title).toBe('人工智能在教育中的应用');
      expect(result.journalTitle).toBe('现代教育技术');
      expect(result.year).toBe('2025');
      expect(result.issue).toBe('2');
      expect(result.pages).toBe('15-22');
    });

    it('应该解析单个作者的期刊', () => {
      const input = '[2] 王五. 深度学习研究[J]. 计算机学报，2024，1：100-115.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('王五');
      expect(result.journalTitle).toBe('计算机学报');
      expect(result.year).toBe('2024');
    });

    it('应该解析没有期号的期刊', () => {
      const input = '[3] 赵六. 机器学习综述[J]. 人工智能，2025：1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.issue).toBeUndefined();
    });

    it('应该解析没有页码的期刊', () => {
      const input = '[4] 孙七. 自然语言处理[J]. 语言科学，2025，2.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.pages).toBeUndefined();
    });

    it('应该解析没有卷号的期刊', () => {
      const input = '[5] 周八. 机器学习综述[J]. 人工智能，2025(2)：1-10.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.volume).toBeUndefined();
      expect(result.issue).toBe('2');
    });

    it('应该解析没有年份的期刊', () => {
      const input = '[8] 张三. 论文标题[J]. 期刊名，35(2)：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.year).toBe('');
    });

    it('应该解析没有卷号和期号的期刊', () => {
      const input = '[9] 张三. 论文标题[J]. 期刊名，2025：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.volume).toBeUndefined();
      expect(result.issue).toBeUndefined();
    });

    it('应该解析带有 DOI 的期刊', () => {
      const input = '[10] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22. DOI:10.1234/test';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.pid).toBe('DOI:10.1234/test');
    });

    it('应该解析带有 DOI 在末尾的期刊', () => {
      const input = '[11] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22. DOI:10.1234/test.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.pid).toContain('DOI:10.1234/test');
    });

    it('应该解析使用中文逗号分隔的卷号', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.authors).toHaveLength(2);
      expect(result.journalTitle).toBe('现代教育技术');
      expect(result.year).toBe('2025');
      expect(result.volume).toBe('35');
      expect(result.issue).toBe('2');
      expect(result.pages).toBe('15-22');
    });

    it('应该解析英文逗号分隔的卷号', () => {
      const input = '[1] Schank R C. What is AI, anyway?[J]. AI magazine, 1987, 8(4): 59-59.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('J');
      expect(result.journalTitle).toBe('AI magazine');
      expect(result.year).toBe('1987');
      expect(result.volume).toBe('8');
      expect(result.issue).toBe('4');
      expect(result.pages).toBe('59-59');
    });
  });
});

  describe('标准 §8.5.3 示例', () => {
    // 数据来源：GB/T 7714-2025 标准 §8.5.3 连续出版物中的析出文献示例
    // 核心校验：作者、题名、副题名、刊名、年卷期、页码的正确解析

    it('示例 [2]：含译者信息', () => {
      const input = '久保智康. 花枝蝶鸟方镜的镜范: 以平安后期的铜镜制作工艺为中心[J]. 顾幼静,译. 东方博物, 2009 (1): 85-92.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.authors).toHaveLength(1);
      expect(ref.authors[0].name).toBe('久保智康');
      expect(ref.title).toBe('花枝蝶鸟方镜的镜范');
      expect(ref.subtitle).toBe('以平安后期的铜镜制作工艺为中心');
      expect(ref.journalTitle).toBe('东方博物');
      expect(ref.year).toBe('2009');
      expect(ref.volume).toBeUndefined();
      expect(ref.issue).toBe('1');
      expect(ref.pages).toBe('85-92');
    });

    it('示例 [3]：中文刊名含括号', () => {
      const input = '于潇,刘义,柴跃廷,等. 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报(自然科学版), 2012, 52 (11): 1518-1523.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.authors).toHaveLength(3);
      expect(ref.authors[0].name).toBe('于潇');
      expect(ref.authors[1].name).toBe('刘义');
      expect(ref.authors[2].name).toBe('柴跃廷');
      expect(ref.title).toBe('互联网药品可信交易环境中主体资质审核备案模式');
      expect(ref.subtitle).toBeUndefined();
      expect(ref.journalTitle).toBe('清华大学学报(自然科学版)');
      expect(ref.year).toBe('2012');
      expect(ref.volume).toBe('52');
      expect(ref.issue).toBe('11');
      expect(ref.pages).toBe('1518-1523');
    });

    it('示例 [4]：在线优先（无卷期页码）', () => {
      // 标准示例 [4] 为在线优先格式，仅有出版日期和 URL
      const input = '张群,程志宝,石志飞. 惯性增强动力吸振器-浮置板轨道低频减振性能研究[J/OL]. 铁道学报,2024-05-09.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.mediaType).toBe('OL');
      expect(ref.authors).toHaveLength(3);
      expect(ref.authors[0].name).toBe('张群');
      expect(ref.title).toBe('惯性增强动力吸振器-浮置板轨道低频减振性能研究');
      expect(ref.journalTitle).toBe('铁道学报');
      expect(ref.year).toBe('');
      expect(ref.volume).toBeUndefined();
      expect(ref.issue).toBeUndefined();
      expect(ref.pages).toBeUndefined();
    });

    it('示例 [5]：标准期刊格式', () => {
      const input = '张群,程志宝,石志飞. 惯性增强动力吸振器-浮置板轨道低频减振性能研究[J]. 铁道学报, 2024, 46 (8): 102-111.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.authors).toHaveLength(3);
      expect(ref.title).toBe('惯性增强动力吸振器-浮置板轨道低频减振性能研究');
      expect(ref.journalTitle).toBe('铁道学报');
      expect(ref.year).toBe('2024');
      expect(ref.volume).toBe('46');
      expect(ref.issue).toBe('8');
      expect(ref.pages).toBe('102-111');
    });

    it('示例 [6]：ASCII 冒号分隔副题名 + 中文刊名括号', () => {
      // 标准中此例使用 ASCII ":" 分隔副题名
      const input = '徐建委. 历史的起点:《史记》中的时间设置及其意义[J/OL]. 北京大学学报(哲学社会科学版), 2025, 62 (2): 117-127.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.mediaType).toBe('OL');
      expect(ref.authors).toHaveLength(1);
      expect(ref.authors[0].name).toBe('徐建委');
      expect(ref.title).toBe('历史的起点');
      expect(ref.subtitle).toBe('《史记》中的时间设置及其意义');
      expect(ref.journalTitle).toBe('北京大学学报(哲学社会科学版)');
      expect(ref.year).toBe('2025');
      expect(ref.volume).toBe('62');
      expect(ref.issue).toBe('2');
      expect(ref.pages).toBe('117-127');
    });

    it('示例 [7]：增刊号 + 文章编号', () => {
      const input = '王利平,王福新,刘洪. 过冷大水滴环境粒径分布模拟方法研究进展[J]. 航空学报, 2024, 45 (增刊 1): 730570.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.authors).toHaveLength(3);
      expect(ref.authors[0].name).toBe('王利平');
      expect(ref.authors[1].name).toBe('王福新');
      expect(ref.authors[2].name).toBe('刘洪');
      expect(ref.title).toBe('过冷大水滴环境粒径分布模拟方法研究进展');
      expect(ref.journalTitle).toBe('航空学报');
      expect(ref.year).toBe('2024');
      expect(ref.volume).toBe('45');
      expect(ref.issue).toBe('增刊 1');
      expect(ref.pages).toBe('730570');
    });

    it('示例 [8]：英文长题名', () => {
      const input = 'Saito M, Miyazaki K. Jadeite-bearing metagabbro in serpentinite melange of the Kurosegawa Belt in Izumi Town, Yatsushiro City, Kumamoto Prefecture, central Kyushu[J]. Bulletin of the Geological Survey of Japan, 2006, 57 (5/6): 169-176.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.authors).toHaveLength(2);
      expect(ref.authors[0].name).toBe('Saito M');
      expect(ref.authors[1].name).toBe('Miyazaki K');
      expect(ref.title).toBe('Jadeite-bearing metagabbro in serpentinite melange of the Kurosegawa Belt in Izumi Town, Yatsushiro City, Kumamoto Prefecture, central Kyushu');
      expect(ref.journalTitle).toBe('Bulletin of the Geological Survey of Japan');
      expect(ref.year).toBe('2006');
      expect(ref.volume).toBe('57');
      expect(ref.issue).toBe('5/6');
      expect(ref.pages).toBe('169-176');
    });

    it('示例 [9]：无期号 + URL', () => {
      const input = 'Myburg A A, Grattapaglia D, Tuskan G A, et al. The genome of Eucalyptus grandis[J/OL]. Nature, 2014, 510: 356-362. https://www.nature.com/articles/nature13308.pdf.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.mediaType).toBe('OL');
      expect(ref.authors).toHaveLength(3);
      expect(ref.authors[0].name).toBe('Myburg A A');
      expect(ref.authors[1].name).toBe('Grattapaglia D');
      expect(ref.authors[2].name).toBe('Tuskan G A');
      expect(ref.title).toBe('The genome of Eucalyptus grandis');
      expect(ref.journalTitle).toBe('Nature');
      expect(ref.year).toBe('2014');
      expect(ref.volume).toBe('510');
      expect(ref.issue).toBeUndefined();
      expect(ref.pages).toBe('356-362');
      expect(ref.url).toBe('https://www.nature.com/articles/nature13308.pdf');
    });

    it('示例 [10]：英文副题名 + DOI URL', () => {
      const input = 'Veen P H v d, Muller M, Vincken K L, et al. Longitudinal changes in brain volumes and cerebrovascular lesions on MRI in patients with manifest arterial disease: the SMART-MR study[J/OL]. J Neurol Sci, 2014, 337 (1/2): 112-118.';
      const result = parse(input);
      const ref = result.reference as Journal;

      expect(ref.type).toBe('J');
      expect(ref.mediaType).toBe('OL');
      expect(ref.authors).toHaveLength(3);
      expect(ref.authors[0].name).toBe('Veen P H v d');
      expect(ref.authors[1].name).toBe('Muller M');
      expect(ref.authors[2].name).toBe('Vincken K L');
      expect(ref.title).toBe('Longitudinal changes in brain volumes and cerebrovascular lesions on MRI in patients with manifest arterial disease');
      expect(ref.subtitle).toBe('the SMART-MR study');
      expect(ref.journalTitle).toBe('J Neurol Sci');
      expect(ref.year).toBe('2014');
      expect(ref.volume).toBe('337');
      expect(ref.issue).toBe('1/2');
      expect(ref.pages).toBe('112-118');
    });
  });
