import type { ReferenceUnion, Journal } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 期刊析出文献格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.5 连续出版物中的析出文献
 *
 * 顺序编码制: 作者. 题名[J]. 刊名, 年, 卷(期): 页码.
 * 著者-出版年制: 作者, 年. 题名[J]. 刊名, 卷(期): 页码.
 */
export class JournalFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const journal = ref as Journal;

    const parts: string[] = [];

    if (journal.id) {
      parts.push(`[${journal.id}]`);
    }

    // 著者-出版年制: 作者, 年.
    if (this.options.citationStyle === 'author-date' && journal.year) {
      parts.push(`${this.formatAuthors(journal.authors, journal.authorsTruncated, journal.authorComma)}, ${journal.year}.`);
    } else {
      if (journal.authors.length > 0) {
      parts.push(this.formatAuthors(journal.authors, journal.authorsTruncated, journal.authorComma) + '.');
    }
    }

    let title = journal.title;
    if (journal.subtitle) {
      // 半角冒号后加空格（标准示例 "镜范: 以平安"），全角冒号直接拼接（中文排版无空格）
      const sep = journal.subtitleSeparator === ':' ? ': ' : (journal.subtitleSeparator || ': ');
      title += `${sep}${journal.subtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('J', journal.mediaType)}.`);

    // 析出文献其他责任者（标准 §8.5: 类型标识后著录，如 "顾幼静，译."）
    if (journal.otherAuthors && journal.otherAuthors.length > 0) {
      parts.push(this.formatAuthors(journal.otherAuthors, undefined, journal.authorComma) + '.');
    }

    // 刊名, [年,] [在线出版日期,] 卷(期): 页码
    let journalInfo = journal.journalTitle;
    // 著者-出版年制时，年已移至作者后，此处不再重复
    if (this.options.citationStyle !== 'author-date') {
      if (journal.year) {
        journalInfo += `, ${journal.year}`;
      }
      if (journal.onlineDate) {
        journalInfo += `, ${journal.onlineDate}`;
      }
    }
    if (journal.volume) {
      const volSep = journal.volumeSeparator || '';
      journalInfo += `, ${journal.volume}${volSep}`;
    }
    if (journal.issue) {
      const issuePrefix = journal.issueSpace ? ' ' : '';
      journalInfo += `${issuePrefix}(${journal.issue})`;
    }
    if (journal.pages) {
      journalInfo += `: ${journal.pages}`;
    }
    parts.push(journalInfo + '.');

    if (journal.url) {
      parts.push(journal.url);
    }

    const pid = this.pidSuffix(journal.pid, journal.url);
    if (pid) {
      parts.push(pid);
    }

    return parts.join(' ');
  }
}
