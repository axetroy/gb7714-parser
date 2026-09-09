import type { Token } from '../types/index.js';
import type { Proceedings, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 会议录解析器
 *
 * 解析格式：`[序号] 作者. 题名[C]//会议名称, 会议年份: 页码.`
 *
 * @example
 * ```typescript
 * const input = '[1] 李华. 人工智能的发展与挑战[C]//全国计算机学术会议, 2023: 45-50.';
 * const { reference } = parse(input);
 * // reference.type === 'C'
 * // reference.authors === [{ name: '李华' }]
 * // reference.title === '人工智能的发展与挑战'
 * // reference.conferenceName === '全国计算机学术会议'
 * // reference.conferenceYear === '2023'
 * // reference.pages === '45-50'
 * ```
 */
export class ProceedingsParser extends BaseParser {
  /**
   * 检查是否匹配会议录格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是会议录 [C] 或 [C/OL]
    return /^\[(C|C\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析会议录文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Proceedings {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    const { authors, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [C]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 跳过 //（如果有）
    if (tokens[position]?.type === 'DOUBLE_SLASH') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析会议名称（到 , 或年份）
    const conferenceName = this.readUntilCommaOrYear(tokens, position);
    position = this.findNextCommaOrYear(tokens, position);

    // 解析会议年份
    let conferenceYear = '';
    const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
    if (yearToken) {
      conferenceYear = yearToken.value;
      position = tokens.indexOf(yearToken) + 1;
    }

    // 解析页码（如果有）
    const { pages } = this.parsePages(tokens, position);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'C' as never,
      authors,
      title,
      subtitle,
      conferenceName: conferenceName.trim().replace(/\.$/, '') || undefined,
      conferenceYear: conferenceYear || undefined,
      pages: pages || undefined,
      pid: pid || undefined,
      mediaType,
    };
  }
}
