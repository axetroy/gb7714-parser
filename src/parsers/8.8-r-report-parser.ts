import type { Token } from '../types/index.js';
import type { Report, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 报告解析器
 *
 * 解析格式：`[序号] 作者. 题名: 报告编号[R]. 发布日期: 页码.`
 *
 * @example
 * ```typescript
 * const input = '[1] 王五. 2023年人工智能发展报告: TR-2023-001[R]. 2023-12-01.';
 * const { reference } = parse(input);
 * // reference.type === 'R'
 * // reference.authors === [{ name: '王五' }]
 * // reference.title === '2023年人工智能发展报告'
 * // reference.reportNumber === 'TR-2023-001'
 * // reference.releaseDate === '2023-12-01'
 * ```
 */
export class ReportParser extends BaseParser {
  /**
   * 检查是否匹配报告格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是报告 [R] 或 [R/OL]
    return /^\[(R|R\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析报告文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Report {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者、题名和报告编号（到文献类型标识 [R]）
    const { authors, title, extraField: reportNumber, subtitle, position: _afterTitle } = this.parseTitleWithPrefix(tokens, position);

    // 跳过文献类型标识 [R]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析发布日期
    let releaseDate = '';
    const dateToken = tokens.slice(position).find(t => t.type === 'DATE' || t.type === 'YEAR');
    if (dateToken) {
      releaseDate = dateToken.value;
      position = tokens.indexOf(dateToken) + 1;
    }

    // 解析页码（如果有）
    const { pages } = this.parsePages(tokens, position);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    // 解析 URL
    const url = this.parseURL(tokens);

    return {
      type: 'R' as never,
      authors,
      
      title,
      subtitle: subtitle || undefined,
      reportNumber: reportNumber || undefined,
      releaseDate: releaseDate || undefined,
      pages: pages || undefined,
      url: url || undefined,
      pid: pid || undefined,
      mediaType,
    };
  }
}
