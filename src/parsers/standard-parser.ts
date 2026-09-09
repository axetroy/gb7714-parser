import type { Token } from '../types/index.js';
import type { Standard, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 标准解析器
 *
 * 解析格式：`[序号] 标准编号 标准名称[S].`
 *
 * @example
 * ```typescript
 * const input = '[1] GB/T 3792—2021 信息与文献馆藏操作 注册[S].';
 * const { reference } = parse(input);
 * // reference.type === 'S'
 * // reference.standardNumber === 'GB/T 3792—2021'
 * // reference.standardName === '信息与文献馆藏操作 注册'
 * ```
 *
 * @example
 * ```typescript
 * // 在线标准
 * const input = '[2] ISO 1234:2023 质量管理体系[S/OL]. https://example.com/iso1234.';
 * const { reference } = parse(input);
 * // reference.mediaType === 'OL'
 * // reference.url === 'https://example.com/iso1234'
 * ```
 */
export class StandardParser extends BaseParser {
  /**
   * 检查是否匹配标准格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是标准 [S] 或 [S/OL]
    return /^\[(S|S\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析标准文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Standard {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析标准编号和标准名称（到文献类型标识 [S]）
    let standardNumber = '';
    let standardName = '';
    const titleEnd = this.findNextTypeIndicator(tokens, position);

    // 查找标准编号（通常以 GB/T、GB 等开头）
    const fullText = this.readTextUntil(tokens, position, titleEnd);

    // 匹配标准编号格式（在全文中搜索）
    const standardNumberMatch = fullText.match(/((?:GB|ISO|IEC|行业标准代码)[\/\s]*[A-Z]*(?:\s*[:\uff1a]\s*)?[\d\u2014\-\.]+(?:\s*[:\uff1a]\s*\d+)?(?:[\—\-]*\d+)*)/i);
    if (standardNumberMatch) {
      standardNumber = standardNumberMatch[1].trim();
      standardName = fullText.replace(standardNumberMatch[0], '').replace(/^\s*[:\uff1a]\s*/, '').trim();
    } else {
      // 如果没有匹配到标准编号格式，尝试用空格分割
      const spaceIndex = fullText.indexOf(' ');
      if (spaceIndex > 0) {
        standardNumber = fullText.slice(0, spaceIndex).trim();
        standardName = fullText.slice(spaceIndex + 1).trim();
      } else {
        standardNumber = fullText.trim();
      }
    }

    position = titleEnd;

    // 跳过文献类型标识 [S]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'S' as never,
      authors: [],
      title: standardName || standardNumber,
      standardNumber,
      standardName: standardName || standardNumber,
      url,
      pid: pid || undefined,
      mediaType,
    };
  }
}
