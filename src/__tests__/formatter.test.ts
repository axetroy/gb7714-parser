import { describe, it, expect } from 'vitest';
import { Formatter, format, formatCitation } from '../formatter/index.js';
import type { ReferenceUnion } from '../types/index.js';
import { ReferenceType, MediaType } from '../types/index.js';

describe('Formatter', () => {
  describe('format', () => {
    it('应该格式化期刊引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }, { name: '李四' }],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
        volume: '35',
        issue: '2',
        pages: '15-22',
      };
      const result = format(reference);
      expect(result).toBe('张三, 李四 人工智能在教育中的应用[J]. 现代教育技术, 2025, 35(2): 15-22.');
    });

    it('应该格式化图书引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '机器学习导论',
        publisherPlace: '北京',
        publisher: '清华大学出版社',
        year: '2024',
        pages: '156',
      };
      const result = format(reference);
      expect(result).toBe('李四 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.');
    });

    it('应该格式化学位论文引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
        pages: '89',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京: 北京大学, 2025: 89.');
    });

    it('应该格式化网页引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网站标题',
        createDate: '2025-01-01',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 网站标题[EB/OL]. (2025-01-01) [2025-09-07]. https://example.com.');
    });

    it('应该在存在 id 时格式化 id', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        id: '1',
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('[1] 张三 论文标题[J]. 期刊名, 2025.');
    });

    it('应该格式化带有完整姓名的作者', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: 'Smith John' }],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('Smith John Paper Title[J]. Journal Name, 2025.');
    });

    it('应该对超过 3 个作者使用 "等"', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('张三, 李四, 王五, 等 论文标题[J]. 期刊名, 2025.');
    });

    it('应该格式化机构作为作者', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '中国科学院', isOrganization: true }],
        title: '研究报告',
        journalTitle: '科学通报',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('中国科学院 研究报告[J]. 科学通报, 2025.');
    });

    it('应该格式化没有卷号/期号的期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025.');
    });

    it('应该格式化没有页码的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M]. 北京: 出版社, 2025.');
    });

    it('应该格式化带有版本的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        version: '第3版',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M]. 第3版. 北京: 出版社, 2025.');
    });

    it('应该格式化连续出版物', () => {
      const reference: ReferenceUnion = {
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
      const result = format(reference);
      expect(result).toBe('中华医学会湖北分会 临床内科杂志[J]. 1984, 1(1)—. 武汉: 中华医学会湖北分会, 1984—.');
    });

    it('应该格式化带有年份范围的连续出版物', () => {
      const reference: ReferenceUnion = {
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
      const result = format(reference);
      expect(result).toBe('中国图书馆学会 图书馆学通讯[J]. 1957(1)—1990(4). 北京: 北京图书馆, 1957—1990.');
    });
  });

  describe('version-specific formatting', () => {
    it('应该在 2015 版本中使用 DOI', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const formatter = new Formatter({ version: '2015' });
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. DOI:10.1234/test');
    });

    it('应该在 2025 版本中使用 PID', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const formatter = new Formatter({ version: '2025' });
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. PID:10.1234/test');
    });
  });

  describe('type-specific formatting', () => {
    it('应该格式化带有会议信息的会议录', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
        pages: '100-110',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C]. //国际人工智能大会, 2025: 100-110.');
    });

    it('应该格式化没有 conferenceYear 的会议录', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C].');
    });

    it('应该格式化带有标准号的标准', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        authors: [],
        title: '标准名称',
        standardNumber: 'GB/T 3792—2021',
        standardName: '信息与文献馆藏操作',
      };
      const result = format(reference);
      expect(result).toBe('GB/T 3792—2021 信息与文献馆藏操作[S].');
    });

    it('应该格式化带有专利号的专利', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. 2025-09-07.');
    });

    it('应该格式化报告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告;TR-2025-001[R]. 2025-09-07.');
    });

    it('应该格式化档案', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
        collectionPlace: '北京',
        collector: '档案馆',
        formedDate: '1887',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A]. 北京: 档案馆, 1887.');
    });

    it('应该格式化没有收藏地的档案', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A].');
    });

    it('应该格式化地图', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        dimensions: '128 cm × 84 cm',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题. 1:25000[CM].');
    });

    it('应该格式化带有平台的数据集', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        platform: '国家数据中心',
        releaseDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. 国家数据中心 (2025-09-07) [2025-10-01].');
    });

    it('应该格式化没有平台的数据集', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL].');
    });

    it('应该格式化带有平台的预印本', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        platform: 'arXiv',
        createDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. arXiv (2025-09-07) [2025-10-01].');
    });

    it('应该格式化没有平台的预印本', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL].');
    });

    it('应该格式化没有创建日期的网页', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 网页标题[EB/OL]. [2025-09-07]. https://example.com.');
    });

    it('应该格式化没有作者的网页', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('网页标题[EB/OL]. [2025-09-07]. https://example.com.');
    });

    it('应该格式化没有发布日期的报告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告;TR-2025-001[R].');
    });

    it('应该格式化没有公告日期的专利', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P].');
    });

    it('应该格式化没有授予地的学位论文', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京大学, 2025.');
    });

    it('应该格式化没有授予机构的学位论文', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D].');
    });

    it('应该格式化析出文献', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '张三' }],
        title: '析出文献标题',
        host: {
          authors: [{ name: '李四' }],
          title: '图书标题',
          publisherPlace: '北京',
          publisher: '出版社',
          year: '2025',
        },
        pages: '100-110',
      };
      const result = format(reference);
      expect(result).toBe('张三 析出文献标题[M].');
    });

    it('应该格式化带有 URL 的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M]. 北京: 出版社, 2025. https://example.com');
    });

    it('应该格式化带有出版者信息的地图', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        publisherPlace: '北京',
        publisher: '地图出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题. 1:25000[CM]. 北京: 地图出版社, 2025.');
    });

    it('应该格式化带有版本的地图', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        version: '第2版',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题[CM]. 第2版.');
    });

    it('应该格式化带有版本的数据集', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        version: 'v2.0',
        platform: '国家数据中心',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. v2.0. 国家数据中心 [2025-10-01].');
    });

    it('应该格式化带有版本的预印本', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        version: 'v1.0',
        platform: 'arXiv',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. v1.0. arXiv [2025-10-01].');
    });

    it('应该格式化带有 URL 的会议录', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C]. //国际人工智能大会, 2025. https://example.com');
    });

    it('应该格式化带有 URL 的专利', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. https://example.com');
    });

    it('应该格式化带有 URL 的报告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告;TR-2025-001[R]. https://example.com');
    });

    it('应该格式化带有 URL 的档案', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题[A]. https://example.com');
    });

    it('应该格式化带有 URL 的地图', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题[CM]. https://example.com');
    });

    it('应该格式化带有 URL 的期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. https://example.com');
    });

    it('应该格式化带有 id 的地图', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        id: '42',
        authors: [{ name: '张三' }],
        title: '地图标题',
      };
      const result = format(reference);
      expect(result).toBe('[42] 张三 地图标题[CM].');
    });

    it('应该格式化带有 id 的数据集', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        id: '43',
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('[43] 张三 数据集标题[DS/OL].');
    });

    it('应该格式化带有 URL 的数据集', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. https://example.com');
    });

    it('应该格式化带有 id 的预印本', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        id: '44',
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('[44] 张三 预印本标题[PP/OL].');
    });

    it('应该格式化带有 URL 的预印本', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. https://example.com');
    });
  });

  describe('edge cases', () => {
    it('应该处理标准的空作者数组', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        authors: [],
        title: '标准标题',
        standardNumber: 'GB/T 1234',
        standardName: '标准名称',
      };
      const result = format(reference);
      expect(result).toBe('GB/T 1234 标准名称[S].');
    });

    it('应该处理没有年份的引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M].');
    });

    it('应该处理没有出版地的引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M].');
    });

    it('应该处理没有出版者的引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M].');
    });

    it('应该处理通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        year: '2025',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. 2025.');
    });

    it('应该处理带有出版者信息的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        year: '2025',
        publisherPlace: '北京',
        publisher: '出版社',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. 2025. 北京: 出版社.');
    });

    it('应该处理带有 URL 的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        url: 'https://example.com',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. https://example.com');
    });

    it('应该处理没有年份的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X].');
    });

    it('应该处理带有 id 的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        id: '42',
        authors: [{ name: '张三' }],
        title: '通用标题',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('[42] 张三 通用标题[X].');
    });

    it('应该处理没有作者的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [],
        title: '通用标题',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('通用标题[X].');
    });

    it('应该处理没有出版地和出版者的通用类型', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '通用标题',
        year: '2025',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. 2025.');
    });
  });

  describe('version-specific formatting', () => {
    it('应该在 2015 版本中对图书使用 DOI', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
        pid: '10.1234/test',
      };
      const formatter = new Formatter({ version: '2015' });
      const result = formatter.format(reference);
      expect(result).toBe('李四 书名[M]. 北京: 出版社, 2025. DOI:10.1234/test');
    });

    it('应该在 2025 版本中对图书使用 PID', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
        pid: '10.1234/test',
      };
      const formatter = new Formatter({ version: '2025' });
      const result = formatter.format(reference);
      expect(result).toBe('李四 书名[M]. 北京: 出版社, 2025. PID:10.1234/test');
    });
  });

  describe('type-specific formatting', () => {
    it('应该格式化带有 URL 的标准', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        authors: [],
        title: '标准名称',
        standardNumber: 'GB/T 3792—2021',
        standardName: '信息与文献馆藏操作',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('GB/T 3792—2021 信息与文献馆藏操作[S]. https://example.com');
    });

    it('应该格式化带有 id 的标准', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        id: '45',
        authors: [],
        title: '标准名称',
        standardNumber: 'GB/T 3792—2021',
        standardName: '信息与文献馆藏操作',
      };
      const result = format(reference);
      expect(result).toBe('[45] GB/T 3792—2021 信息与文献馆藏操作[S].');
    });

    it('应该格式化带有页码的专利', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
        pages: '10',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. 2025-09-07: 10.');
    });

    it('应该格式化带有页码的报告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
        pages: '50',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告;TR-2025-001[R]. 2025-09-07;50.');
    });

    it('应该格式化没有报告号的报告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '技术报告',
        releaseDate: '2025-09-07',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告[R]. 2025-09-07.');
    });

    it('应该格式化带有尺寸的地图', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        publisherPlace: '北京',
        publisher: '地图出版社',
        year: '2025',
        dimensions: '128 cm × 84 cm',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题. 1:25000[CM]. 北京: 地图出版社, 2025. 128 cm × 84 cm.');
    });

    it('应该格式化带有档案号的档案', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A].');
    });

    it('应该格式化没有档案号的档案', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题[A].');
    });

    it('应该格式化没有会议名称的会议录', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '会议论文集',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C].');
    });

    it('应该格式化没有页码的学位论文', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京: 北京大学, 2025.');
    });

    it('应该格式化带有 id 的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        id: '50',
        authors: [{ name: '李四' }],
        title: '书名',
      };
      const result = format(reference);
      expect(result).toBe('[50] 李四 书名[M].');
    });

    it('应该格式化带有 pid 的期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const result = format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. PID:10.1234/test');
    });

    it('应该格式化带有 URL 的学位论文', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京: 北京大学, 2025. https://example.com');
    });

    it('应该格式化带有作者的网页', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        createDate: '2025-01-01',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 网页标题[EB/OL]. (2025-01-01) [2025-09-07]. https://example.com.');
    });

    it('应该格式化带有发布日期的数据集', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        platform: '国家数据中心',
        releaseDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. 国家数据中心 (2025-09-07) [2025-10-01].');
    });

    it('应该格式化带有创建日期的预印本', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        platform: 'arXiv',
        createDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. arXiv (2025-09-07) [2025-10-01].');
    });

    it('应该格式化带有收藏地的档案', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
        collectionPlace: '北京',
        collector: '档案馆',
        formedDate: '1887',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题[A]. 北京: 档案馆, 1887.');
    });
  });

  describe('locale support', () => {
    it('应该在中文区域设置（默认）中使用 "等"', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toContain('等');
      expect(result).not.toContain('et al.');
    });

    it('应该在英文区域设置中使用 "et al."', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: 'Smith' },
          { name: 'Johnson' },
          { name: 'Williams' },
          { name: 'Brown' },
        ],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const formatter = new Formatter({ locale: 'en' });
      const result = formatter.format(reference);
      expect(result).toContain('et al.');
      expect(result).not.toContain('等');
    });
  });

  describe('subtitle support', () => {
    it('应该格式化带有副标题的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '李四' }],
        title: '机器学习',
        subtitle: '理论与实践',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 机器学习: 理论与实践[M]. 北京: 出版社, 2025.');
    });

    it('应该格式化带有副标题的期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '人工智能研究',
        subtitle: '综述篇',
        journalTitle: '计算机学报',
        year: '2025',
        volume: '48',
        issue: '1',
      };
      const result = format(reference);
      expect(result).toBe('张三 人工智能研究: 综述篇[J]. 计算机学报, 2025, 48(1).');
    });

    it('应该格式化带有副标题的学位论文', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '王五' }],
        title: '深度学习',
        subtitle: '基于Transformer的研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习: 基于Transformer的研究[D]. 北京: 北京大学, 2025.');
    });
  });

  describe('otherAuthors support', () => {
    it('应该格式化带有其他作者（译者）的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: 'Smith' }],
        title: 'AI Handbook',
        otherAuthors: [{ name: '张三' }],
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('Smith AI Handbook[M]. 张三. 北京: 出版社, 2025.');
    });

    it('应该格式化带有多个其他作者的图书', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: 'Smith' }],
        title: 'AI Handbook',
        otherAuthors: [
          { name: '张三' },
          { name: '李四' },
        ],
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('Smith AI Handbook[M]. 张三, 李四. 北京: 出版社, 2025.');
    });
  });

  describe('component part with pages', () => {
    it('应该格式化带有主机信息和页码的析出文献', () => {
      const reference: ReferenceUnion = {
        type: 'Z' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '析出文献标题',
        host: {
          authors: [{ name: '李四' }],
          title: '图书标题',
          publisherPlace: '北京',
          publisher: '出版社',
          year: '2025',
        },
        pages: '100-110',
      } as ReferenceUnion;
      const result = format(reference);
      // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
      expect(result).toBe('张三 析出文献标题[Z]// 李四 图书标题. 北京: 出版社, 2025: 100-110.');
    });

    it('应该格式化没有页码的析出文献', () => {
      const reference: ReferenceUnion = {
        type: 'Z' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '析出文献标题',
        host: {
          authors: [{ name: '李四' }],
          title: '图书标题',
          publisherPlace: '北京',
          publisher: '出版社',
          year: '2025',
        },
      } as ReferenceUnion;
      const result = format(reference);
      // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
      expect(result).toBe('张三 析出文献标题[Z]// 李四 图书标题. 北京: 出版社, 2025.');
    });

    it('应该格式化带有副标题的析出文献', () => {
      const reference: ReferenceUnion = {
        type: 'Z' as ReferenceUnion['type'],
        authors: [{ name: '张三' }],
        title: '析出文献',
        subtitle: '副标题',
        host: {
          title: '图书标题',
        },
      } as ReferenceUnion;
      const result = format(reference);
      // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
      expect(result).toBe('张三 析出文献: 副标题[Z]// 图书标题.');
    });
  });

  describe('Formatter class', () => {
    it('应该使用默认选项创建 Formatter', () => {
      const formatter = new Formatter();
      expect(formatter).toBeDefined();
    });

    it('应该创建 2015 版本的 Formatter', () => {
      const formatter = new Formatter({ version: '2015' });
      expect(formatter).toBeDefined();
    });

    it('应该使用 format 方法格式化引用', () => {
      const formatter = new Formatter();
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025.');
    });
  });

  describe('formatCitation', () => {
    it('应该格式化数字引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        id: '5',
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      expect(formatCitation(reference)).toBe('[5]');
    });

    it('应该格式化没有 id 的数字引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      expect(formatCitation(reference)).toBe('');
    });

    it('应该格式化作者-年份引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'author-date' });
      expect(result).toBe('(张三, 2025)');
    });

    it('应该格式化带有多个作者的作者-年份引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'author-date' });
      expect(result).toBe('(张三, 等, 2025)');
    });

    it('应该格式化英文的作者-年份引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: 'Smith' },
          { name: 'Johnson' },
        ],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'author-date', locale: 'en' });
      expect(result).toBe('(Smith, et al., 2025)');
    });

    it('应该格式化单个作者的作者-年份引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: 'Smith' }],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'author-date', locale: 'en' });
      expect(result).toBe('(Smith, 2025)');
    });

    it('应该格式化没有年份的作者-年份引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '',
      };
      const result = formatCitation(reference, { citationStyle: 'author-date' });
      expect(result).toBe('');
    });

    it('应该格式化没有作者的作者-年份引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'author-date' });
      expect(result).toBe('(2025)');
    });
  });

  describe('author-date journal format', () => {
    it('应该在作者-年份样式中将年份放在作者之后格式化期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        volume: '35',
        issue: '2',
        pages: '15-22',
      };
      const formatter = new Formatter({ citationStyle: 'author-date' });
      const result = formatter.format(reference);
      expect(result).toBe('张三, 2025. 论文标题[J]. 期刊名, 35(2): 15-22.');
    });

    it('应该在作者之后格式化带有多个作者的期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        volume: '10',
        issue: '1',
      };
      const formatter = new Formatter({ citationStyle: 'author-date' });
      const result = formatter.format(reference);
      // 参考文献表: 前3个 + "等" (§7.1.2)
      expect(result).toBe('张三, 李四, 王五, 等, 2025. 论文标题[J]. 期刊名, 10(1).');
    });

    it('应该在作者-年份样式中格式化没有卷号/期号的期刊', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const formatter = new Formatter({ citationStyle: 'author-date' });
      const result = formatter.format(reference);
      expect(result).toBe('张三, 2025. 论文标题[J]. 期刊名.');
    });
  });

  describe('footnote citation', () => {
    it('应该使用带圈数字格式化脚注引用', () => {
      const reference: ReferenceUnion = {
        id: '1',
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'footnote' });
      expect(result).toBe('①');
    });

    it('应该格式化编号大于 10 的脚注引用', () => {
      const reference: ReferenceUnion = {
        id: '11',
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'footnote' });
      expect(result).toBe('⑪');
    });

    it('当 id 缺失时应该返回空字符串', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatCitation(reference, { citationStyle: 'footnote' });
      expect(result).toBe('');
    });
  });

  describe('sortReferences', () => {
    it('应该按语言组排序引用', () => {
      const references: ReferenceUnion[] = [
        {
          type: ReferenceType.J,
          authors: [{ name: 'Smith' }],
          title: 'English Paper',
          journalTitle: 'Journal',
          year: '2025',
        },
        {
          type: ReferenceType.J,
          authors: [{ name: '张三' }],
          title: '中文论文',
          journalTitle: '期刊名',
          year: '2024',
        },
        {
          type: ReferenceType.J,
          authors: [{ name: 'Иванов' }],
          title: 'Русская статья',
          journalTitle: 'Журнал',
          year: '2023',
        },
      ];
      const formatter = new Formatter();
      const sorted = formatter.sortReferences(references);
      // Order: zh, western, ru
      expect(sorted[0]!.authors[0]!.name).toBe('张三');
      expect(sorted[1]!.authors[0]!.name).toBe('Smith');
      expect(sorted[2]!.authors[0]!.name).toBe('Иванов');
    });

    it('应该在相同语言内按作者姓名排序引用', () => {
      const references: ReferenceUnion[] = [
        {
          type: ReferenceType.J,
          authors: [{ name: 'Zhang' }],
          title: 'Paper C',
          journalTitle: 'Journal',
          year: '2025',
        },
        {
          type: ReferenceType.J,
          authors: [{ name: 'Li' }],
          title: 'Paper A',
          journalTitle: 'Journal',
          year: '2025',
        },
        {
          type: ReferenceType.J,
          authors: [{ name: 'Wang' }],
          title: 'Paper B',
          journalTitle: 'Journal',
          year: '2025',
        },
      ];
      const formatter = new Formatter();
      const sorted = formatter.sortReferences(references);
      expect(sorted[0]!.authors[0]!.name).toBe('Li');
      expect(sorted[1]!.authors[0]!.name).toBe('Wang');
      expect(sorted[2]!.authors[0]!.name).toBe('Zhang');
    });

    it('应该在相同作者内按年份排序引用', () => {
      const references: ReferenceUnion[] = [
        {
          type: ReferenceType.J,
          authors: [{ name: '张三' }],
          title: '论文2025',
          journalTitle: '期刊',
          year: '2025',
        },
        {
          type: ReferenceType.J,
          authors: [{ name: '张三' }],
          title: '论文2023',
          journalTitle: '期刊',
          year: '2023',
        },
        {
          type: ReferenceType.J,
          authors: [{ name: '张三' }],
          title: '论文2024',
          journalTitle: '期刊',
          year: '2024',
        },
      ];
      const formatter = new Formatter();
      const sorted = formatter.sortReferences(references);
      expect(sorted[0]!.year).toBe('2023');
      expect(sorted[1]!.year).toBe('2024');
      expect(sorted[2]!.year).toBe('2025');
    });
  });

  describe('alternative year format', () => {
    it('应该使用替代年份格式化年份', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '张三' }],
        title: '图书标题',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '1947',
        alternativeYear: '民国三十六年',
      };
      const result = format(reference);
      expect(result).toContain('1947（民国三十六年）');
    });
  });

  describe('serial continuation', () => {
    it('应该格式化带有续篇部分的连续出版物', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        serialTitle: '期刊名',
        startYear: '2011',
        startVolume: '33',
        startIssue: '2',
        continuationParts: ['2011, 33 (3): 26-30'],
        authors: [],
        title: '期刊名',
      };
      const result = format(reference);
      expect(result).toContain('2011, 33(2)—; 2011, 33 (3): 26-30');
    });
  });

  describe('optional type indicator', () => {
    it('当 includeTypeIndicator 为 false 时应该格式化没有类型标识的标准', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        standardNumber: 'GB/T 7714-2025',
        standardName: '信息与文献 参考文献著录规则',
        includeTypeIndicator: false,
        authors: [],
        title: '信息与文献 参考文献著录规则',
      };
      const result = format(reference);
      expect(result).not.toContain('[S]');
    });
  });
});
