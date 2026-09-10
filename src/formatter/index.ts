import type { ReferenceUnion, FormatOptions } from '../types/index.js';
import { BookFormatter } from './types/8.2-m-book-formatter.js';
import { ComponentPartFormatter } from './types/8.3-m-component-part-formatter.js';
import { SerialFormatter } from './types/8.4-j-serial-formatter.js';
import { JournalFormatter } from './types/8.5-j-journal-formatter.js';
import { NewspaperFormatter } from './types/8.5-n-newspaper-formatter.js';
import { ProceedingsFormatter } from './types/8.6-c-proceedings-formatter.js';
import { ThesisFormatter } from './types/8.7-d-thesis-formatter.js';
import { ReportFormatter } from './types/8.8-r-report-formatter.js';
import { StandardFormatter } from './types/8.9-s-standard-formatter.js';
import { PatentFormatter } from './types/8.10-p-patent-formatter.js';
import { WebPageFormatter } from './types/8.11-eb-web-page-formatter.js';
import { ArchiveFormatter } from './types/8.12-a-archive-formatter.js';
import { MapFormatter } from './types/8.13-cm-map-formatter.js';
import { DatasetFormatter } from './types/8.14-ds-dataset-formatter.js';
import { PreprintFormatter } from './types/8.15-pp-preprint-formatter.js';
import { GenericFormatter } from './types/generic-formatter.js';

/**
 * 语种分类
 */
type LanguageGroup = 'zh' | 'ja' | 'western' | 'ru' | 'other';

/**
 * 格式化器
 * 将结构化对象反向生成为符合 GB/T 7714 的字符串
 *
 * 职责：
 * - 按文献类型分发到对应的类型格式化器（文件名与标准章节号对应）
 * - 正文引用标注（§9.2 顺序编码制 / §9.3 著者-出版年制）
 * - 文献列表排序（§9.3.2）
 */
export class Formatter {
  private options: FormatOptions;
  private bookFormatter: BookFormatter;
  private componentPartFormatter: ComponentPartFormatter;
  private serialFormatter: SerialFormatter;
  private journalFormatter: JournalFormatter;
  private newspaperFormatter: NewspaperFormatter;
  private proceedingsFormatter: ProceedingsFormatter;
  private thesisFormatter: ThesisFormatter;
  private reportFormatter: ReportFormatter;
  private standardFormatter: StandardFormatter;
  private patentFormatter: PatentFormatter;
  private webPageFormatter: WebPageFormatter;
  private archiveFormatter: ArchiveFormatter;
  private mapFormatter: MapFormatter;
  private datasetFormatter: DatasetFormatter;
  private preprintFormatter: PreprintFormatter;
  private genericFormatter: GenericFormatter;

  constructor(options?: FormatOptions) {
    this.options = {
      version: '2025',
      locale: 'zh',
      ...options,
    };
    this.bookFormatter = new BookFormatter(this.options);
    this.componentPartFormatter = new ComponentPartFormatter(this.options);
    this.serialFormatter = new SerialFormatter(this.options);
    this.journalFormatter = new JournalFormatter(this.options);
    this.newspaperFormatter = new NewspaperFormatter(this.options);
    this.proceedingsFormatter = new ProceedingsFormatter(this.options);
    this.thesisFormatter = new ThesisFormatter(this.options);
    this.reportFormatter = new ReportFormatter(this.options);
    this.standardFormatter = new StandardFormatter(this.options);
    this.patentFormatter = new PatentFormatter(this.options);
    this.webPageFormatter = new WebPageFormatter(this.options);
    this.archiveFormatter = new ArchiveFormatter(this.options);
    this.mapFormatter = new MapFormatter(this.options);
    this.datasetFormatter = new DatasetFormatter(this.options);
    this.preprintFormatter = new PreprintFormatter(this.options);
    this.genericFormatter = new GenericFormatter(this.options);
  }

  /**
   * 格式化文献对象为字符串
   */
  format(reference: ReferenceUnion): string {
    switch (reference.type) {
      case 'J':
        // 检查是否是连续出版物（有 serialTitle 字段）
        if ('serialTitle' in reference && reference.serialTitle) {
          return this.serialFormatter.format(reference);
        }
        return this.journalFormatter.format(reference);
      case 'N':
        return this.newspaperFormatter.format(reference);
      case 'M':
        return this.bookFormatter.format(reference);
      case 'D':
        return this.thesisFormatter.format(reference);
      case 'C':
        return this.proceedingsFormatter.format(reference);
      case 'R':
        return this.reportFormatter.format(reference);
      case 'S':
        return this.standardFormatter.format(reference);
      case 'P':
        return this.patentFormatter.format(reference);
      case 'EB':
        return this.webPageFormatter.format(reference);
      case 'A':
        return this.archiveFormatter.format(reference);
      case 'CM':
        return this.mapFormatter.format(reference);
      case 'DS':
        return this.datasetFormatter.format(reference);
      case 'PP':
        return this.preprintFormatter.format(reference);
      case 'Z':
        // 检查是否是析出文献（有 host 字段）
        if ('host' in reference && reference.host) {
          return this.componentPartFormatter.format(reference);
        }
        return this.genericFormatter.format(reference);
      default:
        return this.genericFormatter.format(reference);
    }
  }

