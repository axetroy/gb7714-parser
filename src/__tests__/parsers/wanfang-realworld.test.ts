import { describe, it, expect } from 'vitest';
import { parse, parseAll, format } from '../../index.js';
import type { Journal, Patent, Standard } from '../../types/index.js';

function p(citation: string): string {
  return `[1] ${citation}`;
}

describe('万方数据真实引文测试', () => {
  describe('期刊论文 [J]', () => {
    it('方红卫-人工智能技术AI在水沙数学模型中的应用', () => {
      const { reference } = parse<Journal>(p('方红卫,张文俊. 人工智能技术(AI)在水沙数学模型中的应用[J]. 水利学报,2026,57(6):809-820. DOI:10.3724/j.slxb.20250419.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(2);
      expect(reference.authors[0].name).toBe('方红卫');
      expect(reference.authors[1].name).toBe('张文俊');
      expect(reference.title).toContain('人工智能技术');
      expect(reference.journalTitle).toBe('水利学报');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('57');
      expect(reference.issue).toBe('6');
      expect(reference.pages).toBe('809-820');
    });

    it('刘志伟-人工智能与企业投资效率提升', () => {
      const { reference } = parse<Journal>(p('刘志伟,张秋生. 人工智能与企业投资效率提升[J]. 财经论丛（浙江财经学院学报）,2026,42(2):78-88. DOI:10.3969/j.issn.1004-4892.2026.02.007.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(2);
      expect(reference.authors[0].name).toBe('刘志伟');
      expect(reference.authors[1].name).toBe('张秋生');
      expect(reference.title).toContain('人工智能与企业投资效率');
      expect(reference.journalTitle).toContain('财经论丛');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('42');
      expect(reference.issue).toBe('2');
      expect(reference.pages).toBe('78-88');
    });

    it('林耿-人工智能与地理学的未来', () => {
      const { reference } = parse<Journal>(p('林耿,叶超,黄耿志,等. 人工智能与地理学的未来[J]. 热带地理,2026,46(1):1-16. DOI:10.13284/j.cnki.rddl.20251507.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(3);
      expect(reference.authors[0].name).toBe('林耿');
      expect(reference.authors[1].name).toBe('叶超');
      expect(reference.authors[2].name).toBe('黄耿志');
      expect(reference.title).toContain('人工智能与地理学');
      expect(reference.journalTitle).toBe('热带地理');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('46');
      expect(reference.issue).toBe('1');
      expect(reference.pages).toBe('1-16');
    });

    it('郁建兴-人工智能时代的社会空间治理', () => {
      const { reference } = parse<Journal>(p('郁建兴,谭立力. 人工智能时代的社会空间治理[J]. 热带地理,2026,46(1):36-45. DOI:10.13284/j.cnki.rddl.20251502.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(2);
      expect(reference.authors[0].name).toBe('郁建兴');
      expect(reference.authors[1].name).toBe('谭立力');
      expect(reference.title).toContain('人工智能时代的社会空间治理');
      expect(reference.journalTitle).toBe('热带地理');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('46');
      expect(reference.issue).toBe('1');
      expect(reference.pages).toBe('36-45');
    });

    it('杨锐-城市人工智能产业密度与企业合规', () => {
      const { reference } = parse<Journal>(p('杨锐,李荣荣. 城市人工智能产业密度与企业合规[J]. 财经论丛（浙江财经学院学报）,2026,42(6):15-30. DOI:10.3969/j.issn.1004-4892.2026.06.003.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(2);
      expect(reference.authors[0].name).toBe('杨锐');
      expect(reference.authors[1].name).toBe('李荣荣');
      expect(reference.title).toContain('城市人工智能产业密度');
      expect(reference.journalTitle).toContain('财经论丛');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('42');
      expect(reference.issue).toBe('6');
      expect(reference.pages).toBe('15-30');
    });

    it('杨君侠-量子人工智能', () => {
      const { reference } = parse<Journal>(p('杨君侠,蔡淇智,郭晋荣,等. 量子人工智能:人工智能与量子计算的双向赋能机制与前沿进展[J]. 物理学报,2026,75(10):84-115. DOI:10.7498/aps.75.20251792.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(3);
      expect(reference.authors[0].name).toBe('杨君侠');
      expect(reference.authors[1].name).toBe('蔡淇智');
      expect(reference.authors[2].name).toBe('郭晋荣');
      expect(reference.title).toContain('量子人工智能');
      expect(reference.journalTitle).toBe('物理学报');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('75');
      expect(reference.issue).toBe('10');
      expect(reference.pages).toBe('84-115');
    });

    it('牟砚堂-人工智能全球治理前景分析', () => {
      const { reference } = parse<Journal>(p('牟砚堂,袁和静. 人工智能全球治理前景分析[J]. 科学学研究,2026,44(4):673-680,712. DOI:10.3969/j.issn.1003-2053.2026.04.001.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(2);
      expect(reference.authors[0].name).toBe('牟砚堂');
      expect(reference.authors[1].name).toBe('袁和静');
      expect(reference.title).toContain('人工智能全球治理前景');
      expect(reference.journalTitle).toBe('科学学研究');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('44');
      expect(reference.issue).toBe('4');
      expect(reference.pages).toContain('673');
    });

    it('熊易寒-人工智能时代的公共治理范式变革', () => {
      const { reference } = parse<Journal>(p('熊易寒,刘振琳. 人工智能时代的公共治理范式变革[J]. 行政论坛,2026,33(2):90-100. DOI:10.3969/j.issn.1005-460X.2026.02.009.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(2);
      expect(reference.authors[0].name).toBe('熊易寒');
      expect(reference.authors[1].name).toBe('刘振琳');
      expect(reference.title).toContain('人工智能时代的公共治理范式变革');
      expect(reference.journalTitle).toBe('行政论坛');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('33');
      expect(reference.issue).toBe('2');
      expect(reference.pages).toBe('90-100');
    });

    it('李悦荣-人工智能应用对企业税负的影响', () => {
      const { reference } = parse<Journal>(p('李悦荣,李建军,赵薇. 人工智能应用对企业税负的影响[J]. 税务与经济,2026(4):35-44. DOI:10.3969/j.issn.1004-9339.2026.04.004.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(3);
      expect(reference.authors[0].name).toBe('李悦荣');
      expect(reference.authors[1].name).toBe('李建军');
      expect(reference.authors[2].name).toBe('赵薇');
      expect(reference.title).toContain('人工智能应用对企业税负');
      expect(reference.journalTitle).toBe('税务与经济');
      expect(reference.year).toBe('2026');
      expect(reference.issue).toBe('4');
      expect(reference.pages).toBe('35-44');
    });

    it('牛嘉玮-人工智能应用人力资本结构与劳动力配置效率', () => {
      const { reference } = parse<Journal>(p('牛嘉玮,江小辉. 人工智能应用、人力资本结构与劳动力配置效率[J]. 中国人力资源开发,2026,43(2):94-108. DOI:10.16471/j.cnki.11-2822/c.2026.2.006.'));
      expect(reference.type).toBe('J');
      expect(reference.authors.length).toBeGreaterThanOrEqual(2);
      expect(reference.authors[0].name).toBe('牛嘉玮');
      expect(reference.authors[1].name).toBe('江小辉');
      expect(reference.title).toContain('人工智能应用');
      expect(reference.journalTitle).toBe('中国人力资源开发');
      expect(reference.year).toBe('2026');
      expect(reference.volume).toBe('43');
      expect(reference.issue).toBe('2');
      expect(reference.pages).toBe('94-108');
    });
  });

  describe('专利 [P]', () => {
    it('深圳火炎焱-文本内容快速分类管理方法', () => {
      const { reference } = parse<Patent>(p('深圳火炎焱人工智能有限公司. 一种基于人工智能的文本内容快速分类管理方法及系统:CN202610137209.5[P]. 2026-05-12.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toBe('深圳火炎焱人工智能有限公司');
      expect(reference.title).toContain('文本内容快速分类管理方法');
      expect(reference.patentNumber).toBe('CN202610137209.5');
      expect(reference.announceDate).toBe('2026-05-12');
    });

    it('精英中汇-人工智能面部识别装置', () => {
      const { reference } = parse<Patent>(p('精英中汇(深圳)人工智能有限公司. 一种人工智能面部识别装置:CN202520252068.2[P]. 2026-03-06.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toContain('精英中汇');
      expect(reference.title).toContain('人工智能面部识别装置');
      expect(reference.patentNumber).toBe('CN202520252068.2');
      expect(reference.announceDate).toBe('2026-03-06');
    });

    it('蓝婴智能-语音交互型智能头盔', () => {
      const { reference } = parse<Patent>(p('深圳市蓝婴智能科技有限公司,深圳全智人工智能有限公司. 一种基于人工智能语音交互型智能头盔及语音控制方法:CN202610602628.1[P]. 2026-07-17.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(2);
      expect(reference.authors[0].name).toBe('深圳市蓝婴智能科技有限公司');
      expect(reference.authors[1].name).toBe('深圳全智人工智能有限公司');
      expect(reference.title).toContain('语音交互型智能头盔');
      expect(reference.patentNumber).toBe('CN202610602628.1');
      expect(reference.announceDate).toBe('2026-07-17');
    });

    it('上海人工智能创新中心-生成式AI合规审计', () => {
      const { reference } = parse<Patent>(p('上海人工智能创新中心. 一种基于动态法规图谱的端到端自适应生成式人工智能合规审计方法及系统:CN202610542794.7[P]. 2026-05-26.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toBe('上海人工智能创新中心');
      expect(reference.title).toContain('生成式人工智能合规审计');
      expect(reference.patentNumber).toBe('CN202610542794.7');
      expect(reference.announceDate).toBe('2026-05-26');
    });

    it('陕西凯晨轩-开发工具插件同步方法', () => {
      const { reference } = parse<Patent>(p('陕西凯晨轩人工智能科技有限公司. 一种基于人工智能的开发工具插件同步方法:CN202610116460.3[P]. 2026-05-15.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toBe('陕西凯晨轩人工智能科技有限公司');
      expect(reference.title).toContain('开发工具插件同步方法');
      expect(reference.patentNumber).toBe('CN202610116460.3');
      expect(reference.announceDate).toBe('2026-05-15');
    });

    it('墨芯人工智能-芯片集群节点资源配置', () => {
      const { reference } = parse<Patent>(p('墨芯人工智能科技(深圳)有限公司. 用于人工智能芯片集群的节点资源配置方法:CN202610219094.4[P]. 2026-05-26.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toContain('墨芯人工智能');
      expect(reference.title).toContain('芯片集群的节点资源配置');
      expect(reference.patentNumber).toBe('CN202610219094.4');
      expect(reference.announceDate).toBe('2026-05-26');
    });

    it('上海人工智能创新中心-大模型搜索可视化', () => {
      const { reference } = parse<Patent>(p('上海人工智能创新中心. 一种将人工智能大模型搜索引擎的思考分析过程可视化呈现的交互系统及方法:CN202610738188.2[P]. 2026-06-26.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toBe('上海人工智能创新中心');
      expect(reference.title).toContain('大模型搜索引擎');
      expect(reference.patentNumber).toBe('CN202610738188.2');
      expect(reference.announceDate).toBe('2026-06-26');
    });

    it('合肥瑞徽-软件信息异常筛查方法', () => {
      const { reference } = parse<Patent>(p('合肥瑞徽人工智能研究院有限公司. 一种基于人工智能的软件信息异常筛查方法和系统:CN202511469803.6[P]. 2026-01-06.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toBe('合肥瑞徽人工智能研究院有限公司');
      expect(reference.title).toContain('软件信息异常筛查方法');
      expect(reference.patentNumber).toBe('CN202511469803.6');
      expect(reference.announceDate).toBe('2026-01-06');
    });

    it('中医科学院-人工智能视功能扩大方法', () => {
      const { reference } = parse<Patent>(p('中国中医科学院眼科医院,大连理工大学人工智能大连研究院. 一种人工智能视功能扩大方法及系统:CN202511523021.6[P]. 2026-02-06.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(2);
      expect(reference.authors[0].name).toBe('中国中医科学院眼科医院');
      expect(reference.authors[1].name).toBe('大连理工大学人工智能大连研究院');
      expect(reference.title).toContain('人工智能视功能扩大方法');
      expect(reference.patentNumber).toBe('CN202511523021.6');
      expect(reference.announceDate).toBe('2026-02-06');
    });

    it('人工智能金融科技-投资智能风险评估', () => {
      const { reference } = parse<Patent>(p('人工智能金融科技实验室有限公司. 基于人工智能的投资智能风险评估与决策辅助方法:CN202610266682.3[P]. 2026-06-12.'));
      expect(reference.type).toBe('P');
      expect(reference.authors.length).toBe(1);
      expect(reference.authors[0].name).toBe('人工智能金融科技实验室有限公司');
      expect(reference.title).toContain('投资智能风险评估');
      expect(reference.patentNumber).toBe('CN202610266682.3');
      expect(reference.announceDate).toBe('2026-06-12');
    });
  });

  describe('标准 [S]', () => {
    it('GB/T 5271.28-2001 信息技术词汇第28部分', () => {
      const { reference } = parse<Standard>(p('GB/T 5271.28-2001 信息技术  词汇  第28部分;人工智能  基本概念与专家系统[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toBeTruthy();
    });

    it('GB/T 41867-2022 信息技术人工智能术语', () => {
      const { reference } = parse<Standard>(p('GB/T 41867-2022 信息技术  人工智能  术语[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toBeTruthy();
    });

    it('GB/T 42018-2022 信息技术人工智能平台计算资源', () => {
      const { reference } = parse<Standard>(p('GB/T 42018-2022 信息技术  人工智能  平台计算资源规范[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toBeTruthy();
    });

    it('YY/T 1833.1-2022 人工智能医疗器械术语', () => {
      const { reference } = parse<Standard>(p('YY/T 1833.1-2022 人工智能医疗器械  质量要求和评价  第1部分:术语[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toContain('术语');
    });

    it('GB/T 42131-2022 人工智能知识图谱技术框架', () => {
      const { reference } = parse<Standard>(p('GB/T 42131-2022 人工智能  知识图谱技术框架[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toBeTruthy();
    });

    it('YY/T 1833.2-2022 人工智能医疗器械数据集', () => {
      const { reference } = parse<Standard>(p('YY/T 1833.2-2022 人工智能医疗器械  质量要求和评价  第2部分:数据集通用要求[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toContain('数据集');
    });

    it('YY/T 1858-2022 人工智能医疗器械肺部影像', () => {
      const { reference } = parse<Standard>(p('YY/T 1858-2022 人工智能医疗器械  肺部影像辅助分析软件  算法性能测试方法[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toContain('肺部影像');
    });

    it('YY/T 1833.3-2022 人工智能医疗器械数据标注', () => {
      const { reference } = parse<Standard>(p('YY/T 1833.3-2022 人工智能医疗器械  质量要求和评价  第3部分:数据标注通用要求[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toContain('数据标注');
    });

    it('GB/T 40691-2021 人工智能情感计算用户界面', () => {
      const { reference } = parse<Standard>(p('GB/T 40691-2021 人工智能  情感计算用户界面  模型[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toBeTruthy();
    });

    it('GB/T 5271.31-2006 信息技术词汇机器学习', () => {
      const { reference } = parse<Standard>(p('GB/T 5271.31-2006 信息技术.词汇.第31部分:人工智能.机器学习[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toContain('机器学习');
    });

    it('GB/T 5271.34-2006 信息技术词汇神经网络', () => {
      const { reference } = parse<Standard>(p('GB/T 5271.34-2006 信息技术.词汇.第34部分:人工智能.神经网络[S].'));
      expect(reference.type).toBe('S');
      expect(reference.standardNumber).toBeTruthy();
      expect(reference.standardName).toContain('神经网络');
    });
  });

  describe('格式化测试', () => {
    it('期刊论文格式化包含[J]标记', () => {
      const { reference } = parse<Journal>(p('方红卫,张文俊. 人工智能技术(AI)在水沙数学模型中的应用[J]. 水利学报,2026,57(6):809-820.'));
      const formatted = format(reference);
      expect(formatted).toContain('[J]');
      expect(formatted).toContain(reference.title);
      expect(formatted).toContain('2026');
    });

    it('标准格式化包含[S]标记', () => {
      const { reference } = parse<Standard>(p('GB/T 41867-2022 信息技术  人工智能  术语[S].'));
      const formatted = format(reference);
      expect(formatted).toContain('[S]');
      expect(formatted).toContain(reference.title);
    });

    it('专利格式化包含[P]标记', () => {
      const { reference } = parse<Patent>(p('深圳火炎焱人工智能有限公司. 一种基于人工智能的文本内容快速分类管理方法及系统:CN202610137209.5[P]. 2026-05-12.'));
      const formatted = format(reference);
      expect(formatted).toContain('[P]');
      expect(formatted).toContain(reference.title);
    });
  });

  describe('批量解析测试', () => {
    it('parseAll解析多条期刊论文', () => {
      const results = parseAll([
        p('方红卫,张文俊. 人工智能技术(AI)在水沙数学模型中的应用[J]. 水利学报,2026,57(6):809-820.'),
        p('刘志伟,张秋生. 人工智能与企业投资效率提升[J]. 财经论丛,2026,42(2):78-88.'),
        p('林耿,叶超,黄耿志,等. 人工智能与地理学的未来[J]. 热带地理,2026,46(1):1-16.'),
      ]);
      expect(results.length).toBe(3);
      results.forEach(r => {
        expect(r.reference.type).toBe('J');
      });
    });

    it('parseAll解析混合类型', () => {
      const results = parseAll([
        p('方红卫,张文俊. 人工智能技术(AI)在水沙数学模型中的应用[J]. 水利学报,2026,57(6):809-820.'),
        p('深圳火炎焱人工智能有限公司. 一种基于人工智能的文本内容快速分类管理方法及系统:CN202610137209.5[P]. 2026-05-12.'),
        p('GB/T 41867-2022 信息技术  人工智能  术语[S].'),
      ]);
      expect(results.length).toBe(3);
      const types = results.map(r => r.reference.type);
      expect(types).toContain('J');
      expect(types).toContain('P');
      expect(types).toContain('S');
    });
  });
});
