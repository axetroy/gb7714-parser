import type {
  ReferenceUnion,
  FormatOptions,
  Author,
  ComponentPart,
} from '../types/index.js';
import { buildTypeIndicator } from '../utils/index.js';

/**
 * 格式化器
 * 将结构化对象反向生成为符合 GB/T 7714 的字符串
 */
export class Formatter {
  private options: FormatOptions;

  constructor(options?: FormatOptions) {
    this.options = {
      version: '2025',
      ...options,
    };
  }

  /**
   * 格式化文献对象为字符串
   */
  format(reference: ReferenceUnion): string {
    switch (reference.type) {
      case 'J':
        return this.formatJournal(reference);
      case 'N':
        return this.formatNewspaper(reference);
      case 'M':
        return this.formatBook(reference);
      case 'D':
        return this.formatThesis(reference);
      case 'C':
        return this.formatProceedings(reference);
      case 'R':
        return this.formatReport(reference);
      case 'S':
        return this.formatStandard(reference);
      case 'P':
        return this.formatPatent(reference);
      case 'EB':
        return this.formatWebPage(reference);
      case 'A':
        return this.formatArchive(reference);
      case 'CM':
        return this.formatMap(reference);
      case 'DS':
        return this.formatDataset(reference);
      case 'PP':
        return this.formatPreprint(reference);
      case 'Z':
        // 检查是否是析出文献（有 host 字段）
        if ('host' in reference && reference.host) {
          return this.formatComponentPart(reference as ComponentPart);
        }
        return this.formatGeneric(reference);
      default:
        return this.formatGeneric(reference);
    }
  }

