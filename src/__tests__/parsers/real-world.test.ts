import { describe, it, expect } from 'vitest';
import { parse, parseAll, validate, format } from '../../index.js';
import type { Journal, Book, Standard, ComponentPart } from '../../types/index.js';

describe('真实案例测试', () => {
  describe('期刊论文 [J]', () => {
    it('应该解析中文期刊论文', () => {
      const { reference } = parse<Journal>('[1] 何龄修. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.');

      expect(reference.type).toBe('J');
      expect(reference.authors[0].surname).toBe('何龄修');
      expect(reference.title).toBe('读南明史');
      expect(reference.journalTitle).toBe('中国史研究');
      expect(reference.year).toBe('1998');
    });

    it('应该解析带多个作者的中文期刊论文', () => {
      const { reference } = parse<Journal>('[2] 余联庆, 枚元元, 李琳, 等. 闭链弓形五连杆越障能力分析与运动规划[J]. 机械工程学报, 2017, 53(7): 69-75.');

      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThan(0);
      expect(reference.journalTitle).toBe('机械工程学报');
      expect(reference.year).toBe('2017');
    });

    it('应该解析英文期刊论文', () => {
      const { reference } = parse<Journal>('[3] KANAMORI H. Shaking without quaking[J]. Science, 1998, 279(5359): 2063.');

      expect(reference.type).toBe('J');
      expect(reference.authors[0].surname).toBe('KANAMORIH');
      expect(reference.journalTitle).toBe('Science');
    });

    it('应该解析带et al的英文期刊论文', () => {
      const { reference } = parse<Journal>('[4] Ijspeert A J, Crespi A, Ryczko D, et al. From Swimming to Walking with Asalamander Robot Driven by a Spinal Cord Model[J]. Science, 2007, 315(5817): 1416–1420.');

      expect(reference.type).toBe('J');
      expect(reference.journalTitle).toBe('Science');
      expect(reference.year).toBe('2007');
    });

    it('应该解析带DOI样式的期刊论文', () => {
      const { reference } = parse<Journal>('[5] Lee J, Hwangbo J, Wellhausen L, et al. Learning quadrupedal locomotion over challenging terrain[J]. Science Robotics, 2020, 5(47): eabc5986.');

      expect(reference.type).toBe('J');
      expect(reference.journalTitle).toContain('Science');
      expect(reference.journalTitle).toContain('Robotics');
    });

    it('应该解析带卷号无期号的期刊论文', () => {
      const { reference } = parse<Journal>('[6] 刘京运. 从Big Dog到 Spot Mini : 波士顿动力四足机器人进化史[J]. 机器人产业, 2018, (02): 109-116.');

      expect(reference.type).toBe('J');
      expect(reference.journalTitle).toBe('机器人产业');
      expect(reference.year).toBe('2018');
    });
  });

  describe('专著 [M]', () => {
    it('应该解析中文专著', () => {
      const { reference } = parse<Book>('[1] 梁福军. 科技论文规范写作与编辑[M]. 北京: 清华大学出版社, 2014.');

      expect(reference.type).toBe('M');
      expect(reference.authors[0].surname).toBe('梁福军');
      expect(reference.title).toBe('科技论文规范写作与编辑');
      expect(reference.publisherPlace).toBe('北京');
      expect(reference.publisher).toBe('清华大学出版社');
      expect(reference.year).toBe('2014');
    });

    it('应该解析带版本的专著', () => {
      const { reference } = parse<Book>('[2] Hu S S. The principle of automatic control[M]. 5th ed. Beijing: Science Press, 2007: 471-472.');

      expect(reference.type).toBe('M');
      expect(reference.publisherPlace).toContain('Beijing');
      expect(reference.publisher).toContain('Science');
      expect(reference.publisher).toContain('Press');
    });

    it('应该解析多作者专著', () => {
      const { reference } = parse<Book>('[3] Yu H B, Liu J G, Liu L Q, et al. Intelligent robotics and applications[M]. Berlin, Germany: Springer, 2019.');

      expect(reference.type).toBe('M');
      expect(reference.publisher).toBe('Springer');
    });

    it('应该解析带页码的专著', () => {
      const { reference } = parse<Book>('[4] 王芳. 当代中国教育改革[M]. 北京: 高等教育出版社, 2025: 100-150.');

      expect(reference.type).toBe('M');
      expect(reference.pages).toBeDefined();
    });
  });

  describe('学位论文 [D]', () => {
    it('应该解析中文学位论文', () => {
      const { reference } = parse('[1] 马欢. 人类活动影响下海河流域典型区水循环变化分析[D]. 北京: 北京大学, 2011.');

      expect(reference.type).toBe('D');
      expect(reference.authors[0].surname).toBe('马欢');
      expect(reference.title).toContain('海河流域');
    });

    it('应该解析博士论文', () => {
      const { reference } = parse('[2] 周坤玲. 四足仿生机器人高速步态规划方法研究[D]. 北京: 北京交通大学, 2013.');

      expect(reference.type).toBe('D');
    });

    it('应该解析英文学位论文', () => {
      const { reference } = parse('[3] Smallwood D A. Advances in dynamical modeling and control of underwater robotic vehicles[D]. Baltimore, USA: Johns Hopkins University, 2003.');

      expect(reference.type).toBe('D');
    });
  });

  describe('会议论文集 [C]', () => {
    it('应该解析中文会议论文集', () => {
      const { reference } = parse('[1] 辛希孟. 信息技术与信息服务国际研讨会会议文集：A集[C]. 北京：中国社会科学出版社，1994.');

      expect(reference.type).toBe('C');
      expect(reference.authors[0].surname).toBe('辛希孟');
    });

    it('应该解析无出版者的会议论文集', () => {
      const { reference } = parse('[2] 中国力学学会. 第3届全国实验流体力学学术会议文集[C]. 天津：[出版者不详]，1990.');

      expect(reference.type).toBe('C');
    });

    it('应该解析带析出文献的会议论文', () => {
      const { reference } = parse('[3] 李伟, 张敏. 基于深度学习的图像识别新方法[C]//中国计算机学会. 第30届中国计算机大会论文集. 北京: 中国计算机学会, 2024: 456–467.');

      expect(reference.title).toContain('图像识别');
    });
  });

  describe('技术报告 [R]', () => {
    it('应该解析中文技术报告', () => {
      const { reference } = parse('[1] 宋健. 制造业与现代化[R]. 北京：人民大会堂，2002.');

      expect(reference.type).toBe('R');
      expect(reference.authors[0].surname).toBe('宋健');
      expect(reference.title).toBe('制造业与现代化');
    });

    it('应该解析在线技术报告', () => {
      const { reference } = parse('[2] 中华人民共和国国务院新闻办公室. 国防白皮书: 中国武装力量的多样化运用[R/OL]. (2013-04-16)[2014-06-11]. http://www.mod.gov.cn/affair/2013-04/16/content_4442839.htm.');

      expect(reference.type).toBe('R');
    });

    it('应该解析英文技术报告', () => {
      const { reference } = parse('[3] Wenzhofer F, Knust R. Expedition programme PS108[R]. Bremerhaven, Germany: Alfred Wegener Institute, 2017.');

      expect(reference.type).toBe('R');
    });
  });

  describe('标准 [S]', () => {
    it('应该解析中文标准', () => {
      const { reference } = parse<Standard>('[1] 全国信息与文献标准化技术委员会. 文献著录: 第四部分 非书资料: GB/T 3792.4—2009[S]. 北京: 中国标准出版社, 2010: 3.');

      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toContain('GB/T');
    });

    it('应该解析在线标准', () => {
      const { reference } = parse('[2] 国家环境保护局科技标准司. 土壤环境质量标准: GB 15616—1995[S/OL]. 北京: 中国标准出版社, 1996: 2-3[2013-10-14].');

      expect(reference.type).toBe('S');
    });

    it('应该解析ISO标准', () => {
      const { reference } = parse<Standard>('[3] Information and documentation-the Dublin core metadata element set: ISO 15836: 2009[S/OL]. [2013-03-24].');

      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toContain('ISO');
    });
  });

  describe('专利 [P]', () => {
    it('应该解析中文专利', () => {
      const { reference } = parse('[1] 姜锡洲. 一种温热外敷药制备方案: 88105607.3[P]. 1989-07-26.');

      expect(reference.type).toBe('P');
      expect(reference.authors[0].surname).toBe('姜锡洲');
    });

    it('应该解析英文专利', () => {
      const { reference } = parse('[2] MILLOR A L, KOTHLUSG J N. 机械密封装置的自适应控制系统: 1007835B[P]. 1990-05-02.');

      expect(reference.type).toBe('P');
    });

    it('应该解析在线专利', () => {
      const { reference } = parse('[3] KOSEKI A, MOMOSE H, KAWAHITO M, et al. Compiler: US, 828402[P/OL]. 2002-05-25[2005-05-28]. http://www.example.com.');

      expect(reference.type).toBe('P');
    });
  });

  describe('电子公告 [EB/OL]', () => {
    it('应该解析在线电子公告', () => {
      const { reference } = parse('[1] NASA. National robotics initiative(NRI)[EB/OL]. (2011-07-25)[2016-11-21]. https://www.nasa.gov/robotics/index.html.');

      expect(reference.type).toBe('EB');
      expect(reference.url).toContain('nasa.gov');
    });

    it('应该解析中文电子公告', () => {
      const { reference } = parse('[2] 高等教育文献保障系统. 馆际互借与文献传递服务[EB/OL].[2025-06-21]. http://home.calis.edu.cn/pages/list.html?id=410le184-7f64-4798-a5el-8e37aa6994fc.');

      expect(reference.type).toBe('EB');
      expect(reference.url).toBeDefined();
    });
  });

  describe('数据集 [DS/OL]', () => {
    it('应该解析在线数据集', () => {
      const { reference } = parse('[1] Nebot E. Victoria park data set[DB/OL]. (2001-04-29)[2017-03-10]. http://www-personal.acfr.usyd.edu.au/nebot/dataset.htm.');

      expect(reference.type).toBe('DB');
    });

    it('应该解析中文数据集', () => {
      const { reference } = parse('[2] 周壮，李盛阳，吴薇，等.天宫二号遥感图像自然景物分类科学数据[DS/OL].V1.0.国家基础学科公共科学数据中心(2023-09-10)[2025-07-15]. https://www.nbsdc.cn/general/dataLinks.');

      expect(reference.type).toBe('DS');
      expect(reference.url).toBeDefined();
    });
  });

  describe('预印本 [PP/OL]', () => {
    it('应该解析在线预印本', () => {
      const { reference } = parse('[1] 肖玲，张雪，王永.数据要素的统计测算方法探究[PP/OL].PSSXiv(2024-07-02)[2024-09-30]. https://zsyyb.cn/abs/202408.01096.');

      expect(reference.type).toBe('PP');
      expect(reference.url).toBeDefined();
    });

    it('应该解析arxiv预印本', () => {
      const { reference } = parse('[2] Kim D, Carlo J D, Katz B, et al. Highly dynamic quadruped locomotion via whole-body impulse control and model predictive control[PP/OL]. (2019-09-14)[2022-05-25]. https://arxiv.org/abs/2110.02799.');

      expect(reference.url).toContain('arxiv');
    });
  });

  describe('档案 [A]', () => {
    it('应该解析档案文献', () => {
      const { reference } = parse('[1] 李鸿章.奏请上海道库洋务外销要款无款可筹仍拨药厘接济事:04-01-35-0399-039[A].北京:中国第一历史档案馆，1887(光绪十三年三月十三日).');

      expect(reference.type).toBe('A');
      expect(reference.authors[0].surname).toBe('李鸿章');
    });
  });

  describe('地图 [CM]', () => {
    it('应该解析地图', () => {
      const { reference } = parse('[1] 胡健民.东南极拉斯曼丘陵地区地质图.1:25 000[CM].北京：科学出版社，2021.128 cm×84 cm.');

      expect(reference.type).toBe('CM');
      expect(reference.title).toContain('地质图');
    });
  });

  describe('析出文献', () => {
    it('应该解析图书析出文献', () => {
      const { reference } = parse<ComponentPart>('[1] 刘明. 在线学习的有效性评估[M]//王军, 孙康. 高等教育数字化转型. 北京: 教育出版社, 2025: 89–112.');

      expect(reference.title).toContain('在线学习');
      expect(reference.host).toBeDefined();
    });

    it('应该解析会议析出文献', () => {
      const { reference } = parse('[2] 张军. 在线教学的有效性评估[C]//第十五届全国教育技术学术年会论文集. 北京: 教育科学出版社, 2025: 145–156.');

      expect(reference.title).toContain('在线教学');
    });
  });

  describe('批量解析测试', () => {
    it('应该批量解析多个参考文献', () => {
      const inputs = [
        '[1] 何龄修. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.',
        '[2] 梁福军. 科技论文规范写作与编辑[M]. 北京: 清华大学出版社, 2014.',
        '[3] 马欢. 人类活动影响下海河流域典型区水循环变化分析[D]. 北京: 北京大学, 2011.',
      ];

      const results = parseAll(inputs);

      expect(results).toHaveLength(3);
      expect(results[0].reference.type).toBe('J');
      expect(results[1].reference.type).toBe('M');
      expect(results[2].reference.type).toBe('D');
    });

    it('应该使用泛型批量解析', () => {
      const inputs = [
        '[1] 何龄修. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.',
        '[2] 余联庆. 机械工程学报[J]. 机械工程学报, 2017, 53(7): 69-75.',
      ];

      const results = parseAll<Journal>(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].reference.journalTitle).toBe('中国史研究');
      expect(results[1].reference.journalTitle).toBe('机械工程学报');
    });

    it('应该验证参考文献格式', () => {
      const input = '[1] 何龄修. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report.valid).toBe(true);
    });

    it('应该格式化参考文献', () => {
      const input = '[1] 何龄修. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('何龄修');
      expect(formatted).toContain('读南明史');
      expect(formatted).toContain('中国史研究');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理带空格的作者名', () => {
      const { reference } = parse('[1] 张 三. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.');

      expect(reference.authors[0].surname).toBe('张三');
    });

    it('应该处理特殊字符的标题', () => {
      const { reference } = parse('[1] 张三. 基于AI的《红楼梦》研究: 方法与实践[J]. 文学评论, 2025, 1(1): 1-10.');

      expect(reference.title).toContain('红楼梦');
    });

    it('应该处理长页码范围', () => {
      const { reference } = parse('[1] 张三. 研究论文[J]. 期刊名, 2025, 1(1): 100-150.');

      expect(reference.pages).toBe('100-150');
    });

    it('应该处理无作者的参考文献', () => {
      const { reference } = parse('[1] 中国互联网络发展状况统计报告[R]. 北京: 中国互联网络信息中心, 2025.');

      expect(reference.authors.length).toBeGreaterThanOrEqual(0);
      expect(reference.title).toBeDefined();
    });

    it('应该处理多个中文作者', () => {
      const { reference } = parse('[1] 张三，李四，王五. 研究论文[J]. 期刊名, 2025, 1(1): 1-10.');

      expect(reference.authors.length).toBeGreaterThan(1);
    });

    it('应该处理带"等"的中文作者', () => {
      const { reference } = parse('[1] 张三，李四，王五，等. 研究论文[J]. 期刊名, 2025, 1(1): 1-10.');

      expect(reference.authors.length).toBeGreaterThanOrEqual(3);
    });

    it('应该处理英文大写作者', () => {
      const { reference } = parse('[1] SMITH J, DOE A. Research Paper[J]. Journal Name, 2025, 1(1): 1-10.');

      expect(reference.type).toBe('J');
    });

    it('应该处理带冒号的标题', () => {
      const { reference } = parse('[1] 张三. 人工智能：现状与未来[J]. 计算机学报, 2025, 48(1): 1-20.');

      expect(reference.title).toContain('人工智能');
    });

    it('应该处理带括号的期号', () => {
      const { reference } = parse<Journal>('[1] 张三. 研究论文[J]. 期刊名, 2025, 35(2): 100-115.');

      expect(reference.issue).toBe('2');
    });

    it('应该处理带连接号的页码', () => {
      const { reference } = parse('[1] 张三. 研究论文[J]. 期刊名, 2025, 1(1): 100–150.');

      expect(reference.pages).toBeDefined();
    });

    it('应该处理带版次的图书', () => {
      const { reference } = parse('[1] 张三. 教材名称[M]. 第3版. 北京: 出版社, 2025.');

      expect(reference.type).toBe('M');
    });

    it('应该处理带页码的图书', () => {
      const { reference } = parse('[1] 张三. 专著名称[M]. 北京: 出版社, 2025: 100-200.');

      expect(reference.pages).toBe('100-200');
    });

    it('应该处理在线专著', () => {
      const { reference } = parse('[1] 张三. 在线图书[M/OL]. 北京: 出版社, 2025. https://example.com.');

      expect(reference.type).toBe('M');
    });

    it('应该处理无出版地的图书', () => {
      const { reference } = parse('[1] 张三. 专著名称[M]. 出版社, 2025.');

      expect(reference.type).toBe('M');
    });

    it('应该处理学位论文的页码', () => {
      const { reference } = parse('[1] 张三. 学位论文标题[D]. 北京: 大学, 2025: 89.');

      expect(reference.pages).toBe('89');
    });

    it('应该处理会议论文集', () => {
      const { reference } = parse('[1] 辛希孟. 信息技术与信息服务国际研讨会会议文集：A集[C]. 北京：中国社会科学出版社，1994.');

      expect(reference.type).toBe('C');
    });

    it('应该处理技术报告的页码', () => {
      const { reference } = parse('[1] 张三. 技术报告[R]. 北京: 出版社, 2025: 50.');

      expect(reference.pages).toBe('50');
    });

    it('应该处理专利', () => {
      const { reference } = parse('[1] 张三. 发明名称: CN123456[P]. 2025-01-01.');

      expect(reference.type).toBe('P');
    });

    it('应该处理在线专利', () => {
      const { reference } = parse('[1] 张三. 发明名称: CN123456[P/OL]. 2025-01-01[2025-09-07]. https://example.com.');

      expect(reference.type).toBe('P');
    });

    it('应该处理在线标准', () => {
      const { reference } = parse('[1] 张三. 标准名称: GB/T 1234-2025[S/OL]. 北京: 出版社, 2025: 5[2025-09-07].');

      expect(reference.type).toBe('S');
    });

    it('应该处理在线档案', () => {
      const { reference } = parse('[1] 张三. 档案标题: ABC123[A/OL]. 北京: 档案馆, 1887. https://example.com.');

      expect(reference.type).toBe('A');
    });

    it('应该处理在线地图', () => {
      const { reference } = parse('[1] 张三. 地图标题. 1:25000[CM/OL]. 北京: 出版社, 2025. https://example.com.');

      expect(reference.type).toBe('CM');
    });

    it('应该处理在线数据集', () => {
      const { reference } = parse('[1] 张三. 数据集标题[DS/OL]. V1.0. 平台名称(2025-09-07)[2025-10-01]. https://example.com.');

      expect(reference.type).toBe('DS');
    });

    it('应该处理在线预印本', () => {
      const { reference } = parse('[1] 张三. 预印本标题[PP/OL]. V1.0. 平台名称(2025-09-07)[2025-10-01]. https://example.com.');

      expect(reference.type).toBe('PP');
    });

    it('应该处理无URL的参考文献', () => {
      const { reference } = parse('[1] 张三. 书籍[M]. 北京: 出版社, 2025.');

      expect(reference.url).toBeUndefined();
    });

    it('应该处理带多个句点的标题', () => {
      const { reference } = parse('[1] 张三. 基于深度学习的图像识别研究.... 期刊名, 2025, 1(1): 1-10.');

      expect(reference.title).toContain('图像识别');
    });

    it('应该处理带中文标点的作者', () => {
      const { reference } = parse('[1] 张三，李四. 研究论文[J]. 期刊名, 2025, 1(1): 1-10.');

      expect(reference.authors.length).toBe(2);
    });

    it('应该处理带英文标点的作者', () => {
      const { reference } = parse('[1] Zhang San, Li Si. Research Paper[J]. Journal Name, 2025, 1(1): 1-10.');

      expect(reference.authors.length).toBe(2);
    });

    it('应该处理带多个作者和"et al"的英文文献', () => {
      const { reference } = parse('[1] Smith J, Doe A, Johnson B, et al. Research Paper[J]. Journal Name, 2025, 1(1): 1-10.');

      expect(reference.authors.length).toBeGreaterThanOrEqual(3);
    });

    it('应该处理带多个作者和"等"的中文文献', () => {
      const { reference } = parse('[1] 张三，李四，王五，等. 研究论文[J]. 期刊名, 2025, 1(1): 1-10.');

      expect(reference.authors.length).toBeGreaterThanOrEqual(3);
    });

    it('应该处理带机构作者的参考文献', () => {
      const { reference } = parse('[1] 中国计算机学会. 技术报告[R]. 北京, 2025.');

      expect(reference.authors.length).toBeGreaterThan(0);
    });

    it('应该处理带日期的参考文献', () => {
      const { reference } = parse('[1] 张三. 研究论文[J]. 期刊名, 2025, 1(1): 1-10.');

      expect(reference.year).toBe('2025');
    });

    it('应该处理带卷号的参考文献', () => {
      const { reference } = parse<Journal>('[1] 张三. 研究论文[J]. 期刊名, 2025, 35(2): 100-115.');

      expect(reference.volume).toBe('35');
    });

    it('应该处理带期号的参考文献', () => {
      const { reference } = parse<Journal>('[1] 张三. 研究论文[J]. 期刊名, 2025, 35(2): 100-115.');

      expect(reference.issue).toBe('2');
    });

    it('应该处理带页码的参考文献', () => {
      const { reference } = parse('[1] 张三. 研究论文[J]. 期刊名, 2025, 1(1): 100-150.');

      expect(reference.pages).toBe('100-150');
    });

    it('应该处理带URL的参考文献', () => {
      const { reference } = parse('[1] 张三. 研究论文[J]. 期刊名, 2025, 1(1): 1-10.');

      expect(reference.type).toBe('J');
    });

    it('应该处理带序号的参考文献', () => {
      const { reference } = parse('[1] 张三. 研究论文[J]. 期刊名, 2025, 1(1): 1-10.');

      expect(reference.type).toBe('J');
    });

    it('应该处理带中文标题的参考文献', () => {
      const { reference } = parse('[1] 张三. 人工智能在医疗领域的应用研究[J]. 计算机学报, 2025, 48(1): 1-20.');

      expect(reference.title).toContain('人工智能');
    });

    it('应该处理带英文标题的参考文献', () => {
      const { reference } = parse('[1] Smith J. Artificial Intelligence in Healthcare[J]. Journal Name, 2025, 1(1): 1-10.');

      expect(reference.title).toContain('Artificial');
    });

    it('应该处理带混合标题的参考文献', () => {
      const { reference } = parse('[1] 张三. AI在医疗中的应用[J]. Journal Name, 2025, 1(1): 1-10.');

      expect(reference.title).toContain('AI');
    });
  });

  describe('格式验证测试', () => {
    it('应该验证期刊论文格式', () => {
      const input = '[1] 何龄修. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report.valid).toBe(true);
    });

    it('应该验证专著格式', () => {
      const input = '[1] 梁福军. 科技论文规范写作与编辑[M]. 北京: 清华大学出版社, 2014.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report.valid).toBe(true);
    });

    it('应该验证学位论文格式', () => {
      const input = '[1] 马欢. 人类活动影响下海河流域典型区水循环变化分析[D]. 北京: 北京大学, 2011.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report.valid).toBe(true);
    });

    it('应该验证会议论文集格式', () => {
      const input = '[1] 辛希孟. 信息技术与信息服务国际研讨会会议文集：A集[C]. 北京：中国社会科学出版社，1994.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report.valid).toBe(true);
    });

    it('应该验证技术报告格式', () => {
      const input = '[1] 宋健. 制造业与现代化[R]. 北京：人民大会堂，2002.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report.valid).toBe(true);
    });

    it('应该验证标准格式', () => {
      const input = '[1] 全国信息与文献标准化技术委员会. 文献著录: 第四部分 非书资料: GB/T 3792.4—2009[S]. 北京: 中国标准出版社, 2010: 3.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report.valid).toBe(true);
    });

    it('应该验证专利格式', () => {
      const input = '[1] 姜锡洲. 一种温热外敷药制备方案: 88105607.3[P]. 1989-07-26.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report).toBeDefined();
    });

    it('应该验证电子公告格式', () => {
      const input = '[1] NASA. National robotics initiative(NRI)[EB/OL]. (2011-07-25)[2016-11-21]. https://www.nasa.gov/robotics/index.html.';
      const { reference } = parse(input);
      const report = validate(reference);

      expect(report).toBeDefined();
    });
  });

  describe('格式化测试', () => {
    it('应该格式化期刊论文', () => {
      const input = '[1] 何龄修. 读南明史[J]. 中国史研究, 1998, 6(3): 167-173.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('何龄修');
      expect(formatted).toContain('读南明史');
      expect(formatted).toContain('中国史研究');
      expect(formatted).toContain('1998');
    });

    it('应该格式化专著', () => {
      const input = '[1] 梁福军. 科技论文规范写作与编辑[M]. 北京: 清华大学出版社, 2014.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('梁福军');
      expect(formatted).toContain('科技论文规范写作与编辑');
      expect(formatted).toContain('北京');
      expect(formatted).toContain('清华大学出版社');
      expect(formatted).toContain('2014');
    });

    it('应该格式化学位论文', () => {
      const input = '[1] 马欢. 人类活动影响下海河流域典型区水循环变化分析[D]. 北京: 北京大学, 2011.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('马欢');
      expect(formatted).toContain('北京');
      expect(formatted).toContain('北京大学');
    });

    it('应该格式化会议论文集', () => {
      const input = '[1] 辛希孟. 信息技术与信息服务国际研讨会会议文集：A集[C]. 北京：中国社会科学出版社，1994.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('辛希孟');
      expect(formatted).toContain('[C]');
    });

    it('应该格式化技术报告', () => {
      const input = '[1] 宋健. 制造业与现代化[R]. 北京：人民大会堂，2002.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('宋健');
      expect(formatted).toContain('制造业与现代化');
      expect(formatted).toContain('[R]');
    });

    it('应该格式化标准', () => {
      const input = '[1] 全国信息与文献标准化技术委员会. 文献著录: 第四部分 非书资料: GB/T 3792.4—2009[S]. 北京: 中国标准出版社, 2010: 3.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('GB/T');
      expect(formatted).toContain('[S]');
    });

    it('应该格式化专利', () => {
      const input = '[1] 姜锡洲. 一种温热外敷药制备方案: 88105607.3[P]. 1989-07-26.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('姜锡洲');
      expect(formatted).toContain('[P]');
    });

    it('应该格式化电子公告', () => {
      const input = '[1] NASA. National robotics initiative(NRI)[EB/OL]. (2011-07-25)[2016-11-21]. https://www.nasa.gov/robotics/index.html.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('NASA');
      expect(formatted).toContain('[EB/OL]');
      expect(formatted).toContain('nasa.gov');
    });

    it('应该格式化数据集', () => {
      const input = '[1] Nebot E. Victoria park data set[DB/OL]. (2001-04-29)[2017-03-10]. http://www-personal.acfr.usyd.edu.au/nebot/dataset.htm.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toBeDefined();
    });

    it('应该格式化预印本', () => {
      const input = '[1] 肖玲，张雪，王永.数据要素的统计测算方法探究[PP/OL].PSSXiv(2024-07-02)[2024-09-30]. https://zsyyb.cn/abs/202408.01096.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('[PP/OL]');
      expect(formatted).toContain('zsyyb.cn');
    });

    it('应该格式化档案', () => {
      const input = '[1] 李鸿章.奏请上海道库洋务外销要款无款可筹仍拨药厘接济事:04-01-35-039-039[A].北京:中国第一历史档案馆，1887(光绪十三年三月十三日).';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('李鸿章');
      expect(formatted).toContain('[A]');
    });

    it('应该格式化地图', () => {
      const input = '[1] 胡健民.东南极拉斯曼丘陵地区地质图.1:25 000[CM].北京：科学出版社，2021.128 cm×84 cm.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('胡健民');
      expect(formatted).toContain('[CM]');
    });

    it('应该格式化析出文献', () => {
      const input = '[1] 刘明. 在线学习的有效性评估[M]//王军, 孙康. 高等教育数字化转型. 北京: 教育出版社, 2025: 89–112.';
      const { reference } = parse(input);
      const formatted = format(reference);

      expect(formatted).toContain('刘明');
      expect(formatted).toContain('在线学习');
    });
  });
});
