import type { Token } from '../types/index.js';
import type { Archive, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 档案解析器
 *
 * 解析格式：`[序号] 作者. 题名: 档号[A]. 收藏者所在地: 收藏者, 形成日期.`
 *
 * @example
 * ```typescript
 * const input = '[1] 历史研究所. 民国时期教育档案: A001-001[A]. 北京: 中国第一历史档案馆, 1935-1945.';
 * const { reference } = parse(input);
 * // reference.type === 'A'
 * // reference.authors === [{ name: '历史研究所' }]
 * // reference.title === '民国时期教育档案'
 * // reference.archiveNumber === 'A001-001'
 * // reference.collectionPlace === '北京'
 * // reference.collector === '中国第一历史档案馆'
 * // reference.formedDate === '1935-1945'
 * ```
 */
export class ArchiveParser extends BaseParser {
  /**
   * 检查是否匹配档案格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是档案 [A] 或 [A/OL]
    return /^\[(A|A\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析档案文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Archive {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者、题名和档号（到文献类型标识 [A]）
    const { authors, title, extraField: archiveNumber, position: _afterTitle } = this.parseTitleWithPrefix(tokens, position, true);

    // 跳过文献类型标识 [A]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析收藏者信息（收藏者所在地: 收藏者, 形成日期）
    let collectionPlace = '';
    let collector = '';
    let formedDate = '';

    // 查找冒号
    const colonIndex2 = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex2 >= position) {
      collectionPlace = this.readTextUntil(tokens, position, colonIndex2).trim();
      position = colonIndex2 + 1;

      // 查找逗号
      const commaIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
      if (commaIndex >= position) {
        collector = this.readTextUntil(tokens, position, commaIndex).trim();
        position = commaIndex + 1;

        // 解析形成日期
        const dateToken = tokens.slice(position).find(t => t.type === 'DATE' || t.type === 'YEAR');
        if (dateToken) {
          formedDate = dateToken.value;
          position = tokens.indexOf(dateToken) + 1;
        }
      } else {
        collector = this.readTextUntil(tokens, position, tokens.length).trim();
      }
    }

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'A' as never,
      authors,
      title,
      archiveNumber: archiveNumber || undefined,
      collectionPlace: collectionPlace || undefined,
      collector: collector || undefined,
      formedDate: formedDate || undefined,
      url,
      pid: pid || undefined,
      mediaType,
    };
  }
}
