import type { ReferenceUnion, Report } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 报告格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.8 报告
 *
 * 格式: 作者. 题名: 副题名: 报告编号[R]. 发布日期;引文页码.
 */
export class ReportFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const report = ref as Report;

    const parts: string[] = [];

    if (report.id) {
      parts.push(`[${report.id}]`);
    }

    if (report.authors.length > 0) {
      parts.push(this.formatAuthors(report.authors, report.authorsTruncated) + '.');
    }

    let title = report.title;
    if (report.subtitle) {
      title += `: ${report.subtitle}`;
    }
    if (report.reportNumber) {
      title += `: ${report.reportNumber}`;
    }
    parts.push(`${title}${buildTypeIndicator('R', report.mediaType)}.`);

    if (report.releaseDate) {
      let info = report.releaseDate;
      if (report.pages) {
        info += `: ${report.pages}`;
      }
      parts.push(info + '.');
    }

    if (report.url) {
      parts.push(report.url);
    }

    return parts.join(' ');
  }
}
