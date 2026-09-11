import { describe, it, expect } from 'vitest';
import { ProceedingsParser } from '../../parsers/8.6-c-proceedings-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ProceedingsParser', () => {
  const parser = new ProceedingsParser();

  describe('match', () => {
    it('应该匹配 [C] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文[C]. 会议名，2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [C/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文[C/OL]. 会议名，2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M].');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 论文.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析带有会议信息的会议录引用', () => {
      const input = '[1] 张三. 人工智能应用[C]//大会, 2025: 100-110.';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('C');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('张三');
      expect(result.title).toBe('人工智能应用');
    });

    it('应该解析没有会议信息的会议录引用', () => {
      const input = '[2] 李四. 机器学习[C].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.type).toBe('C');
      expect(result.title).toBe('机器学习');
    });

    it('应该解析带有多个作者的会议录', () => {
      const input = '[3] 王五，赵六. 深度学习[C].';
      const tokens = tokenize(input);
      const result = parser.parse(tokens);

      expect(result.authors).toHaveLength(2);
      expect(result.authors[0].name).toBe('王五');
      expect(result.authors[1].name).toBe('赵六');
    });
  });

  describe('标准 §8.6 示例', () => {
    it('例[1] 应解析图书形式会议录', () => {
      const input = '[1] 牛志明，Swingland I R，雷光春. 综合湿地管理：综合湿地管理国际研讨会论文集[C]. 北京: 海洋出版社, 2012.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.authors).toHaveLength(3);
      expect(result.authors[0].name).toBe('牛志明');
      expect(result.title).toBe('综合湿地管理');
      expect(result.subtitle).toBe('综合湿地管理国际研讨会论文集');
      expect(result.publisherPlace).toBe('北京');
      expect(result.publisher).toBe('海洋出版社');
      expect(result.year).toBe('2012');
    });

    it('例[2] 应解析带出版信息的析出文献形式', () => {
      const input = '[2] 汪学军. 中国农业转基因生物研发进展与安全管理[C]//国家环境保护总局生物安全管理办公室. 中国国家生物安全框架实施国际合作项目研讨会论文集. 北京: 中国环境科学出版社, 2005: 22-25.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.title).toBe('中国农业转基因生物研发进展与安全管理');
      expect(result.pages).toBe('22-25');
    });

    it('例[3] 应解析含数字的会议论文集题名', () => {
      const input = '[3] 肖希明，石庆功，刘奕. 民国图书馆学教育的社会贡献[C]//纪念北京大学图书馆学教育 100 周年研讨会论文集. 北京: 北京大学信息管理系, 2024: 134-147.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.title).toBe('民国图书馆学教育的社会贡献');
      expect(result.pages).toBe('134-147');
    });

    it('例[4] 应解析英文图书形式会议录', () => {
      const input = '[4] Yufin S A. Geoecology and computers: proceedings of the Third International Conference on Advances of Computer Methods in Geotechnical and Geoenvironmental Engineering, Moscow, Russia, February 1-4, 2000[C]. Rotterdam: A. A. Balkema, 2000.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.title).toBe('Geoecology and computers');
      expect(result.subtitle).toContain('proceedings of the Third International Conference');
      expect(result.publisherPlace).toBe('Rotterdam');
      expect(result.year).toBe('2000');
    });

    it('例[5] 应解析含编辑者和详细会议信息的析出文献', () => {
      const input = '[5] Fourney M E. Advances in holographic photoelasticity[C]//Gottenberg W G. Symposium on Applications of Holography in Mechanics, August 23-25, 1971, University of Southern California, Los Angeles, California. New York: ASME, 1971: 17-38.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.title).toBe('Advances in holographic photoelasticity');
      expect(result.conferenceYear).toBe('1971');
      expect(result.pages).toBe('17-38');
    });

    it('例[1] 应解析中文会议论文（含嵌入式数字）', () => {
      const input = '[1] 李妍，王莹. 医疗机构保洁人员二前五后手卫生干预效果研究[C]//中华预防医学会医院感染控制分会第 31 次全国医院感染学术年会, 2022: 2.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.authors).toHaveLength(2);
      expect(result.title).toBe('医疗机构保洁人员二前五后手卫生干预效果研究');
      expect(result.conferenceName).toBe('中华预防医学会医院感染控制分会第 31 次全国医院感染学术年会');
      expect(result.conferenceYear).toBe('2022');
      expect(result.pages).toBe('2');
    });

    it('例[2] 应解析会议名称以年份开头的英文会议论文', () => {
      const input = '[2] Wang Shanshan. Application of improved SOM neural network in intelligent auditing of hospital financial-vouchers[C/OL]//2022 6th Asian Conference on Artificial Intelligence Technology, 2022: 2. https://ieeexplore.ieee.org/document/10137867.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.mediaType).toBe('OL');
      expect(result.title).toBe('Application of improved SOM neural network in intelligent auditing of hospital financial-vouchers');
      expect(result.conferenceName).toBe('2022 6th Asian Conference on Artificial Intelligence Technology');
      expect(result.conferenceYear).toBe('2022');
      expect(result.pages).toBe('2');
      expect(result.url).toBe('https://ieeexplore.ieee.org/document/10137867.');
    });

    it('例[3] 应解析简短会议名称的在线会议论文', () => {
      const input = '[3] Yu Yang, Pan Erting, Wang Xinya, et al. Unmixing before fusion: a generalized paradigm for multi-source-based hyperspectral image synthesis[C/OL]//CVPR, 2024: 4. https://openaccess.thecvf.com/content/CVPR2024/html/Yu_Unmixing_Before_Fusion_A_Generalized_Paradigm_for_Multi-Source-based_Hyperspectral_Image_Synthesis_CVPR_2024_paper.html.';
      const result = parser.parse(tokenize(input));
      expect(result.type).toBe('C');
      expect(result.mediaType).toBe('OL');
      expect(result.title).toBe('Unmixing before fusion');
      expect(result.subtitle).toBe('a generalized paradigm for multi-source-based hyperspectral image synthesis');
      expect(result.conferenceName).toBe('CVPR');
      expect(result.conferenceYear).toBe('2024');
      expect(result.pages).toBe('4');
      expect(result.url).toContain('openaccess.thecvf.com');
    });
  });
});
