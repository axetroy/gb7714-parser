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
}
