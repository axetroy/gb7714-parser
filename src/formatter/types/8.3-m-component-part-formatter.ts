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

    // 析出文献部分：作者. 题名[类型]. 译者//
    let componentPart = '';
    if (component.authors.length > 0) {
      componentPart += this.formatAuthors(component.authors, component.authorsTruncated, component.authorComma) + '. ';
    }
    let title = component.title;
    if (component.subtitle) {
      const sep = component.subtitleSeparator || ':';
      const suffixSep = sep === '：' ? '' : ' ';
      title += `${sep}${suffixSep}${component.subtitle}`;
    }
    const typeIndicator = buildTypeIndicator(component.type, component.mediaType);
    componentPart += title + typeIndicator;
    if (component.otherAuthors && component.otherAuthors.length > 0) {
      componentPart += '. ' + this.formatAuthors(component.otherAuthors, undefined, component.authorComma);
    }
    // 出处文献
    let hostPart = '';
    if (component.host) {
      if (component.host.authors && component.host.authors.length > 0) {
        hostPart += this.formatAuthors(component.host.authors, component.host.authorsTruncated, component.host.authorComma) + '. ';
      }
      hostPart += `${component.host.title}.`;

      if (component.host.version) {
        hostPart += ` ${component.host.version}.`;
      }

      if (component.host.publisherPlace && component.host.publisher && component.host.year) {
        let hostInfo = `${component.host.publisherPlace}: ${component.host.publisher}, ${component.host.year}`;
        // 析出文献页码紧跟在出版年后面
        if (component.pages) {
          hostInfo += `: ${component.pages}`;
        }
        hostPart += ' ' + hostInfo + '.';
      } else if (component.host.year) {
        let hostInfo = `${component.host.year}`;
        if (component.pages) {
          hostInfo += `: ${component.pages}`;
        }
        hostPart += ' ' + hostInfo + '.';
      } else if (component.pages) {
        hostPart += `: ${component.pages}.`;
      }
    }

    if (component.url) {
      hostPart += ' ' + component.url;
    }

    const pid = this.pidSuffix(component.pid, component.url);
    if (pid) {
      hostPart += ' ' + pid;
    }

    // 组装：析出部分 + // + 出处部分
    return (componentPart + '//' + hostPart).trim();
  }
}
