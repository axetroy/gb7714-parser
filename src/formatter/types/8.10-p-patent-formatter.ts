import type { ReferenceUnion, Patent } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 专利格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.10 专利
 */
export class PatentFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const patent = ref as Patent;

    const parts: string[] = [];

    if (patent.id) {
      parts.push(`[${patent.id}]`);
    }

    if (patent.authors.length > 0) {
      parts.push(this.formatAuthors(patent.authors, patent.authorsTruncated, patent.authorComma) + '.');
    }
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
}
