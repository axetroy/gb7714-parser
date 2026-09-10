import type { ReferenceUnion, ComponentPart } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 图书中的析出文献格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.3 图书中的析出文献
 *
 * 格式: 作者. 析出文献题名[M]//宿主作者. 宿主题名. 版本. 出版地: 出版者, 出版年: 析出文献页码.
 */
export class ComponentPartFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const component = ref as ComponentPart;

    const parts: string[] = [];

    if (component.id) {
      parts.push(`[${component.id}]`);
    }

    if (component.authors.length > 0) {
      if (component.authors.length > 0) {
      parts.push(this.formatAuthors(component.authors, component.authorsTruncated) + '.');
    }
    }

    // 析出文献题名 + 文献类型标识
    let title = component.title;
    if (component.subtitle) {
      title += `: ${component.subtitle}`;
    }
    // 标准 §8.3.2 要求析出文献题名后需有文献类型标识
    const typeIndicator = buildTypeIndicator(component.type, component.mediaType);
    parts.push(`${title}${typeIndicator}//`);

    // 出处文献
    if (component.host) {
      if (component.host.authors && component.host.authors.length > 0) {
        parts.push(this.formatAuthors(component.host.authors, component.host.authorsTruncated) + '.');
      }
      parts.push(`${component.host.title}.`);

      if (component.host.version) {
        parts.push(`${component.host.version}.`);
      }

      if (component.host.publisherPlace && component.host.publisher && component.host.year) {
        let hostInfo = `${component.host.publisherPlace}: ${component.host.publisher}, ${component.host.year}`;
        // 析出文献页码紧跟在出版年后面
        if (component.pages) {
          hostInfo += `: ${component.pages}`;
        }
        parts.push(hostInfo + '.');
      } else if (component.host.year) {
        let hostInfo = `${component.host.year}`;
        if (component.pages) {
          hostInfo += `: ${component.pages}`;
        }
        parts.push(hostInfo + '.');
      } else if (component.pages) {
        parts.push(`: ${component.pages}.`);
      }
    }

    if (component.url) {
      parts.push(component.url);
    }

    const pid = this.pidSuffix(component.pid, component.url);
    if (pid) {
      parts.push(pid);
    }

    return parts.join(' ');
  }
}
