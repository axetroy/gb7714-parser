import type { ReferenceUnion, Map } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 地图格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.13 地图
 */
export class MapFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const map = ref as Map;

    const parts: string[] = [];

    if (map.id) {
      parts.push(`[${map.id}]`);
    }

    if (map.authors && map.authors.length > 0) {
      if (map.authors.length > 0) {
      parts.push(this.formatAuthors(map.authors, map.authorsTruncated, map.authorComma) + '.');
    }
    }

    let title = map.title;
    if (map.scale) {
      const sep = map.titleSeparator || '.';
      title += `${sep}${sep === ':' || sep === '：' ? '' : ' '}${map.scale}`;
    }

    // 析出文献形式：作者. 题名[类型]//宿主题名. 出版信息
    if (map.host && map.host.title) {
      const typeIndicator = buildTypeIndicator('CM', map.mediaType);
      let hostInfo = map.host.publisherPlace && map.host.publisher && map.host.year
        ? `${map.host.publisherPlace}: ${map.host.publisher}, ${map.host.year}`
        : '';
      if (map.pages) {
        hostInfo += `: ${map.pages}`;
      }
      parts.push(`${title}${typeIndicator}//${map.host.title}. ${hostInfo}.`);
    } else {
      parts.push(`${title}${buildTypeIndicator('CM', map.mediaType)}.`);
    }

    if (map.version) {
      parts.push(`${map.version}.`);
    }

    if (map.publisherPlace && map.publisher && map.year) {
      let info = `${map.publisherPlace}: ${map.publisher}, ${map.year}`;
      if (map.pages) {
        info += `: ${map.pages}`;
      }
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
