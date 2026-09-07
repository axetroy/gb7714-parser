import type {
  ReferenceUnion,
  ValidationReport,
  ValidationError,
  StandardVersion,
} from '../types/index.js';
import { ReferenceType } from '../types/index.js';

/**
 * 校验器选项
 */
export interface ValidatorOptions {
  /** 标准版本 */
  version?: StandardVersion;
  /** 严格模式 */
  strict?: boolean;
}

/**
 * 校验器
 * 验证解析结果是否符合 GB/T 7714 规范
 */
export class Validator {
  private options: ValidatorOptions;

  constructor(options?: ValidatorOptions) {
    this.options = {
      version: '2025',
      strict: false,
      ...options,
    };
  }

  /**
   * 校验文献对象
   */
  validate(reference: ReferenceUnion): ValidationReport {
    const errors: ValidationError[] = [];

    // 通用校验
    this.validateRequiredFields(reference, errors);
    this.validateDateFormat(reference, errors);
    this.validateAuthorFormat(reference, errors);

    // 根据文献类型进行特定校验
    this.validateByType(reference, errors);

    return {
      valid: errors.filter(e => e.level === 'error').length === 0,
      errors,
    };
  }

  /**
   * 校验必填字段
   */
  private validateRequiredFields(reference: ReferenceUnion, errors: ValidationError[]): void {
    if (!reference.title) {
      errors.push({
        field: 'title',
        message: '题名为必填字段',
        level: 'error',
      });
    }

    // 某些文献类型需要作者
    const needsAuthor: ReferenceType[] = [
      ReferenceType.J,
      ReferenceType.M,
      ReferenceType.D,
      ReferenceType.C,
      ReferenceType.R,
      ReferenceType.P,
      ReferenceType.A,
      ReferenceType.CM,
      ReferenceType.DS,
      ReferenceType.PP,
    ];
    if (needsAuthor.includes(reference.type as ReferenceType) && reference.authors.length === 0) {
      errors.push({
        field: 'authors',
        message: `${this.getTypeName(reference.type)}需要至少一位作者`,
        level: 'error',
      });
    }
  }

  /**
   * 校验日期格式
   */
  private validateDateFormat(reference: ReferenceUnion, errors: ValidationError[]): void {
    if (reference.year && !/^\d{4}$/.test(reference.year)) {
      errors.push({
        field: 'year',
        message: '出版年格式应为 YYYY',
        level: 'error',
      });
    }

    // 校验引用日期格式
    if (reference.accessDate && !/^\d{4}-\d{2}-\d{2}$/.test(reference.accessDate)) {
      errors.push({
        field: 'accessDate',
        message: '引用日期格式应为 YYYY-MM-DD',
        level: 'error',
      });
    }
  }

  /**
   * 校验作者格式
   */
  private validateAuthorFormat(reference: ReferenceUnion, errors: ValidationError[]): void {
    if (reference.authors.length > 3 && !this.options.strict) {
      errors.push({
        field: 'authors',
        message: '作者超过3人时，建议只著录前3人并加"等"',
        level: 'warning',
      });
    }
  }

  /**
   * 根据文献类型进行特定校验
   */
  private validateByType(reference: ReferenceUnion, errors: ValidationError[]): void {
    switch (reference.type) {
      case 'J':
        this.validateJournal(reference, errors);
        break;
      case 'M':
        this.validateBook(reference, errors);
        break;
      case 'D':
        this.validateThesis(reference, errors);
        break;
      case 'S':
        this.validateStandard(reference, errors);
        break;
      case 'EB':
        this.validateWebPage(reference, errors);
        break;
      case 'A':
        this.validateArchive(reference, errors);
        break;
      case 'CM':
        this.validateMap(reference, errors);
        break;
      case 'DS':
        this.validateDataset(reference, errors);
        break;
      case 'PP':
        this.validatePreprint(reference, errors);
        break;
    }
  }

