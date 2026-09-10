import type { Token } from '../types/index.js';
import type { Dataset, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 数据集解析器
 *
 * 解析格式：`[序号] 作者. 题名[DS/OL]. 版本. 发布平台 (发布日期)[引用日期]. URL.`
 *
 * @example
 * ```typescript
 * const input = '[1] 中国科学院. 中国气候数据集[DS/OL]. V1. 国家气象数据中心 (2023-06-15)[2023-12-01]. https://data.cma.cn.';
 * const { reference } = parse(input);
 * // reference.type === 'DS'
 * // reference.authors === [{ name: '中国科学院' }]
 * // reference.title === '中国气候数据集'
 * // reference.version === 'V1'
 * // reference.platform === '国家气象数据中心'
 * // reference.releaseDate === '2023-06-15'
 * // reference.accessDate === '2023-12-01'
 * // reference.url === 'https://data.cma.cn'
 * ```
 */
export class DatasetParser extends BaseParser {
  /**
   * 检查是否匹配数据集格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是数据集 [DS] 或 [DS/OL]
    return /^\[(DS|DS\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析数据集文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Dataset {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    const { authors, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [DS]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析版本（如果有）
    let version: string | undefined;
    const versionEnd = this.findNextDot(tokens, position);
    if (versionEnd > position) {
      const versionText = this.readTextUntil(tokens, position, versionEnd).trim();
      if (versionText && !versionText.includes('(') && !versionText.includes('（')) {
        version = versionText;
        position = versionEnd + 1;
        // 处理版本号含小数点的情况（如 V1.0 → TEXT("V1") DOT NUMBER("0")）
        if (tokens[position]?.type === 'NUMBER' && /^\d/.test(tokens[position]!.value)) {
          version += '.' + tokens[position]!.value.replace(/\.$/, '');
          position++;
        }
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析发布平台和发布日期
    let platform = '';
    let releaseDate = '';

    // 查找发布平台（到左括号或左方括号）
    const platformEnd = this.findNextParenOrBracket(tokens, position);
    if (platformEnd > position) {
      platform = this.readTextUntil(tokens, position, platformEnd).trim().replace(/\.$/, '');
      position = platformEnd;
    }

    // 解析发布日期（如果有，格式为 (YYYY-MM-DD)）
    if (tokens[position]?.type === 'PAREN_OPEN') {
      position++; // 跳过 (
      const dateEnd = tokens.findIndex((t, i) => i > position && t.type === 'PAREN_CLOSE');
      if (dateEnd > position) {
        releaseDate = this.readTextUntil(tokens, position, dateEnd).trim();
        position = dateEnd + 1;
      }
    }

    // 解析引用日期（格式为 [YYYY-MM-DD]）
    let accessDate = '';
    if (tokens[position]?.type === 'BRACKET_OPEN') {
      position++; // 跳过 [
      const dateEnd = tokens.findIndex((t, i) => i > position && t.type === 'BRACKET_CLOSE');
      if (dateEnd > position) {
        accessDate = this.readTextUntil(tokens, position, dateEnd).trim();
        position = dateEnd + 1;
      }
    }

    // 跳过 .
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'DS' as never,
      authors,
      title,
      subtitle,
      version,
      platform: platform || undefined,
      releaseDate: releaseDate || undefined,
      accessDate,
      url,
      pid: pid || undefined,
      mediaType,
    };
  }

  private findNextParenOrBracket(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'PAREN_OPEN' || tokens[i]?.type === 'BRACKET_OPEN') return i;
    }
    return tokens.length;
  }
}
