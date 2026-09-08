import { describe, it, expect } from 'vitest';
import { Validator, validate } from '../validator/index.js';
import type { ReferenceUnion } from '../types/index.js';
import { ReferenceType } from '../types/index.js';

describe('Validator', () => {
  describe('validate', () => {
    it('should validate a correct journal reference', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(true);
    });

    it('should report error for missing title', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should report error for missing authors when required', () => {
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

    it('should validate year format', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '25',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.field === 'year')).toBe(true);
    });

    it('should validate access date format', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ surname: '张三' }],
        title: '网站标题',
        accessDate: '2025/09/07',
        url: 'https://example.com',
      };
      const report = validate(reference);
      expect(report.valid).toBe(false);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('should warn when authors exceed 3', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { surname: '张三' },
          { surname: '李四' },
          { surname: '王五' },
          { surname: '赵六' },
        ],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.valid).toBe(true);
      expect(report.errors.some(e => e.field === 'authors' && e.level === 'warning')).toBe(true);
    });

    it('should not warn when authors exceed 3 in strict mode', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [
          { surname: '张三' },
          { surname: '李四' },
          { surname: '王五' },
          { surname: '赵六' },
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
    it('should warn about unsupported types in 2015', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [{ surname: '张三' }],
        title: '档案标题',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should warn about CM type in 2015', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ surname: '张三' }],
        title: '地图标题',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should warn about DS type in 2015', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should warn about PP type in 2015', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should suggest PID instead of DOI for 2015', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const validator = new Validator({ version: '2015' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'pid')).toBe(true);
    });

    it('should warn about missing mediaType for electronic resources in 2025', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ surname: '张三' }],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: 'https://example.com',
      };
      const validator = new Validator({ version: '2025' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'mediaType')).toBe(true);
    });

    it('should warn about missing mediaType for DS in 2025', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2025' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'mediaType')).toBe(true);
    });

    it('should warn about missing mediaType for PP in 2025', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        accessDate: '2025-09-07',
      };
      const validator = new Validator({ version: '2025' });
      const report = validator.validate(reference);
      expect(report.errors.some(e => e.field === 'mediaType')).toBe(true);
    });
  });

  describe('type-specific validation', () => {
    it('should validate journal requires journalTitle', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'journalTitle')).toBe(true);
    });

    it('should validate journal warns when no volume or issue', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.J,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'volume/issue')).toBe(true);
    });

    it('should validate book requires publisherPlace', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '张三' }],
        title: '书名',
        publisherPlace: '',
        publisher: '出版社',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'publisherPlace')).toBe(true);
    });

    it('should validate book requires publisher', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.M,
        authors: [{ surname: '张三' }],
        title: '书名',
        publisherPlace: '北京',
        publisher: '',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'publisher')).toBe(true);
    });

    it('should validate thesis requires awardInstitution', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.D,
        authors: [{ surname: '张三' }],
        title: '论文标题',
        awardInstitution: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'awardInstitution')).toBe(true);
    });

    it('should validate standard requires standardNumber', () => {
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

    it('should validate standard requires standardName', () => {
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

    it('should validate patent requires patentNumber', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ surname: '张三' }],
        title: '专利标题',
        patentNumber: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'patentNumber')).toBe(true);
    });

    it('should validate webPage requires accessDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ surname: '张三' }],
        title: '网页标题',
        accessDate: '',
        url: 'https://example.com',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('should validate webPage requires url', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.EB,
        authors: [{ surname: '张三' }],
        title: '网页标题',
        accessDate: '2025-09-07',
        url: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('should validate archive requires title', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.A,
        authors: [],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should validate map requires title', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.CM,
        authors: [{ surname: '张三' }],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should validate dataset requires accessDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.DS,
        authors: [{ surname: '张三' }],
        title: '数据集标题',
        accessDate: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('should validate preprint requires accessDate', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.PP,
        authors: [{ surname: '张三' }],
        title: '预印本标题',
        accessDate: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'accessDate')).toBe(true);
    });

    it('should validate report requires title', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.R,
        authors: [{ surname: '张三' }],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should validate proceedings requires title', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.C,
        authors: [{ surname: '张三' }],
        title: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should validate newspaper requires newspaperTitle', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.N,
        authors: [{ surname: '张三' }],
        title: '新闻标题',
        newspaperTitle: '',
        year: '2025',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'newspaperTitle')).toBe(true);
    });

    it('should validate newspaper requires year', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.N,
        authors: [{ surname: '张三' }],
        title: '新闻标题',
        newspaperTitle: '人民日报',
        year: '',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'year')).toBe(true);
    });

    it('should validate standard number format', () => {
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

    it('should accept valid standard number format', () => {
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

    it('should validate patent number format', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ surname: '张三' }],
        title: '专利标题',
        patentNumber: '12345',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'patentNumber' && e.level === 'warning')).toBe(true);
    });

    it('should accept valid patent number format', () => {
      const reference: ReferenceUnion = {
        type: ReferenceType.P,
        authors: [{ surname: '张三' }],
        title: '专利标题',
        patentNumber: 'CN202310123456.7',
      };
      const report = validate(reference);
      expect(report.errors.some(e => e.field === 'patentNumber')).toBe(false);
    });
  });
});
