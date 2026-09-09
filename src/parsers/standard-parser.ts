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
    // 标准编号格式：以 GB/ISO/IEC 等开头，后跟编号和年份，如 GB/T 3792—2021
    let standardNumber = '';
    let standardName = '';
    const titleEnd = this.findNextTypeIndicator(tokens, position);

    // 收集标准编号和标准名称：找到首个已知前缀（GB/ISO/IEC 等）的 token，
    // 从其开始收集直到遇到中文 token 或类型标识为止
    const knownPrefixes = ['GB', 'ISO', 'IEC', 'JB', 'HG', 'YD', 'DL', 'NY', 'NB', 'WB', 'CJ', 'DB', 'SB', 'SN'];
    let scanPos = position;
    let numberTokens: Token[] = [];
    let foundPrefix = false;

    while (scanPos < titleEnd) {
      const t = tokens[scanPos]!;
      if (!foundPrefix) {
        // 寻找已知前缀 token（允许前缀出现在任何位置，包括标题之后）
        if (t.type === 'TEXT' && knownPrefixes.some(p => t.value.toUpperCase().startsWith(p))) {
          foundPrefix = true;
          numberTokens.push(t);
          scanPos++;
          continue;
        }
        // 跳过中文、标点等无关 token，继续寻找前缀
        scanPos++;
        continue;
      }
      // foundPrefix 后：继续收集编号部分
      if (
        t.type === 'TEXT' ||
        t.type === 'SLASH' ||
        t.type === 'YEAR' ||
        t.type === 'NUMBER' ||
        t.type === 'DASH' ||
        t.type === 'COLON' ||
        t.type === 'DOT'
      ) {
        // 遇到中文 token 表示编号结束
        if (/[\u4e00-\u9fa5]/.test(t.value)) break;
        numberTokens.push(t);
        scanPos++;
      } else {
        break;
      }
    }
    // 拼接时根据 token 位置补回缺失的空格
    standardNumber = '';
    let lastEnd = -1;
    for (const tok of numberTokens) {
      if (lastEnd >= 0 && tok.position > lastEnd) standardNumber += ' ';
      standardNumber += tok.value;
      lastEnd = tok.position + tok.value.length;
    }

    // 剩余部分为标准名称（扫描位置之后的中文 TEXT）
    if (scanPos < titleEnd) {
      const nameTokens = tokens.slice(scanPos, titleEnd).filter(t => t.type === 'TEXT' && /[\u4e00-\u9fa5]/.test(t.value));
      standardName = nameTokens.map(t => t.value).join(' ').trim();
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
