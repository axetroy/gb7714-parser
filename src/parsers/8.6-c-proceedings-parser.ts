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
    const { authors, truncated, authorComma, subtitleSeparator, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [C]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 判断是析出文献形式（有 //）还是图书形式（无 //）
    const hasDoubleSlash = tokens[position]?.type === 'DOUBLE_SLASH';

    if (hasDoubleSlash) {
      // 析出文献形式：[C]//会议名称, 会议年份: 页码
      position++; // 跳过 //
      position = this.skipWhitespace(tokens, position);

      // 先找最后一个 COLON（页码前的冒号），再找它之前的最后一个 YEAR
      // 这样可以正确处理会议名称以年份开头的情况（如 "//2022 6th Asian Conference..."）
      const lastColonIndex = tokens.reduce(
        (last, t, i) => (t.type === 'COLON' ? i : last),
        -1,
      );
      const allYears = tokens
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.type === 'YEAR')
        .filter(({ i }) => lastColonIndex < 0 || i < lastColonIndex);
      const lastYearInfo = allYears.length > 0 ? allYears[allYears.length - 1] : null;

      // 会议名称：从 // 后到会议年份 token 之前
      // 使用 readTextUntil 确保正确保留空格和数字
      let conferenceName = '';
      if (lastYearInfo) {
        conferenceName = this.readTextUntil(tokens, position, lastYearInfo.i);
        position = lastYearInfo.i + 1;
      } else {
        // 没有年份，回退到 readUntilCommaOrYear
        conferenceName = this.readUntilCommaOrYear(tokens, position);
        position = this.findNextCommaOrYear(tokens, position);
      }

      // 会议年份
      const conferenceYear = lastYearInfo?.t.value ?? '';

      // 跳过空白
      position = this.skipWhitespace(tokens, position);

      // 解析页码
      const { pages } = this.parsePages(tokens, position);

      // 解析 URL
      const url = this.parseURL(tokens);

      return {
        type: 'C' as never,
        mediaType,
        authors,
        authorsTruncated: truncated || undefined,
        title,
        subtitle,
        conferenceName: conferenceName.trim().replace(/,$/, '') || undefined,
        conferenceYear: conferenceYear || undefined,
        subtitleSeparator: subtitleSeparator || undefined,
        pages: pages || undefined,
        url: url || undefined,
        authorComma: authorComma || undefined,
      };
    } else {
      // 图书形式：[C]. 出版地: 出版者, 年
      // 调用 parsePublisherInfo 解析出版信息
      const { publisherPlace, publisher, year, position: afterPublisher } = this.parsePublisherInfo(tokens, position);

      // 解析页码
      const { pages } = this.parsePages(tokens, afterPublisher);

      // 解析 URL
      const url = this.parseURL(tokens);

      return {
        type: 'C' as never,
        mediaType,
      authorComma: authorComma || undefined,
        authors,
      authorsTruncated: truncated || undefined,
        title,
        subtitle,
        publisherPlace: publisherPlace || undefined,
        publisher: publisher || undefined,
        year: year || undefined,
        subtitleSeparator: subtitleSeparator || undefined,
        pages: pages || undefined,
        url: url || undefined,
      };
    }
  }
}