  /**
   * 格式化正文引用标注
   * - 顺序编码制: [序号]
   * - 著者-出版年制: (作者, 年) 或 (作者 et al., 年)
   * - 脚注式: 上标数字 ¹ 或 ①②③...
   *
   * §9.3.1.2: 多责任者文献，欧美责任者只标第一个姓 + "et al."；中国责任者标第一责任者姓名 + "等"
   * §9.2.1.1: 脚注方式的引用标注，使用上标数字或圈码数字
   */
  formatCitation(reference: ReferenceUnion): string {
    if (this.options.citationStyle === 'author-date') {
      return this.formatAuthorDateCitation(reference);
    }
    if (this.options.citationStyle === 'footnote') {
      return this.formatFootnoteCitation(reference);
    }
    // 顺序编码制
    return reference.id ? `[${reference.id}]` : '';
  }

  /**
   * 格式化脚注式引用标注
   * 标准 §9.2.1.1: 使用上标数字或圈码数字
   */
  private formatFootnoteCitation(ref: ReferenceUnion): string {
    if (!ref.id) return '';

    // 使用圈码数字：①②③④⑤⑥⑦⑧⑨⑩...
    const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
      '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
    const id = parseInt(ref.id, 10);
    if (id >= 1 && id <= circledNumbers.length) {
      return circledNumbers[id - 1]!;
    }
    // 超过20使用上标数字格式
    return `${ref.id}`;
  }

  /**
   * 格式化著者-出版年制引用标注
   * 格式: (作者, 年) 或 (作者 et al., 年)
   */
  private formatAuthorDateCitation(ref: ReferenceUnion): string {
    const year = this.getYear(ref);
    if (!year) return '';

    const authors = ref.authors;
    if (authors.length === 0) {
      return `(${year})`;
    }

    // §9.3.1.2: 多责任者 → 第一个姓 + "等"/"et al."
    let authorStr: string;
    if (authors.length > 1) {
      const first = authors[0]!;
      const suffix = this.options.locale === 'en' ? 'et al.' : '等';
      authorStr = `${first.name}, ${suffix}`;
    } else {
      authorStr = authors[0]!.name;
    }

    return `(${authorStr}, ${year})`;
  }

  /**
   * 获取文献的年份
   */
  private getYear(ref: ReferenceUnion): string {
    // 各类型有不同的年份字段名
    const r = ref as unknown as Record<string, unknown>;
    for (const key of ['year', 'awardYear', 'conferenceYear', 'releaseDate', 'formedDate']) {
      const val = r[key];
      if (typeof val === 'string' && val) {
        // 提取 YYYY 部分
        const match = val.match(/^(\d{4})/);
        if (match) return match[1]!;
      }
    }
    return '';
  }

  /**
   * 判断文献的语种
   * 标准 §9.3.2：各篇文献应首先按文种集中
   */
  private getLanguageGroup(ref: ReferenceUnion): LanguageGroup {
    // 获取作者和题名
    const authors = ref.authors || [];
    const title = ref.title || '';
    // 检查作者姓名
    for (const author of authors) {
      const name = author.name || '';
      // 中文字符范围
      if (/[\u4e00-\u9fa5]/.test(name)) return 'zh';
      // 日文字符范围（平假名、片假名）
      if (/[\u3040-\u309f\u30a0-\u30ff]/.test(name)) return 'ja';
      // 俄文字符范围
      if (/[\u0400-\u04ff]/.test(name)) return 'ru';
    }
    // 检查题名
    if (/[\u4e00-\u9fa5]/.test(title)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(title)) return 'ja';
    if (/[\u0400-\u04ff]/.test(title)) return 'ru';
    // 默认为西文
    return 'western';
  }

  /**
   * 获取语种排序权重
   */
  private getLanguageWeight(group: LanguageGroup): number {
    const weights: Record<LanguageGroup, number> = {
      zh: 0,
      ja: 1,
      western: 2,
      ru: 3,
      other: 4,
    };
    return weights[group] ?? 4;
  }

  /**
   * 获取责任者姓名（用于排序）
   */
  private getAuthorSortKey(ref: ReferenceUnion): string {
    const authors = ref.authors || [];
    if (authors.length === 0) return '';
    const firstAuthor = authors[0]!;
    // 对于中文作者，使用拼音排序（这里简化为使用原姓名）
    // 对于西文作者，使用姓氏排序
    return firstAuthor.name || '';
  }

  /**
   * 排序文献列表（著者-出版年制）
   * 标准 §9.3.2：各篇文献应首先按文种集中，然后按责任者字顺和出版年排列
   */
  sortReferences(references: ReferenceUnion[]): ReferenceUnion[] {
    return [...references].sort((a, b) => {
      // 1. 按语种分组
      const langA = this.getLanguageGroup(a);
      const langB = this.getLanguageGroup(b);
      const langWeightA = this.getLanguageWeight(langA);
      const langWeightB = this.getLanguageWeight(langB);
      if (langWeightA !== langWeightB) {
        return langWeightA - langWeightB;
      }
      // 2. 按责任者字顺排列
      const authorA = this.getAuthorSortKey(a);
      const authorB = this.getAuthorSortKey(b);
      const authorCompare = authorA.localeCompare(authorB, 'zh');
      if (authorCompare !== 0) {
        return authorCompare;
      }
      // 3. 按出版年排列
      const yearA = this.getYear(a);
      const yearB = this.getYear(b);
      return yearA.localeCompare(yearB);
    });
  }
}

/**
 * 便捷函数：格式化文献对象
 */
export function format(reference: ReferenceUnion, options?: FormatOptions): string {
  const formatter = new Formatter(options);
  return formatter.format(reference);
}

/**
 * 便捷函数：格式化正文引用标注
 */
export function formatCitation(reference: ReferenceUnion, options?: FormatOptions): string {
  const formatter = new Formatter(options);
  return formatter.formatCitation(reference);
}
