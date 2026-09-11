import type { ReferenceUnion, Proceedings } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 会议录格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.6 会议录
 */
export class ProceedingsFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const proceedings = ref as Proceedings;

    const idParts: string[] = [];

    if (proceedings.id) {
      idParts.push(`[${proceedings.id}]`);
    }

    const typeIndicator = buildTypeIndicator('C', proceedings.mediaType);

    // 析出文献形式：作者. 题名[类型]//会议名称, 年份: 页码.
    if (proceedings.conferenceName && proceedings.conferenceYear) {
      let componentPart = '';
      if (proceedings.authors.length > 0) {
        componentPart += this.formatAuthors(proceedings.authors, proceedings.authorsTruncated, proceedings.authorComma) + '. ';
      }
      let title = proceedings.title;
      if (proceedings.subtitle) {
        const sep = proceedings.subtitleSeparator || ':';
        const suffixSep = sep === '：' ? '' : ' ';
        title += `${sep}${suffixSep}${proceedings.subtitle}`;
      }
      componentPart += title + typeIndicator + '//' + proceedings.conferenceName + ', ' + proceedings.conferenceYear;
      if (proceedings.pages) {
        componentPart += ': ' + proceedings.pages;
      }
      componentPart += '.'; let result = componentPart; if (proceedings.id) { result = '[' + proceedings.id + '] ' + result; } if (proceedings.url) { result += ' ' + proceedings.url; } return result;
    }

    // 图书形式：作者. 题名[类型]. 出版地: 出版者, 年份.
    const fmtParts: string[] = [];
    if (proceedings.authors.length > 0) {
      fmtParts.push(this.formatAuthors(proceedings.authors, proceedings.authorsTruncated, proceedings.authorComma) + '.');
    }
    let title = proceedings.title;
    if (proceedings.subtitle) {
      const sep = proceedings.subtitleSeparator || ':';
      const suffixSep = sep === '：' ? '' : ' ';
      title += `${sep}${suffixSep}${proceedings.subtitle}`;
    }
    fmtParts.push(title + typeIndicator + '.');

    if (proceedings.publisherPlace && proceedings.publisher && proceedings.year) {
      fmtParts.push(`${proceedings.publisherPlace}: ${proceedings.publisher}, ${proceedings.year}.`);
    }

    if (proceedings.url) {
      fmtParts.push(proceedings.url);
    }

    return fmtParts.join(' ');
  }
}
