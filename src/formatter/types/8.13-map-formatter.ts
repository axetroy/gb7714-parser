import type { ReferenceUnion, Author, MediaType } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 地图格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.13 地图
 */
export class MapFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const map = ref as {
      id?: string;
      authors?: Author[];
      title: string;
      scale?: string;
      version?: string;
      publisherPlace?: string;
      publisher?: string;
      year?: string;
      dimensions?: string;
      url?: string;
      mediaType?: MediaType;
    };

    const parts: string[] = [];

    if (map.id) {
      parts.push(`[${map.id}]`);
    }

    if (map.authors && map.authors.length > 0) {
      parts.push(this.formatAuthors(map.authors));
    }

    let title = map.title;
    if (map.scale) {
      title += `. ${map.scale}`;
    }
    parts.push(`${title}${buildTypeIndicator('CM', map.mediaType)}.`);

    if (map.version) {
      parts.push(`${map.version}.`);
    }

    if (map.publisherPlace && map.publisher && map.year) {
      let info = `${map.publisherPlace}: ${map.publisher}, ${map.year}`;
      if (map.dimensions) {
        info += `. ${map.dimensions}`;
      }
      parts.push(info + '.');
    }

    if (map.url) {
      parts.push(map.url);
    }

    return parts.join(' ');
  }
}
