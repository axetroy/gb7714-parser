import { describe, it, expect } from 'vitest';
import { Formatter, format } from '../formatter/index.js';
import type { ReferenceUnion } from '../types/index.js';
import { ReferenceType, MediaType } from '../types/index.js';

describe('Formatter', () => {
  describe('format', () => {
    it('should format a journal reference', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }, { surname: '李四' }],
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

    it('should format a book reference', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
        title: '机器学习导论',
        publisherPlace: '北京',
        publisher: '清华大学出版社',
        year: '2024',
        pages: '156',
      };
      const result = format(reference);
      expect(result).toBe('李四 机器学习导论[M]. 北京: 清华大学出版社, 2024: 156.');
    });

    it('should format a thesis reference', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ surname: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
        pages: '89',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京: 北京大学, 2025: 89.');
    });

    it('should format a webPage reference', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ surname: '张三' }],
        title: '网站标题',
        createDate: '2025-01-01',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 网站标题[EB/OL]. (2025-01-01) [2025-09-07]. https://example.com.');
    });

    it('should format with id when present', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        id: '1',
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('[1] 张三 论文标题[J]. 期刊名, 2025.');
    });

    it('should format authors with givenName', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: 'Smith', givenName: 'John' }],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('Smith John Paper Title[J]. Journal Name, 2025.');
    });

    it('should format more than 3 authors with et al.', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { surname: '张三' },
          { surname: '李四' },
          { surname: '王五' },
          { surname: '赵六' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('张三, 李四, 王五, et al. 论文标题[J]. 期刊名, 2025.');
    });

    it('should format organization as author', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '中国科学院', isOrganization: true }],
        title: '研究报告',
        journalTitle: '科学通报',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('中国科学院 研究报告[J]. 科学通报, 2025.');
    });

    it('should format journal without volume/issue', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025.');
    });

    it('should format book without pages', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M]. 北京: 出版社, 2025.');
    });

    it('should format book with version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
        title: '书名',
        version: '第3版',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M]. 第3版. 北京: 出版社, 2025.');
    });
  });

  describe('version-specific formatting', () => {
    it('should use DOI for 2015 version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const formatter = new Formatter({ version: '2015' });
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. DOI:10.1234/test');
    });

    it('should use PID for 2025 version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
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
    it('should format proceedings with conference info', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ surname: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
        pages: '100-110',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C]. //国际人工智能大会, 2025: 100-110.');
    });

    it('should format proceedings without conferenceYear', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ surname: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C].');
    });

    it('should format standard with standardNumber', () => {
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

    it('should format patent with patentNumber', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ surname: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. 2025-09-07.');
    });

    it('should format report', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ surname: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告: TR-2025-001[R]. 2025-09-07.');
    });

    it('should format archive', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ surname: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
        collectionPlace: '北京',
        collector: '档案馆',
        formedDate: '1887',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A]. 北京: 档案馆, 1887.');
    });

    it('should format archive without collectionPlace', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ surname: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A].');
    });

    it('should format map', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ surname: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        dimensions: '128 cm × 84 cm',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题. 1:25000[CM].');
    });

    it('should format dataset with platform', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        platform: '国家数据中心',
        releaseDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. 国家数据中心 (2025-09-07) [2025-10-01].');
    });

    it('should format dataset without platform', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL].');
    });

    it('should format preprint with platform', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        platform: 'arXiv',
        createDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. arXiv (2025-09-07) [2025-10-01].');
    });

    it('should format preprint without platform', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL].');
    });

    it('should format webPage without createDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ surname: '张三' }],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 网页标题[EB/OL]. [2025-09-07]. https://example.com.');
    });

    it('should format webPage without authors', () => {
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

    it('should format report without releaseDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ surname: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告: TR-2025-001[R].');
    });

    it('should format patent without announceDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ surname: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P].');
    });

    it('should format thesis without awardPlace', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ surname: '王五' }],
        title: '深度学习研究',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京大学, 2025.');
    });

    it('should format thesis without awardInstitution', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ surname: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D].');
    });

    it('should format component part', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '张三' }],
        title: '析出文献标题',
        host: {
          authors: [{ surname: '李四' }],
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

    it('should format book with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
        year: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M]. 北京: 出版社, 2025. https://example.com');
    });

    it('should format map with publisher info', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ surname: '张三' }],
        title: '地图标题',
        scale: '1:25000',
        publisherPlace: '北京',
        publisher: '地图出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题. 1:25000[CM]. 北京: 地图出版社, 2025.');
    });

    it('should format map with version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ surname: '张三' }],
        title: '地图标题',
        version: '第2版',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题[CM]. 第2版.');
    });

    it('should format dataset with version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        version: 'v2.0',
        platform: '国家数据中心',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. v2.0. 国家数据中心 [2025-10-01].');
    });

    it('should format preprint with version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        version: 'v1.0',
        platform: 'arXiv',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. v1.0. arXiv [2025-10-01].');
    });

    it('should format proceedings with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ surname: '张三' }],
        title: '会议论文集',
        conferenceName: '国际人工智能大会',
        conferenceYear: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C]. //国际人工智能大会, 2025. https://example.com');
    });

    it('should format patent with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ surname: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. https://example.com');
    });

    it('should format report with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ surname: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告: TR-2025-001[R]. https://example.com');
    });

    it('should format archive with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ surname: '张三' }],
        title: '档案标题',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题[A]. https://example.com');
    });

    it('should format map with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ surname: '张三' }],
        title: '地图标题',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 地图标题[CM]. https://example.com');
    });

    it('should format journal with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. https://example.com');
    });

    it('should format map with id', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        id: '42',
        authors: [{ surname: '张三' }],
        title: '地图标题',
      };
      const result = format(reference);
      expect(result).toBe('[42] 张三 地图标题[CM].');
    });

    it('should format dataset with id', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        id: '43',
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('[43] 张三 数据集标题[DS/OL].');
    });

    it('should format dataset with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        accessDate: '2025-10-01',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. https://example.com');
    });

    it('should format preprint with id', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        id: '44',
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('[44] 张三 预印本标题[PP/OL].');
    });

    it('should format preprint with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
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
    it('should handle empty authors array for standard', () => {
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

    it('should handle reference without year', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '出版社',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M].');
    });

    it('should handle reference without publisherPlace', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
        title: '书名',
        publisher: '出版社',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M].');
    });

    it('should handle reference without publisher', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
        title: '书名',
        publisherPlace: '北京',
        year: '2025',
      };
      const result = format(reference);
      expect(result).toBe('李四 书名[M].');
    });

    it('should handle generic type', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ surname: '张三' }],
        title: '通用标题',
        year: '2025',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. 2025.');
    });

    it('should handle generic type with publisher info', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ surname: '张三' }],
        title: '通用标题',
        year: '2025',
        publisherPlace: '北京',
        publisher: '出版社',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. 2025. 北京: 出版社.');
    });

    it('should handle generic type with url', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ surname: '张三' }],
        title: '通用标题',
        url: 'https://example.com',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. https://example.com');
    });

    it('should handle generic type without year', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ surname: '张三' }],
        title: '通用标题',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X].');
    });

    it('should handle generic type with id', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        id: '42',
        authors: [{ surname: '张三' }],
        title: '通用标题',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('[42] 张三 通用标题[X].');
    });

    it('should handle generic type without authors', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [],
        title: '通用标题',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('通用标题[X].');
    });

    it('should handle generic type without publisherPlace and publisher', () => {
      const reference = {
        type: 'X' as ReferenceUnion['type'],
        authors: [{ surname: '张三' }],
        title: '通用标题',
        year: '2025',
      } as ReferenceUnion;
      const result = format(reference);
      expect(result).toBe('张三 通用标题[X]. 2025.');
    });
  });

  describe('version-specific formatting', () => {
    it('should use DOI for book in 2015 version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
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

    it('should use PID for book in 2025 version', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '李四' }],
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
    it('should format standard with url', () => {
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

    it('should format standard with id', () => {
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

    it('should format patent with pages', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ surname: '张三' }],
        title: '发明名称',
        patentNumber: 'CN2025001',
        announceDate: '2025-09-07',
        pages: '10',
      };
      const result = format(reference);
      expect(result).toBe('张三 发明名称: CN2025001[P]. 2025-09-07: 10.');
    });

    it('should format report with pages', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ surname: '张三' }],
        title: '技术报告',
        reportNumber: 'TR-2025-001',
        releaseDate: '2025-09-07',
        pages: '50',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告: TR-2025-001[R]. 2025-09-07: 50.');
    });

    it('should format report without reportNumber', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ surname: '张三' }],
        title: '技术报告',
        releaseDate: '2025-09-07',
      };
      const result = format(reference);
      expect(result).toBe('张三 技术报告[R]. 2025-09-07.');
    });

    it('should format map with dimensions', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ surname: '张三' }],
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

    it('should format archive with archiveNumber', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ surname: '张三' }],
        title: '档案标题',
        archiveNumber: 'ABC123',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题: ABC123[A].');
    });

    it('should format archive without archiveNumber', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ surname: '张三' }],
        title: '档案标题',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题[A].');
    });

    it('should format proceedings without conferenceName', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ surname: '张三' }],
        title: '会议论文集',
      };
      const result = format(reference);
      expect(result).toBe('张三 会议论文集[C].');
    });

    it('should format thesis without pages', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ surname: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京: 北京大学, 2025.');
    });

    it('should format book with id', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        id: '50',
        authors: [{ surname: '李四' }],
        title: '书名',
      };
      const result = format(reference);
      expect(result).toBe('[50] 李四 书名[M].');
    });

    it('should format journal with pid', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const result = format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. PID:10.1234/test');
    });

    it('should format thesis with url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ surname: '王五' }],
        title: '深度学习研究',
        awardPlace: '北京',
        awardInstitution: '北京大学',
        awardYear: '2025',
        url: 'https://example.com',
      };
      const result = format(reference);
      expect(result).toBe('王五 深度学习研究[D]. 北京: 北京大学, 2025. https://example.com');
    });

    it('should format webPage with authors', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ surname: '张三' }],
        title: '网页标题',
        createDate: '2025-01-01',
        accessDate: '2025-09-07',
        url: 'https://example.com',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 网页标题[EB/OL]. (2025-01-01) [2025-09-07]. https://example.com.');
    });

    it('should format dataset with releaseDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        platform: '国家数据中心',
        releaseDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 数据集标题[DS/OL]. 国家数据中心 (2025-09-07) [2025-10-01].');
    });

    it('should format preprint with createDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        platform: 'arXiv',
        createDate: '2025-09-07',
        accessDate: '2025-10-01',
        mediaType: MediaType.OL,
      };
      const result = format(reference);
      expect(result).toBe('张三 预印本标题[PP/OL]. arXiv (2025-09-07) [2025-10-01].');
    });

    it('should format archive with collectionPlace', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ surname: '张三' }],
        title: '档案标题',
        collectionPlace: '北京',
        collector: '档案馆',
        formedDate: '1887',
      };
      const result = format(reference);
      expect(result).toBe('张三 档案标题[A]. 北京: 档案馆, 1887.');
    });
  });

  describe('Formatter class', () => {
    it('should create Formatter with default options', () => {
      const formatter = new Formatter();
      expect(formatter).toBeDefined();
    });

    it('should create Formatter with 2015 version', () => {
      const formatter = new Formatter({ version: '2015' });
      expect(formatter).toBeDefined();
    });

    it('should format reference using format method', () => {
      const formatter = new Formatter();
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025.');
    });
  });
});
