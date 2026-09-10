import type { ReferenceUnion, Book } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 图书格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.2 图书
 *
 * 格式: 作者. 题名: 副标题[M]. 其他责任者. 版本. 出版地: 出版者, 出版年: 页码.
 */
export class BookFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const book = ref as Book;

    const parts: string[] = [];

    if (book.id) {
      parts.push(`[${book.id}]`);
    }

    if (book.authors.length > 0) {
      parts.push(this.formatAuthors(book.authors, book.authorsTruncated) + '.');
    }

    let title = book.title;
    if (book.subtitle) {
      title += `: ${book.subtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('M', book.mediaType)}.`);

    // 其他责任者（译者、编者等）
    if (book.otherAuthors && book.otherAuthors.length > 0) {
      if (book.otherAuthors.length > 0) {
      parts.push(this.formatAuthors(book.otherAuthors) + '.');
    }
    }

    if (book.version) {
      parts.push(`${book.version}.`);
    }

    if (book.publisherPlace && book.publisher && book.year) {
      const formattedYear = this.formatYear(book.year, book.alternativeYear);
      let info = `${book.publisherPlace}: ${book.publisher}, ${formattedYear}`;
      if (book.pages) {
        info += `: ${book.pages}`;
      }
      parts.push(info + '.');
    }

    if (book.url) {
      parts.push(book.url);
    }

    const pid = this.pidSuffix(book.pid, book.url);
    if (pid) {
      parts.push(pid);
    }

    return parts.join(' ');
  }
}
