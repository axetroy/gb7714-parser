import { describe, it, expect } from 'vitest';
import { parse } from '../../index.js';
import type { Book, Thesis, Proceedings, Newspaper, Dataset, Report, Serial, Patent, ComputerProgram, WebPage, Archive, Map, Preprint, Standard } from '../../types/index.js';

/**
 * 无作者文献解析（必有作者模式）
 *
 * 标准著录格式为「主要责任者. 题名[类型标识]....」，但当文献无主要责任者时，
 * 著录直接从题名开始，即类型标识 [X] 之前没有 DOT（作者分隔符）。
 *
 * 解析器此前假设必有作者，会把「第一个 DOT 前的文本」误解析为作者，
 * 导致题名、出版信息等全部错位。本测试锁定所有走「必有作者」路径的
 * 解析器在无作者输入下的正确行为。
 *
 * @see GB/T 7714-2025 附录 B 示例（B.1[8] 康熙字典等）
 */
describe('无作者文献（类型标识前无 DOT）', () => {
  it('图书 [M]：标准 B.1 示例 [8]', () => {
    const input = '[8] 康熙字典：巳集上 水部[M]. 影印本. 北京: 中华书局, 1962: 50.';
    const result = parse(input);
    const ref = result.reference as Book;

    expect(ref.type).toBe('M');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('康熙字典:巳集上 水部');
    expect(ref.subtitle).toBeUndefined();
    expect(ref.version).toBe('影印本');
    expect(ref.publisherPlace).toBe('北京');
    expect(ref.publisher).toBe('中华书局');
    expect(ref.year).toBe('1962');
    expect(ref.pages).toBe('50');
  });

  it('图书 [M]：全角冒号题名不拆副题名', () => {
    const input = '[1] 昌平山水记：京东考古录[M]. 北京: 北京古籍出版社, 1980.';
    const result = parse(input);
    const ref = result.reference as Book;

    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('昌平山水记:京东考古录');
    expect(ref.subtitle).toBeUndefined();
    expect(ref.year).toBe('1980');
  });

  it('图书 [M]：ASCII 冒号后为数字范围时不拆副题名', () => {
    // 冒号后是数字（年份范围），视为题名的一部分（与有作者路径行为一致）
    const input = '[1] 中国铁路史: 1876-1949[M]. 北京: 中国铁道出版社, 2020.';
    const result = parse(input);
    const ref = result.reference as Book;

    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('中国铁路史: 1876-1949');
    expect(ref.subtitle).toBeUndefined();
    expect(ref.year).toBe('2020');
  });

  it('学位论文 [D]', () => {
    const input = '[1] 融合多源数据的土壤湿度反演研究[D]. 武汉: 武汉大学, 2022: 87.';
    const result = parse(input);
    const ref = result.reference as Thesis;

    expect(ref.type).toBe('D');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('融合多源数据的土壤湿度反演研究');
    expect(ref.awardYear).toBe('2022');
  });

  it('会议录 [C]', () => {
    const input = '[1] 第31次全国医院感染学术年会论文集[C]. 北京: 中华预防医学会, 2022: 2.';
    const result = parse(input);
    const ref = result.reference as Proceedings;

    expect(ref.type).toBe('C');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toContain('论文集');
  });

  it('报纸 [N]', () => {
    const input = '[1] 重要新闻报道[N]. 人民日报, 2025-09-07: 03.';
    const result = parse(input);
    const ref = result.reference as Newspaper;

    expect(ref.type).toBe('N');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('重要新闻报道');
  });

  it('数据集 [DS]', () => {
    const input = '[1] 全球逐月降水量数据集[DS/OL]. 国家地球系统科学数据中心, 2025.';
    const result = parse(input);
    const ref = result.reference as Dataset;

    expect(ref.type).toBe('DS');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toContain('数据集');
  });

  it('报告 [R]', () => {
    const input = '[1] 中国互联网络发展状况统计报告[R]. 北京: 中国互联网络信息中心, 2022.';
    const result = parse(input);
    const ref = result.reference as Report;

    expect(ref.type).toBe('R');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('中国互联网络发展状况统计报告');
  });

  it('专利 [P]', () => {
    const input = '[1] 一种全智能节电器[P]. 2008-01-16: 8-9.';
    const result = parse(input);
    const ref = result.reference as Patent;

    expect(ref.type).toBe('P');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('一种全智能节电器');
  });

  it('连续出版物 [J]', () => {
    const input = '[4] Public Library Quarterly[J/OL]. 1979, 1 (1)—. Philadelphia: Taylor & Francis, 1979—.';
    const result = parse(input);
    const ref = result.reference as Serial;

    expect(ref.type).toBe('J');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('Public Library Quarterly');
  });

  it('计算机程序 [CP]', () => {
    const input = '[1] 数据分析软件[CP]. 1.0. 北京: 清华大学出版社, 2025.';
    const result = parse(input);
    const ref = result.reference as ComputerProgram;

    expect(ref.type).toBe('CP');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('数据分析软件');
  });

  describe('有作者输入不受影响（回归保护）', () => {
    it('图书 [M]', () => {
      const result = parse('[1] 周志华. 机器学习[M]. 北京: 清华大学出版社, 2016: 420.');
      const ref = result.reference as Book;

      expect(ref.authors).toHaveLength(1);
      expect(ref.authors[0]!.name).toBe('周志华');
      expect(ref.title).toBe('机器学习');
      expect(ref.year).toBe('2016');
    });

    it('学位论文 [D]', () => {
      const result = parse('[1] 王琦. 融合星载GNSS-R和SAR数据的研究[D]. 武汉: 武汉大学, 2022: 87.');
      const ref = result.reference as Thesis;

      expect(ref.authors).toHaveLength(1);
      expect(ref.authors[0]!.name).toBe('王琦');
      expect(ref.title).toBe('融合星载GNSS-R和SAR数据的研究');
    });

    it('专利 [P]', () => {
      const result = parse('[1] 邓一刚. 全智能节电器：CN200610171314.3[P]. 2008-01-16: 8-9.');
      const ref = result.reference as Patent;

      expect(ref.authors).toHaveLength(1);
      expect(ref.authors[0]!.name).toBe('邓一刚');
      expect(ref.title).toBe('全智能节电器');
      expect(ref.patentNumber).toBe('CN200610171314.3');
    });

    it('多作者图书 [M]', () => {
      const result = parse('[5] 扬奎斯特，萨金特. 递归宏观经济理论[M]. 北京: 中国人民大学出版社, 2010: 798.');
      const ref = result.reference as Book;

      expect(ref.authors).toHaveLength(2);
      expect(ref.title).toBe('递归宏观经济理论');
    });
  });

  it('网站 [EB]：标准 B.10 示例 [8]', () => {
    const input = '[8] 西黄丸[EB/OL]. (2023-10-07) [2025-08-26]. https://ydz.chp.org.cn/JHJ/item?bookId=1&entryId=1154.';
    const result = parse(input);
    const ref = result.reference as WebPage;

    expect(ref.type).toBe('EB');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('西黄丸');
  });

  it('网站 [EB]：英文无作者', () => {
    const input = '[9] Library of Congress[EB/OL]. [2020-06-12]. https://www.loc.gov.';
    const result = parse(input);
    const ref = result.reference as WebPage;

    expect(ref.type).toBe('EB');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('Library of Congress');
  });

  it('档案 [A]', () => {
    const input = '[5] 无名档案[A]. 北京: 档案馆, 2025.';
    const result = parse(input);
    const ref = result.reference as Archive;

    expect(ref.type).toBe('A');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('无名档案');
  });

  it('地图 [CM]', () => {
    const input = '[1] 中国地图[CM]. 北京: 测绘出版社, 2023.';
    const result = parse(input);
    const ref = result.reference as Map;

    expect(ref.type).toBe('CM');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('中国地图');
  });

  it('预印本 [PP]', () => {
    const input = '[5] 无作者预印本[PP/OL]. https://arxiv.org';
    const result = parse(input);
    const ref = result.reference as Preprint;

    expect(ref.type).toBe('PP');
    expect(ref.authors).toHaveLength(0);
    expect(ref.title).toBe('无作者预印本');
  });

  it('标准 [S]：标准 B.8 示例 [1]', () => {
    const input = '[1] GB/T 3792—2021 信息与文献 资源描述[S].';
    const result = parse(input);
    const ref = result.reference as Standard;

    expect(ref.type).toBe('S');
    expect(ref.authors).toHaveLength(0);
    expect(ref.standardNumber).toBe('GB/T 3792—2021');
    expect(ref.standardName).toBe('信息与文献 资源描述');
  });

  it('标准 [S]：ISO 西文标准无作者', () => {
    const input = '[5] ISO 21378: 2019 Audit data collection[S].';
    const result = parse(input);
    const ref = result.reference as Standard;

    expect(ref.type).toBe('S');
    expect(ref.authors).toHaveLength(0);
    expect(ref.standardNumber).toBe('ISO 21378: 2019');
    expect(ref.standardName).toBe('Audit data collection');
  });
});