  /**
   * 校验期刊
   */
  private validateJournal(ref: ReferenceUnion, errors: ValidationError[]): void {
    const journal = ref as { journalTitle?: string; volume?: string; issue?: string; pages?: string };

    if (!journal.journalTitle) {
      errors.push({
        field: 'journalTitle',
        message: '刊名为必填字段',
        level: 'error',
      });
    }

    if (!journal.volume && !journal.issue) {
      errors.push({
        field: 'volume/issue',
        message: '期刊应包含卷号或期号',
        level: 'warning',
      });
    }
  }

  /**
   * 校验图书
   */
  private validateBook(ref: ReferenceUnion, errors: ValidationError[]): void {
    const book = ref as { publisherPlace?: string; publisher?: string };

    if (!book.publisherPlace) {
      errors.push({
        field: 'publisherPlace',
        message: '出版地为必填字段',
        level: 'warning',
      });
    }

    if (!book.publisher) {
      errors.push({
        field: 'publisher',
        message: '出版者为必填字段',
        level: 'warning',
      });
    }
  }

  /**
   * 校验学位论文
   */
  private validateThesis(ref: ReferenceUnion, errors: ValidationError[]): void {
    const thesis = ref as { awardInstitution?: string };

    if (!thesis.awardInstitution) {
      errors.push({
        field: 'awardInstitution',
        message: '学位授予单位为必填字段',
        level: 'error',
      });
    }
  }

  /**
   * 校验标准
   */
  private validateStandard(ref: ReferenceUnion, errors: ValidationError[]): void {
    const standard = ref as { standardNumber?: string; standardName?: string };

    if (!standard.standardNumber) {
      errors.push({
        field: 'standardNumber',
        message: '标准编号为必填字段',
        level: 'error',
      });
    }

    if (!standard.standardName) {
      errors.push({
        field: 'standardName',
        message: '标准名称为必填字段',
        level: 'error',
      });
    }
  }

  /**
   * 校验网站/网页
   */
  private validateWebPage(ref: ReferenceUnion, errors: ValidationError[]): void {
    const webPage = ref as { accessDate?: string; url?: string };

    if (!webPage.accessDate) {
      errors.push({
        field: 'accessDate',
        message: '引用日期为必填字段',
        level: 'error',
      });
    }

    if (!webPage.url) {
      errors.push({
        field: 'url',
        message: '获取和访问路径为必填字段',
        level: 'error',
      });
    }
  }

  /**
   * 校验档案
   */
  private validateArchive(_ref: ReferenceUnion, _errors: ValidationError[]): void {
    // 档案的校验规则相对宽松
  }

  /**
   * 校验地图
   */
  private validateMap(_ref: ReferenceUnion, _errors: ValidationError[]): void {
    // 地图的校验规则相对宽松
  }

  /**
   * 校验数据集
   */
  private validateDataset(ref: ReferenceUnion, errors: ValidationError[]): void {
    const dataset = ref as { accessDate?: string };

    if (!dataset.accessDate) {
      errors.push({
        field: 'accessDate',
        message: '引用日期为必填字段',
        level: 'error',
      });
    }
  }

  /**
   * 校验预印本
   */
  private validatePreprint(ref: ReferenceUnion, errors: ValidationError[]): void {
    const preprint = ref as { accessDate?: string; url?: string };

    if (!preprint.accessDate) {
      errors.push({
        field: 'accessDate',
        message: '引用日期为必填字段',
        level: 'error',
      });
    }

    if (!preprint.url) {
      errors.push({
        field: 'url',
        message: '获取和访问路径为必填字段',
        level: 'error',
      });
    }
  }

  /**
   * 获取文献类型名称
   */
  private getTypeName(type: ReferenceType): string {
    const typeNames: Record<string, string> = {
      J: '期刊',
      M: '图书',
      D: '学位论文',
      C: '会议录',
      R: '报告',
      S: '标准',
      P: '专利',
      EB: '网站/网页',
      A: '档案',
      CM: '地图',
      DS: '数据集',
      PP: '预印本',
      N: '报纸',
      G: '汇编',
      CP: '计算机程序',
      DB: '数据库',
      Z: '其他',
    };
    return typeNames[type] || type;
  }
}

/**
 * 便捷函数：校验文献对象
 */
export function validate(
  reference: ReferenceUnion,
  options?: ValidatorOptions
): ValidationReport {
  const validator = new Validator(options);
  return validator.validate(reference);
}
