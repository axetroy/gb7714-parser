import type { ReferenceUnion, Archive } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 档案格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.12 档案
 */
export class ArchiveFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const archive = ref as Archive;

    const parts: string[] = [];

    if (archive.id) {
      parts.push(`[${archive.id}]`);
    }

    if (archive.authors && archive.authors.length > 0) {
      if (archive.authors.length > 0) {
      parts.push(this.formatAuthors(archive.authors, archive.authorsTruncated) + '.');
    }
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
