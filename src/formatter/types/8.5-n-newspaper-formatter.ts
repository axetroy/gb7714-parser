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
      parts.push(this.formatAuthors(newspaper.authors, newspaper.authorsTruncated));
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

    const pid = this.pidSuffix(newspaper.pid, newspaper.url);
    if (pid) {
      parts.push(pid);
    }

    return parts.join(' ');
  }
}
