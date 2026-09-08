import type {
  ReferenceUnion,
  FormatOptions,
  Author,
  ComponentPart,
  Serial,
} from '../types/index.js';
import { buildTypeIndicator } from '../utils/index.js';

/**
 * 语种分类
 */
type LanguageGroup = 'zh' | 'ja' | 'western' | 'ru' | 'other';

/**
 * 格式化器
 * 将结构化对象反向生成为符合 GB/T 7714 的字符串
 */
export class Formatter {
  private options: FormatOptions;

  constructor(options?: FormatOptions) {
    this.options = {
      version: '2025',
      locale: 'zh',
      ...options,
    };
  }

  /**
   * 格式化文献对象为字符串
   */
  format(reference: ReferenceUnion): string {
    switch (reference.type) {
      case 'J':
        // 检查是否是连续出版物（有 serialTitle 字段）
        if ('serialTitle' in reference && (reference as Serial).serialTitle) {
          return this.formatSerial(reference);
        }
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

    if (newspaper.pid && !this.urlContainsPid(newspaper.url, newspaper.pid)) {
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
   * 格式: 作者. 析出文献题名[M]//宿主作者. 宿主题名. 版本. 出版地: 出版者, 出版年: 析出文献页码.
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

    // 析出文献题名 + 文献类型标识
    let title = component.title;
    if (component.subtitle) {
      title += `: ${component.subtitle}`;
    }
    // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
    const typeIndicator = buildTypeIndicator(component.type, component.mediaType);
    parts.push(`${title}${typeIndicator}//`);

    // 出处文献
    if (component.host) {
      if (component.host.authors && component.host.authors.length > 0) {
        parts.push(this.formatAuthors(component.host.authors));
      }
      parts.push(`${component.host.title}.`);

      if (component.host.version) {
        parts.push(`${component.host.version}.`);
      }

      if (component.host.publisherPlace && component.host.publisher && component.host.year) {
        let hostInfo = `${component.host.publisherPlace}: ${component.host.publisher}, ${component.host.year}`;
        // 析出文献页码紧跟在出版年后面
        if (component.pages) {
          hostInfo += `: ${component.pages}`;
        }
        parts.push(hostInfo + '.');
      } else if (component.host.year) {
        let hostInfo = `${component.host.year}`;
        if (component.pages) {
          hostInfo += `: ${component.pages}`;
        }
        parts.push(hostInfo + '.');
      } else if (component.pages) {
        parts.push(`: ${component.pages}.`);
      }
    }

    if (component.url) {
      parts.push(component.url);
    }

    if (component.pid && !this.urlContainsPid(component.url, component.pid)) {
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
   * 顺序编码制: 作者. 题名[J]. 刊名, 年, 卷(期): 页码.
   * 著者-出版年制: 作者, 年. 题名[J]. 刊名, 卷(期): 页码.
   */
  private formatJournal(ref: ReferenceUnion): string {
    const journal = ref as {
      id?: string;
      authors: Author[];
      title: string;
      subtitle?: string;
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

    if (journal.id) {
      parts.push(`[${journal.id}]`);
    }

    // 著者-出版年制: 作者, 年.
    if (this.options.citationStyle === 'author-date' && journal.year) {
      parts.push(`${this.formatAuthors(journal.authors)}, ${journal.year}.`);
    } else {
      parts.push(this.formatAuthors(journal.authors));
    }

    let title = journal.title;
    if (journal.subtitle) {
      title += `: ${journal.subtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('J', journal.mediaType)}.`);

    // 刊名, [年,] 卷(期): 页码
    let journalInfo = journal.journalTitle;
    // 著者-出版年制时，年已移至作者后，此处不再重复
    if (this.options.citationStyle !== 'author-date' && journal.year) {
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

    if (journal.url) {
      parts.push(journal.url);
    }

    if (journal.pid && !this.urlContainsPid(journal.url, journal.pid)) {
      if (this.options.version === '2015') {
        parts.push(`DOI:${journal.pid}`);
      } else {
        parts.push(`PID:${journal.pid}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 格式化连续出版物
   * 格式: 作者. 题名[J]. 年, 卷(期)—年, 卷(期). 出版地: 出版者, 出版年—.
   */
  private formatSerial(ref: ReferenceUnion): string {
    const serial = ref as Serial;

    const parts: string[] = [];

    if (serial.id) {
      parts.push(`[${serial.id}]`);
    }

    if (serial.authors && serial.authors.length > 0) {
      parts.push(this.formatAuthors(serial.authors));
    }

    // 刊名 + 文献类型标识
    let title = serial.serialTitle;
    if (serial.serialSubtitle) {
      title += `: ${serial.serialSubtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('J', serial.mediaType)}.`);

    // 年卷期信息
    let serialInfo = '';
    if (serial.startYear) {
      serialInfo += serial.startYear;
    }
    if (serial.startVolume) {
      serialInfo += `, ${serial.startVolume}`;
    }
    if (serial.startIssue) {
      serialInfo += `(${serial.startIssue})`;
    }

    // 连接符 —
    if (serial.endYear !== undefined || serial.endVolume || serial.endIssue) {
      serialInfo += '—';
      if (serial.endYear) {
        serialInfo += serial.endYear;
      }
      if (serial.endVolume) {
        serialInfo += `, ${serial.endVolume}`;
      }
      if (serial.endIssue) {
        serialInfo += `(${serial.endIssue})`;
      }
    } else {
      serialInfo += '—';
    }

    // 连载后续部分（§8.5.1.3）
    // 格式: "年, 卷(期): 页码" 或 "年, 卷(期): 起始页码-终止页码"
    if (serial.continuationParts && serial.continuationParts.length > 0) {
      serialInfo += '; ' + serial.continuationParts.join('; ');
    }

    parts.push(serialInfo + '.');

    // 出版地: 出版者, 出版年—
    if (serial.publisherPlace && serial.publisher && serial.publicationStartYear) {
      let pubInfo = `${serial.publisherPlace}: ${serial.publisher}, ${serial.publicationStartYear}`;

      // 出版年结束
      if (serial.publicationEndYear !== undefined) {
        pubInfo += `—${serial.publicationEndYear}`;
      } else {
        pubInfo += '—';
      }

      parts.push(pubInfo + '.');
    }

    if (serial.url) {
      parts.push(serial.url);
    }

    if (serial.pid && !this.urlContainsPid(serial.url, serial.pid)) {
      if (this.options.version === '2015') {
        parts.push(`DOI:${serial.pid}`);
      } else {
        parts.push(`PID:${serial.pid}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 格式化图书
   * 格式: 作者. 题名: 副标题[M]. 其他责任者. 版本. 出版地: 出版者, 出版年: 页码.
   */
  private formatBook(ref: ReferenceUnion): string {
    const book = ref as {
      id?: string;
      authors: Author[];
      title: string;
      subtitle?: string;
      otherAuthors?: Author[];
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

    let title = book.title;
    if (book.subtitle) {
      title += `: ${book.subtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('M', book.mediaType)}.`);

    // 其他责任者（译者、编者等）
    if (book.otherAuthors && book.otherAuthors.length > 0) {
      parts.push(this.formatAuthors(book.otherAuthors) + '.');
    }

    if (book.version) {
      parts.push(`${book.version}.`);
    }

    if (book.publisherPlace && book.publisher && book.year) {
      const formattedYear = this.formatYear(book.year, (book as Record<string, unknown>).alternativeYear as string | undefined);
      let info = `${book.publisherPlace}: ${book.publisher}, ${formattedYear}`;
      if (book.pages) {
        info += `: ${book.pages}`;
      }
      parts.push(info + '.');
    }

    if (book.url) {
      parts.push(book.url);
    }

    if (book.pid && !this.urlContainsPid(book.url, book.pid)) {
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
   * 格式: 作者. 题名: 副标题[D]. 学位授予单位所在地: 学位授予单位, 学位授予年: 页码.
   */
  private formatThesis(ref: ReferenceUnion): string {
    const thesis = ref as {
      id?: string;
      authors: Author[];
      title: string;
      subtitle?: string;
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

    let title = thesis.title;
    if (thesis.subtitle) {
      title += `: ${thesis.subtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('D', thesis.mediaType)}.`);

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
   * 格式: 作者. 题名;报告编号[R]. 发布日期;引文页码.
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
      title += `;${report.reportNumber}`;
    }
    parts.push(`${title}${buildTypeIndicator('R', report.mediaType)}.`);

    if (report.releaseDate) {
      let info = report.releaseDate;
      if (report.pages) {
        info += `;${report.pages}`;
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

    parts.push(`${standard.standardNumber} ${standard.standardName}${buildTypeIndicator('S', standard.mediaType, (standard as Record<string, unknown>).includeTypeIndicator !== false)}.`);

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
      const surname = first.isOrganization ? first.surname : first.surname;
      const suffix = this.options.locale === 'en' ? 'et al.' : '等';
      authorStr = `${surname}, ${suffix}`;
    } else {
      authorStr = authors[0]!.surname;
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
   * 格式化作者列表
   * - 超过3个责任者 → 前3个 + "等"或"et al."
   * - 无责任者 → 空字符串（顺序编码制可省略，§7.1.3）
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
      const suffix = this.options.locale === 'en' ? 'et al.' : '等';
      return formatted.slice(0, 3).join(', ') + `, ${suffix}`;
    }

    return formatted.join(', ');
  }

  /**
   * 检查 URL 中是否包含永久标识符
   * 标准 §7.9.1：获取和访问路径中含永久标识符时，可不重复著录永久标识符
   */
  private urlContainsPid(url?: string, pid?: string): boolean {
    if (!url || !pid) return false;
    // 检查 URL 中是否包含 DOI 或 PID
    const lowerUrl = url.toLowerCase();
    const lowerPid = pid.toLowerCase();
    return lowerUrl.includes(lowerPid) || lowerUrl.includes('doi.org') || lowerUrl.includes('doi:');
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
      const name = author.surname || '';
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
   * 格式化年份
   * 标准 §7.5.4.1：如有其他纪年形式时，应将原有的纪年形式置于"（ ）"内
   */
  private formatYear(year?: string, alternativeYear?: string): string {
    if (!year) return '';
    if (alternativeYear) {
      return `${year}（${alternativeYear}）`;
    }
    return year;
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
    return firstAuthor.surname || '';
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
