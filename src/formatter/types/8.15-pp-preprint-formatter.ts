import type { ReferenceUnion, Preprint } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 预印本格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.15 预印本
 */
export class PreprintFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const preprint = ref as Preprint;

    const parts: string[] = [];

    if (preprint.id) {
      parts.push(`[${preprint.id}]`);
    }

    if (preprint.authors && preprint.authors.length > 0) {
      if (preprint.authors.length > 0) {
      parts.push(this.formatAuthors(preprint.authors, preprint.authorsTruncated) + '.');
    }
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
}
