import type { ReferenceUnion, Newspaper } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 报纸析出文献格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.5 连续出版物中的析出文献（报纸 [N]）
 *
 * 格式: 作者. 题名[N]. 报纸名, 出版日期(版次).
 */
export class NewspaperFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const newspaper = ref as Newspaper;

    const parts: string[] = [];

    if (newspaper.id) {
      parts.push(`[${newspaper.id}]`);
    }

    if (newspaper.authors.length > 0) {
      if (newspaper.authors.length > 0) {
      parts.push(this.formatAuthors(newspaper.authors, newspaper.authorsTruncated, newspaper.authorComma) + '.');
    }
    }

    parts.push(`${newspaper.title}${buildTypeIndicator('N', newspaper.mediaType)}.`);

    if (newspaper.newspaperTitle) {
      let info = newspaper.newspaperTitle;
      // 标准 §8.5.1.4: 报纸名后著录出版日期与版次，如 2013-03-16 (1)
      const date = newspaper.monthDay
        ? `${newspaper.year}-${newspaper.monthDay}`
        : newspaper.year;
      if (date) {
        info += `, ${date}`;
      }
      if (newspaper.edition) {
        info += ` (${newspaper.edition})`;
      }
      parts.push(info + '.');
    }

    if (newspaper.url) {
      parts.push(newspaper.url);
    }

    const pid = this.pidSuffix(newspaper.pid, newspaper.url);
    if (pid) {
      parts.push(pid);
    }

    return parts.join(' ');
  }
}
