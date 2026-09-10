import type { ReferenceUnion, Dataset } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 数据集格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.14 数据集
 */
export class DatasetFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const dataset = ref as Dataset;

    const parts: string[] = [];

    if (dataset.id) {
      parts.push(`[${dataset.id}]`);
    }

    if (dataset.authors && dataset.authors.length > 0) {
      parts.push(this.formatAuthors(dataset.authors));
    }

    parts.push(`${dataset.title}${buildTypeIndicator('DS', dataset.mediaType)}.`);

    if (dataset.version) {
      parts.push(`${dataset.version}.`);
    }

    if (dataset.platform) {
      let info = dataset.platform;
      if (dataset.releaseDate) {
        info += ` (${dataset.releaseDate})`;
      }
      parts.push(info + ` [${dataset.accessDate}].`);
    }

    if (dataset.url) {
      parts.push(dataset.url);
    }

    return parts.join(' ');
  }
}