  /**
   * 格式化报纸
   */
  private formatNewspaper(ref: ReferenceUnion): string {
    const newspaper = ref as {
      id?: string;
      authors: Author[];
      title: string;
      newspaperTitle?: string;
      year?: string;
      monthDay?: string;
      edition?: string;
      url?: string;
      pid?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (newspaper.id) {
      parts.push(`[${newspaper.id}]`);
    }

    if (newspaper.authors.length > 0) {
      parts.push(this.formatAuthors(newspaper.authors));
    }

    parts.push(`${newspaper.title}${buildTypeIndicator('N', newspaper.mediaType)}.`);

    if (newspaper.newspaperTitle) {
      let info = newspaper.newspaperTitle;
      if (newspaper.year) {
        info += `, ${newspaper.year}`;
      }
      if (newspaper.monthDay) {
        info += `, ${newspaper.monthDay}`;
      }
      if (newspaper.edition) {
        info += `: ${newspaper.edition}`;
      }
      parts.push(info + '.');
    }

    if (newspaper.url) {
      parts.push(newspaper.url);
    }

    if (newspaper.pid) {
      if (this.options.version === '2015') {
        parts.push(`DOI:${newspaper.pid}`);
      } else {
        parts.push(`PID:${newspaper.pid}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 格式化析出文献
   */
  private formatComponentPart(ref: ReferenceUnion): string {
    const component = ref as ComponentPart;

    const parts: string[] = [];

    if (component.id) {
      parts.push(`[${component.id}]`);
    }

    if (component.authors.length > 0) {
      parts.push(this.formatAuthors(component.authors));
    }

    // 析出文献题名
    let title = component.title;
    if (component.subtitle) {
      title += `: ${component.subtitle}`;
    }
    parts.push(title + '//');

    // 出处文献
    if (component.host) {
      if (component.host.authors && component.host.authors.length > 0) {
        parts.push(this.formatAuthors(component.host.authors));
      }
      parts.push(`${component.host.title}.`);

      if (component.host.publisherPlace && component.host.publisher && component.host.year) {
        parts.push(`${component.host.publisherPlace}: ${component.host.publisher}, ${component.host.year}.`);
      } else if (component.host.year) {
        parts.push(`${component.host.year}.`);
      }
    }

    // 析出文献页码
    if (component.pages) {
      parts.push(`: ${component.pages}.`);
    }

    if (component.url) {
      parts.push(component.url);
    }

    if (component.pid) {
      if (this.options.version === '2015') {
        parts.push(`DOI:${component.pid}`);
      } else {
        parts.push(`PID:${component.pid}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 格式化期刊
   */
  private formatJournal(ref: ReferenceUnion): string {
    const journal = ref as {
      id?: string;
      authors: Author[];
      title: string;
      journalTitle: string;
      year: string;
      volume?: string;
      issue?: string;
      pages?: string;
      url?: string;
      pid?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    // 序号
    if (journal.id) {
      parts.push(`[${journal.id}]`);
    }

    // 作者
    parts.push(this.formatAuthors(journal.authors));

    // 题名
    parts.push(`${journal.title}${buildTypeIndicator('J', journal.mediaType)}.`);

    // 刊名, 年, 卷(期): 页码
    let journalInfo = journal.journalTitle;
    if (journal.year) {
      journalInfo += `, ${journal.year}`;
    }
    if (journal.volume) {
      journalInfo += `, ${journal.volume}`;
    }
    if (journal.issue) {
      journalInfo += `(${journal.issue})`;
    }
    if (journal.pages) {
      journalInfo += `: ${journal.pages}`;
    }
    parts.push(journalInfo + '.');

    // URL
    if (journal.url) {
      parts.push(journal.url);
    }

    // PID/DOI
    if (journal.pid) {
      if (this.options.version === '2015') {
        parts.push(`DOI:${journal.pid}`);
      } else {
        parts.push(`PID:${journal.pid}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 格式化图书
   */
  private formatBook(ref: ReferenceUnion): string {
    const book = ref as {
      id?: string;
      authors: Author[];
      title: string;
      version?: string;
      publisherPlace?: string;
      publisher?: string;
      year?: string;
      pages?: string;
      url?: string;
      pid?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (book.id) {
      parts.push(`[${book.id}]`);
    }

    parts.push(this.formatAuthors(book.authors));
    parts.push(`${book.title}${buildTypeIndicator('M', book.mediaType)}.`);

    if (book.version) {
      parts.push(`${book.version}.`);
    }

    if (book.publisherPlace && book.publisher && book.year) {
      parts.push(`${book.publisherPlace}: ${book.publisher}, ${book.year}`);
      if (book.pages) {
        parts[parts.length - 1] += `: ${book.pages}`;
      }
      parts[parts.length - 1] += '.';
    }

    if (book.url) {
      parts.push(book.url);
    }

    if (book.pid) {
      if (this.options.version === '2015') {
        parts.push(`DOI:${book.pid}`);
      } else {
        parts.push(`PID:${book.pid}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 格式化学位论文
   */
  private formatThesis(ref: ReferenceUnion): string {
    const thesis = ref as {
      id?: string;
      authors: Author[];
      title: string;
      awardPlace?: string;
      awardInstitution: string;
      awardYear?: string;
      pages?: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (thesis.id) {
      parts.push(`[${thesis.id}]`);
    }

    parts.push(this.formatAuthors(thesis.authors));
    parts.push(`${thesis.title}${buildTypeIndicator('D', thesis.mediaType)}.`);

    if (thesis.awardPlace && thesis.awardInstitution && thesis.awardYear) {
      let info = `${thesis.awardPlace}: ${thesis.awardInstitution}, ${thesis.awardYear}`;
      if (thesis.pages) {
        info += `: ${thesis.pages}`;
      }
      parts.push(info + '.');
    } else if (thesis.awardInstitution && thesis.awardYear) {
      let info = `${thesis.awardInstitution}, ${thesis.awardYear}`;
      if (thesis.pages) {
        info += `: ${thesis.pages}`;
      }
      parts.push(info + '.');
    }

    if (thesis.url) {
      parts.push(thesis.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化会议录
   */
  private formatProceedings(ref: ReferenceUnion): string {
    const proceedings = ref as {
      id?: string;
      authors: Author[];
      title: string;
      conferenceName?: string;
      conferenceYear?: string;
      pages?: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (proceedings.id) {
      parts.push(`[${proceedings.id}]`);
    }

    parts.push(this.formatAuthors(proceedings.authors));
    parts.push(`${proceedings.title}${buildTypeIndicator('C', proceedings.mediaType)}.`);

    if (proceedings.conferenceName && proceedings.conferenceYear) {
      let info = `//${proceedings.conferenceName}, ${proceedings.conferenceYear}`;
      if (proceedings.pages) {
        info += `: ${proceedings.pages}`;
      }
      parts.push(info + '.');
    }

    if (proceedings.url) {
      parts.push(proceedings.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化报告
   */
  private formatReport(ref: ReferenceUnion): string {
    const report = ref as {
      id?: string;
      authors: Author[];
      title: string;
      reportNumber?: string;
      releaseDate?: string;
      pages?: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (report.id) {
      parts.push(`[${report.id}]`);
    }

    parts.push(this.formatAuthors(report.authors));
    let title = report.title;
    if (report.reportNumber) {
      title += `: ${report.reportNumber}`;
    }
    parts.push(`${title}${buildTypeIndicator('R', report.mediaType)}.`);

    if (report.releaseDate) {
      let info = report.releaseDate;
      if (report.pages) {
        info += `: ${report.pages}`;
      }
      parts.push(info + '.');
    }

    if (report.url) {
      parts.push(report.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化标准
   */
  private formatStandard(ref: ReferenceUnion): string {
    const standard = ref as {
      id?: string;
      standardNumber: string;
      standardName: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (standard.id) {
      parts.push(`[${standard.id}]`);
    }

    parts.push(`${standard.standardNumber} ${standard.standardName}${buildTypeIndicator('S', standard.mediaType)}.`);

    if (standard.url) {
      parts.push(standard.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化专利
   */
  private formatPatent(ref: ReferenceUnion): string {
    const patent = ref as {
      id?: string;
      authors: Author[];
      title: string;
      patentNumber: string;
      announceDate?: string;
      pages?: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (patent.id) {
      parts.push(`[${patent.id}]`);
    }

    parts.push(this.formatAuthors(patent.authors));
    parts.push(`${patent.title}: ${patent.patentNumber}${buildTypeIndicator('P', patent.mediaType)}.`);

    if (patent.announceDate) {
      let info = patent.announceDate;
      if (patent.pages) {
        info += `: ${patent.pages}`;
      }
      parts.push(info + '.');
    }

    if (patent.url) {
      parts.push(patent.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化网站/网页
   */
  private formatWebPage(ref: ReferenceUnion): string {
    const webPage = ref as {
      id?: string;
      authors?: Author[];
      title: string;
      createDate?: string;
      accessDate: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (webPage.id) {
      parts.push(`[${webPage.id}]`);
    }

    if (webPage.authors && webPage.authors.length > 0) {
      parts.push(this.formatAuthors(webPage.authors));
    }

    parts.push(`${webPage.title}${buildTypeIndicator('EB', webPage.mediaType)}.`);

    if (webPage.createDate) {
      parts.push(`(${webPage.createDate})`);
    }

    if (webPage.accessDate) {
      parts.push(`[${webPage.accessDate}].`);
    }

    if (webPage.url) {
      parts.push(webPage.url + '.');
    }

    return parts.join(' ');
  }

  /**
   * 格式化档案
   */
  private formatArchive(ref: ReferenceUnion): string {
    const archive = ref as {
      id?: string;
      authors?: Author[];
      title: string;
      archiveNumber?: string;
      collectionPlace?: string;
      collector?: string;
      formedDate?: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (archive.id) {
      parts.push(`[${archive.id}]`);
    }

    if (archive.authors && archive.authors.length > 0) {
      parts.push(this.formatAuthors(archive.authors));
    }

    let title = archive.title;
    if (archive.archiveNumber) {
      title += `: ${archive.archiveNumber}`;
    }
    parts.push(`${title}${buildTypeIndicator('A', archive.mediaType)}.`);

    if (archive.collectionPlace && archive.collector && archive.formedDate) {
      parts.push(`${archive.collectionPlace}: ${archive.collector}, ${archive.formedDate}.`);
    }

    if (archive.url) {
      parts.push(archive.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化地图
   */
  private formatMap(ref: ReferenceUnion): string {
    const map = ref as {
      id?: string;
      authors?: Author[];
      title: string;
      scale?: string;
      version?: string;
      publisherPlace?: string;
      publisher?: string;
      year?: string;
      dimensions?: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (map.id) {
      parts.push(`[${map.id}]`);
    }

    if (map.authors && map.authors.length > 0) {
      parts.push(this.formatAuthors(map.authors));
    }

    let title = map.title;
    if (map.scale) {
      title += `. ${map.scale}`;
    }
    parts.push(`${title}${buildTypeIndicator('CM', map.mediaType)}.`);

    if (map.version) {
      parts.push(`${map.version}.`);
    }

    if (map.publisherPlace && map.publisher && map.year) {
      let info = `${map.publisherPlace}: ${map.publisher}, ${map.year}`;
      if (map.dimensions) {
        info += `. ${map.dimensions}`;
      }
      parts.push(info + '.');
    }

    if (map.url) {
      parts.push(map.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化数据集
   */
  private formatDataset(ref: ReferenceUnion): string {
    const dataset = ref as {
      id?: string;
      authors?: Author[];
      title: string;
      version?: string;
      platform?: string;
      releaseDate?: string;
      accessDate: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (dataset.id) {
      parts.push(`[${dataset.id}]`);
    }

    if (dataset.authors && dataset.authors.length > 0) {
      parts.push(this.formatAuthors(dataset.authors));
    }

    parts.push(`${dataset.title}${buildTypeIndicator('DS', dataset.mediaType)}.`);

    if (dataset.version) {
      parts.push(`${dataset.version}.`);
    }

    if (dataset.platform) {
      let info = dataset.platform;
      if (dataset.releaseDate) {
        info += ` (${dataset.releaseDate})`;
      }
      parts.push(info + ` [${dataset.accessDate}].`);
    }

    if (dataset.url) {
      parts.push(dataset.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化预印本
   */
  private formatPreprint(ref: ReferenceUnion): string {
    const preprint = ref as {
      id?: string;
      authors?: Author[];
      title: string;
      version?: string;
      platform?: string;
      createDate?: string;
      accessDate: string;
      url?: string;
      mediaType?: import('../types/index.js').MediaType;
    };

    const parts: string[] = [];

    if (preprint.id) {
      parts.push(`[${preprint.id}]`);
    }

    if (preprint.authors && preprint.authors.length > 0) {
      parts.push(this.formatAuthors(preprint.authors));
    }

    parts.push(`${preprint.title}${buildTypeIndicator('PP', preprint.mediaType)}.`);

    if (preprint.version) {
      parts.push(`${preprint.version}.`);
    }

    if (preprint.platform) {
      let info = preprint.platform;
      if (preprint.createDate) {
        info += ` (${preprint.createDate})`;
      }
      parts.push(info + ` [${preprint.accessDate}].`);
    }

    if (preprint.url) {
      parts.push(preprint.url);
    }

    return parts.join(' ');
  }

  /**
   * 通用格式化
   */
  private formatGeneric(ref: ReferenceUnion): string {
    const parts: string[] = [];

    if (ref.id) {
      parts.push(`[${ref.id}]`);
    }

    if (ref.authors.length > 0) {
      parts.push(this.formatAuthors(ref.authors));
    }

    parts.push(`${ref.title}${buildTypeIndicator(ref.type, ref.mediaType)}.`);

    if (ref.year) {
      parts.push(ref.year + '.');
    }

    if (ref.publisherPlace && ref.publisher) {
      parts.push(`${ref.publisherPlace}: ${ref.publisher}.`);
    }

    if (ref.url) {
      parts.push(ref.url);
    }

    return parts.join(' ');
  }

  /**
   * 格式化作者列表
   */
  private formatAuthors(authors: Author[]): string {
    if (authors.length === 0) return '';

    const formatted = authors.map(a => {
      if (a.isOrganization) {
        return a.surname;
      }
      if (a.givenName) {
        return `${a.surname} ${a.givenName}`;
      }
      return a.surname;
    });

    if (formatted.length > 3) {
      return formatted.slice(0, 3).join(', ') + ', et al.';
    }

    return formatted.join(', ');
  }
}

/**
 * 便捷函数：格式化文献对象
 */
export function format(reference: ReferenceUnion, options?: FormatOptions): string {
  const formatter = new Formatter(options);
  return formatter.format(reference);
}
