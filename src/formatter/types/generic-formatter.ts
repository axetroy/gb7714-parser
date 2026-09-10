import type { ReferenceUnion } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 通用格式化器
 *
 * 兜底格式化，用于没有专用格式化器的类型（如 [Z] 其他、[G] 汇编）
 * 以及无法识别的类型
 */
export class GenericFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
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
}
