import type { ReferenceUnion, Standard } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 标准文献格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.9 标准
 */
export class StandardFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const standard = ref as Standard;

    const parts: string[] = [];

    if (standard.id) {
      parts.push(`[${standard.id}]`);
    }

    parts.push(`${standard.standardNumber} ${standard.standardName}${buildTypeIndicator('S', standard.mediaType, standard.includeTypeIndicator !== false)}.`);

    if (standard.url) {
      parts.push(standard.url);
    }

    return parts.join(' ');
  }
}
