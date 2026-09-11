import { describe, it, expect } from 'vitest';
import { ThesisParser } from '../../parsers/8.7-d-thesis-parser.js';
import { tokenize } from '../../tokenizer/index.js';

describe('ThesisParser', () => {
  const parser = new ThesisParser();

  describe('match', () => {
    it('应该匹配 [D] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文[D]. 北京: 清华大学, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('应该匹配 [D/OL] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 论文[D/OL]. 北京: 清华大学, 2025.');
      expect(parser.match(tokens)).toBe(true);
    });

    it('不应该匹配 [M] 类型标识', () => {
      const tokens = tokenize('[1] 张三. 书名[M]. 北京: 出版社, 2025.');
      expect(parser.match(tokens)).toBe(false);
    });

    it('当没有类型标识时不应该匹配', () => {
      const tokens = tokenize('[1] 张三. 论文.');
      expect(parser.match(tokens)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该解析基本的学位论文引用', () => {
      const input = '[1] 张三. 深度学习在计算机视觉中的应用[D]. 北京: 清华大学, 2023.';
      const result = parser.parse(tokenize(input));

      expect(result.type).toBe('D');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('张三');
      expect(result.title).toBe('深度学习在计算机视觉中的应用');
      expect(result.awardPlace).toBe('北京');
      expect(result.awardInstitution).toBe('清华大学');
    });

    it('应该解析带有页码的学位论文', () => {
      const input = '[1] 李四. 自然语言处理研究[D]. 北京: 北京大学, 2024: 150.';
      const result = parser.parse(tokenize(input));

      expect(result.type).toBe('D');
      expect(result.title).toBe('自然语言处理研究');
      expect(result.awardPlace).toBe('北京');
      expect(result.awardInstitution).toBe('北京大学');
      expect(result.awardYear).toBe('2024');
      expect(result.pages).toBe('150');
    });

    it('应该解析带有授予地的学位论文', () => {
      const input = '[2] 赵六. 机器学习算法研究[D]. 上海: 上海交通大学, 2024.';
      const result = parser.parse(tokenize(input));

      expect(result.awardPlace).toBe('上海');
      expect(result.awardInstitution).toBe('上海交通大学');
      expect(result.awardYear).toBe('2024');
    });

    it('应该解析带有 URL 的学位论文', () => {
      const input = '[3] 孙七. 计算机视觉[D]. 北京: 北京大学, 2025. https://example.com';
      const result = parser.parse(tokenize(input));

      expect(result.url).toBe('https://example.com');
    });

    it('应该解析没有页码的学位论文', () => {
      const input = '[4] 周八. 数据挖掘[D]. 广州: 中山大学, 2024.';
      const result = parser.parse(tokenize(input));

      expect(result.pages).toBeUndefined();
    });

    it('应该保留学位授予地中的空格', () => {
      const input = '[5] Smith J. Deep learning[D]. New York: Columbia University, 2023.';
      const result = parser.parse(tokenize(input));

      expect(result.awardPlace).toBe('New York');
      expect(result.awardInstitution).toBe('Columbia University');
      expect(result.awardYear).toBe('2023');
    });

    it('应该保留学位授予单位和授予地中的多个空格', () => {
      const input = '[6] author. Research[D]. Boston  MA:  Massachusetts  Institute  of  Technology, 2022.';
      const result = parser.parse(tokenize(input));

      expect(result.awardPlace).toBe('Boston  MA');
      expect(result.awardInstitution).toBe('Massachusetts  Institute  of  Technology');
      expect(result.awardYear).toBe('2022');
    });
  });

  describe('标准 §8.7 示例', () => {
    it('例[1] 应解析中文学位论文', () => {
      const input = '[1] 王琦. 融合星载 GNSS-R 和 SAR 数据的高时空分辨率土壤湿度反演方法研究[D]. 武汉: 武汉大学, 2022: 87.';
      const result = parser.parse(tokenize(input));

      expect(result.type).toBe('D');
      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].name).toBe('王琦');
      expect(result.title).toBe('融合星载 GNSS-R 和 SAR 数据的高时空分辨率土壤湿度反演方法研究');
      expect(result.awardPlace).toBe('武汉');
      expect(result.awardInstitution).toBe('武汉大学');
      expect(result.awardYear).toBe('2022');
      expect(result.pages).toBe('87');
    });

    it('例[2] 应解析在线学位论文（含 URL）', () => {
      const input = '[2] 金燕萍 . 社交媒体时代的虚假信息研究 [D/OL]. 温州 : 温州大学 , 2020: 16. https://d.wanfangdata.com.cn/thesis/D02216281.';
      const result = parser.parse(tokenize(input));

      expect(result.type).toBe('D');
      expect(result.mediaType).toBe('OL');
      expect(result.title).toBe('社交媒体时代的虚假信息研究');
      expect(result.awardPlace).toBe('温州');
      expect(result.awardInstitution).toBe('温州大学');
      expect(result.awardYear).toBe('2020');
      expect(result.pages).toBe('16');
      expect(result.url).toBe('https://d.wanfangdata.com.cn/thesis/D02216281.');
    });

    it('例[3] 应解析在线学位论文（含 CSTR 标识符）', () => {
      const input = '[3] 井丽南. 支持状态可编程的 SDN 交换机关键技术研究[D/OL]. 北京: 中国科学院大学, 2022: 43. http://dpaper.las.ac.cn/Dpaper/detail/detailNew?paperID=20209289. CSTR:35001.37.01.33142.20220037.';
      const result = parser.parse(tokenize(input));

      expect(result.type).toBe('D');
      expect(result.mediaType).toBe('OL');
      expect(result.title).toBe('支持状态可编程的 SDN 交换机关键技术研究');
      expect(result.awardPlace).toBe('北京');
      expect(result.awardInstitution).toBe('中国科学院大学');
      expect(result.awardYear).toBe('2022');
      expect(result.pages).toBe('43');
      expect(result.url).toBe('http://dpaper.las.ac.cn/Dpaper/detail/detailNew?paperID=20209289.');
    });

    it('例[4] 应解析英文学位论文', () => {
      const input = '[4] Cairns B R. Infrared spectroscopic studies of solid oxygen [D]. Berkeley: University of California, Berkeley, 1965: 15.';
      const result = parser.parse(tokenize(input));

      expect(result.type).toBe('D');
      expect(result.title).toBe('Infrared spectroscopic studies of solid oxygen');
      expect(result.awardPlace).toBe('Berkeley');
      expect(result.awardInstitution).toBe('University of California');
      expect(result.awardYear).toBe('1965');
      expect(result.pages).toBe('15');
    });

    it('例[5] 应解析在线英文学位论文（含 URL 和 accession number）', () => {
      const input = '[5] Christou A. Improving knowledge graph understanding with contextual views[D/OL]. Ohio: Wright State University, 2024: 18. http://rave.ohiolink.edu/etdc/view?acc_num=wright171587815 9408301.';
      const result = parser.parse(tokenize(input));

      expect(result.type).toBe('D');
      expect(result.mediaType).toBe('OL');
      expect(result.title).toBe('Improving knowledge graph understanding with contextual views');
      expect(result.awardPlace).toBe('Ohio');
      expect(result.awardInstitution).toBe('Wright State University');
      expect(result.awardYear).toBe('2024');
      expect(result.pages).toBe('18');
      expect(result.url).toBe('http://rave.ohiolink.edu/etdc/view?acc_num=wright171587815');
    });
  });
});
