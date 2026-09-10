import type { ReferenceUnion, Author, MediaType } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 学位论文格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.7 学位论文
 *
 * 格式: 作者. 题名: 副标题[D]. 学位授予单位所在地: 学位授予单位, 学位授予年: 页码.
 */
export class ThesisFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const thesis = ref as {
      id?: string;
      authors: Author[];
      title: string;
      subtitle?: string;
      awardPlace?: string;
      awardInstitution: string;
      awardYear?: string;
      pages?: string;
      url?: string;
      mediaType?: MediaType;
    };

    const parts: string[] = [];

    if (thesis.id) {
      parts.push(`[${thesis.id}]`);
    }

    parts.push(this.formatAuthors(thesis.authors));

    let title = thesis.title;
    if (thesis.subtitle) {
      title += `: ${thesis.subtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('D', thesis.mediaType)}.`);

    if (thesis.awardPlace && thesis.awardInstitution && thesis.awardYear) {
      let info = `${thesis.awardPlace}: ${thesis.awardInstitution}, ${thesis.awardYear}`;
      if (thesis.pages) {
        info += `: ${thesis.pages}`;
      }
      parts.push(info + '.');
    } else if (thesis.awardInstitution && thesis.awardYear) {
      let info = `${thesis.awardInstitution}, ${thesis.awardYear}`;
      if (thesis.pages) {
        info += `: ${thesis.pages}`;
      }
      parts.push(info + '.');
    }

    if (thesis.url) {
      parts.push(thesis.url);
    }

    return parts.join(' ');
  }
}
