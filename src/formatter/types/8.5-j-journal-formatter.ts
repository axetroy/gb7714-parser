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

    const pid = this.pidSuffix(journal.pid, journal.url);
    if (pid) {
      parts.push(pid);
    }

    return parts.join(' ');
  }
}
