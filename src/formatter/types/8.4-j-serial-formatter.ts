import type { ReferenceUnion, Serial } from '../../types/index.js';
import { buildTypeIndicator } from '../../utils/index.js';
import { BaseFormatter } from '../base.js';

/**
 * 连续出版物格式化器
 *
 * 对应标准 GB/T 7714-2025 §8.4 连续出版物
 *
 * 格式: 作者. 题名[J]. 年, 卷(期)—年, 卷(期). 出版地: 出版者, 出版年—.
 */
export class SerialFormatter extends BaseFormatter {
  format(ref: ReferenceUnion): string {
    const serial = ref as Serial;

    const parts: string[] = [];

    if (serial.id) {
      parts.push(`[${serial.id}]`);
    }

    if (serial.authors && serial.authors.length > 0) {
      if (serial.authors.length > 0) {
      parts.push(this.formatAuthors(serial.authors, serial.authorsTruncated, serial.authorComma) + '.');
    }
    }

    // 刊名 + 文献类型标识
    let title = serial.serialTitle;
    if (serial.serialSubtitle) {
      title += `: ${serial.serialSubtitle}`;
    }
    parts.push(`${title}${buildTypeIndicator('J', serial.mediaType)}.`);

    // 年卷期信息
    let serialInfo = '';
    if (serial.startYear) {
      serialInfo += serial.startYear;
    }
    if (serial.startVolume) {
      const volSep = serial.volumeSeparator || '';
      serialInfo += `, ${serial.startVolume}${volSep}`;
    }
    if (serial.startIssue) {
      // 只有当没有卷号时才添加空格（有卷号时逗号后已有空格）
      const volSep = serial.startVolume ? '' : (serial.volumeSeparator || '');
      serialInfo += `${volSep}(${serial.startIssue})`;
    }

    // 连接符 —
    if (serial.endYear !== undefined || serial.endVolume || serial.endIssue) {
      serialInfo += '—';
      if (serial.endYear) {
        serialInfo += serial.endYear;
      }
      if (serial.endVolume) {
        serialInfo += `, ${serial.endVolume}`;
      }
      if (serial.endIssue) {
        // 只有当没有卷号时才添加空格（有卷号时逗号后已有空格）
        const volSep = serial.endVolume ? '' : (serial.volumeSeparator || '');
        serialInfo += `${volSep}(${serial.endIssue})`;
      }
    } else {
      serialInfo += '—';
    }

    // 连载后续部分（§8.5.1.3）
    // 格式: "年, 卷(期): 页码" 或 "年, 卷(期): 起始页码-终止页码"
    if (serial.continuationParts && serial.continuationParts.length > 0) {
      serialInfo += '; ' + serial.continuationParts.join('; ');
    }

    // 如果没有结束年份但有出版信息，不添加句号（出版信息会自带句号）
    if (!serial.endYear && serial.publisherPlace && serial.publisher && serial.publicationStartYear) {
      parts.push(serialInfo);
    } else {
      parts.push(serialInfo + '.');
    }

    // 出版地: 出版者, 出版年—
    if (serial.publisherPlace && serial.publisher && serial.publicationStartYear) {
      let pubInfo = `${serial.publisherPlace}: ${serial.publisher}, ${serial.publicationStartYear}`;

      // 出版年结束
      if (serial.publicationEndYear !== undefined) {
        pubInfo += `—${serial.publicationEndYear}`;
      } else {
        pubInfo += '—';
      }

      parts.push(pubInfo + '.');
    }

    if (serial.url) {
      parts.push(serial.url);
    }

    const pid = this.pidSuffix(serial.pid, serial.url);
    if (pid) {
      parts.push(pid);
    }

    return parts.join(' ');
  }
}
