import type { ReferenceUnion, WebPage } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 网站/网页格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.11 网站、网页
 */
export class WebPageFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const webPage = ref as WebPage;

    const parts: string[] = [];

    if (webPage.id) {
      parts.push(`[${webPage.id}]`);
    }

    if (webPage.authors && webPage.authors.length > 0) {
      parts.push(this.formatAuthors(webPage.authors));
    }

    parts.push(`${webPage.title}${buildTypeIndicator('EB', webPage.mediaType)}.`);

    if (webPage.createDate) {
      parts.push(`(${webPage.createDate})`);
    }

    if (webPage.accessDate) {
      parts.push(`[${webPage.accessDate}].`);
    }

    if (webPage.url) {
      parts.push(webPage.url + '.');
    }

    return parts.join(' ');
  }
}
