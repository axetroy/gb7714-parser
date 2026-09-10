import type { ReferenceUnion, Author, MediaType } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 档案格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.12 档案
 */
export class ArchiveFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const archive = ref as {
      id?: string;
      authors?: Author[];
      title: string;
      archiveNumber?: string;
      collectionPlace?: string;
      collector?: string;
      formedDate?: string;
      url?: string;
      mediaType?: MediaType;
    };

    const parts: string[] = [];

    if (archive.id) {
      parts.push(`[${archive.id}]`);
    }

    if (archive.authors && archive.authors.length > 0) {
      parts.push(this.formatAuthors(archive.authors));
    }

    let title = archive.title;
    if (archive.archiveNumber) {
      title += `: ${archive.archiveNumber}`;
    }
    parts.push(`${title}${buildTypeIndicator('A', archive.mediaType)}.`);

    if (archive.collectionPlace && archive.collector && archive.formedDate) {
      parts.push(`${archive.collectionPlace}: ${archive.collector}, ${archive.formedDate}.`);
    }

    if (archive.url) {
      parts.push(archive.url);
    }

    return parts.join(' ');
  }
}
