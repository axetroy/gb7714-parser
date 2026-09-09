import { describe, it, expect } from 'vitest';
import { Validator, validate } from '../validator/index.js';
import type { ReferenceUnion } from '../types/index.js';
import { ReferenceType, ValidationErrorCode } from '../types/index.js';

describe('Validator', () => {
  describe('validate', () => {
    it('应该验证正确的期刊引用', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(true);
    });

    it('应该报告缺少标题的错误', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('应该在必需时报告缺少作者的错误', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.field === 'authors')).toBe(true);
    });

    it('应该验证年份格式', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '25',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.field === 'year')).toBe(true);
    });

    it('应该验证访问日期格式', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网站标题',
        accessDate: '2025/09/07',
        url: 'https://example.com',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('当作者超过 3 个时应该发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(true);
      expect(report.errors.some(e => e.field === 'authors' && e.level === 'warning')).toBe(true);
    });

    it('在严格模式下作者超过 3 个时不应该发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const validator = new Validator({ strict: true });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'authors' && e.level === 'warning')).toBe(false);
    });
  });

  describe('version-specific validation', () => {
    it('应该在 2015 版本中对不支持的类型发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ name: '张三' }],
        title: '档案标题',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('应该在 2015 版本中对 CM 类型发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '地图标题',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('应该在 2015 版本中对 DS 类型发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('应该在 2015 版本中对 PP 类型发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('应该在 2015 版本中建议使用 PID 而不是 DOI', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'pid')).toBe(true);
    });

    it('应该在 2025 版本中对电子资源缺少 mediaType 发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: 'https://example.com',
      };
      const validator = new Validator({ version: '2025' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'mediaType')).toBe(true);
    });

    it('应该在 2025 版本中对 DS 缺少 mediaType 发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2025' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'mediaType')).toBe(true);
    });

    it('应该在 2025 版本中对 PP 缺少 mediaType 发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2025' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'mediaType')).toBe(true);
    });
  });

  describe('type-specific validation', () => {
    it('应该验证期刊需要期刊名', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'journalTitle')).toBe(true);
    });

    it('应该验证期刊在没有卷号或期号时发出警告', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'volume/issue')).toBe(true);
    });

    it('应该验证图书需要出版地', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '张三' }],
        title: '书名',
        publisherPlace: '',
        publisher: '出版社',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'publisherPlace')).toBe(true);
    });

    it('应该验证图书需要出版者', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ name: '张三' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'publisher')).toBe(true);
    });

    it('应该验证学位论文需要授予机构', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ name: '张三' }],
        title: '论文标题',
        awardInstitution: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'awardInstitution')).toBe(true);
    });

    it('应该验证标准需要标准号', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        authors: [],
        title: '标准标题',
        standardNumber: '',
        standardName: '标准名称',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'standardNumber')).toBe(true);
    });

    it('应该验证标准需要标准名称', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        authors: [],
        title: '标准标题',
        standardNumber: 'GB/T 1234',
        standardName: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'standardName')).toBe(true);
    });

    it('应该验证专利需要专利号', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '专利标题',
        patentNumber: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'patentNumber')).toBe(true);
    });

    it('应该验证网页需要访问日期', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        accessDate: '',
        url: 'https://example.com',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('应该验证网页需要 URL', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('应该验证档案需要标题', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('应该验证地图需要标题', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ name: '张三' }],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('应该验证数据集需要访问日期', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ name: '张三' }],
        title: '数据集标题',
        accessDate: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('应该验证预印本需要访问日期', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ name: '张三' }],
        title: '预印本标题',
        accessDate: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('应该验证报告需要标题', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ name: '张三' }],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('应该验证会议录需要标题', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ name: '张三' }],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('应该验证报纸需要报纸名', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.N,
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'newspaperTitle')).toBe(true);
    });

    it('应该验证报纸需要年份', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.N,
        authors: [{ name: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'year')).toBe(true);
    });

    it('应该验证标准号格式', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        authors: [],
        title: '标准标题',
        standardNumber: '12345',
        standardName: '标准名称',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'standardNumber' && e.level === 'warning')).toBe(true);
    });

    it('应该接受有效的标准号格式', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.S,
        authors: [],
        title: '标准标题',
        standardNumber: 'GB/T 3792—2021',
        standardName: '标准名称',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'standardNumber')).toBe(false);
    });

    it('应该验证专利号格式', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '专利标题',
        patentNumber: '12345',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'patentNumber' && e.level === 'warning')).toBe(true);
    });

    it('应该接受有效的专利号格式', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ name: '张三' }],
        title: '专利标题',
        patentNumber: 'CN202310123456.7',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'patentNumber')).toBe(false);
    });
  });

    it('应该包含错误码', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [],
        title: '',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      const titleError = report.errors.find(e => e.field === 'title');
      expect(titleError?.code).toBe(ValidationErrorCode.MISSING_REQUIRED);
      const authorError = report.errors.find(e => e.field === 'authors');
      expect(authorError?.code).toBe(ValidationErrorCode.MISSING_REQUIRED);
    });

    it('年份格式错误应带有 INVALID_YEAR 错误码', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '现代教育技术',
        year: '25',
      };
      const report = validate(reference);
      const yearError = report.errors.find(e => e.field === 'year');
      expect(yearError?.code).toBe(ValidationErrorCode.INVALID_YEAR);
    });

    it('引用日期格式错误应带有 INVALID_DATE 错误码', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ name: '张三' }],
        title: '网页标题',
        url: 'https://example.com',
        accessDate: '2025/09/07',
      };
      const report = validate(reference);
      const dateError = report.errors.find(e => e.field === 'accessDate');
      expect(dateError?.code).toBe(ValidationErrorCode.INVALID_DATE);
    });
});
