import type { Token } from '../types/index.js';
import type { Preprint, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 预印本解析器
 *
 * 解析格式：`[序号] 作者. 题名[PP/OL]. 版本. 出版平台 (创建日期)[引用日期]. URL.`
 *
 * @example
 * ```typescript
 * const input = '[1] 李明. 基于大语言模型的代码生成研究[PP/OL]. V1. arXiv (2023-10-01)[2023-12-01]. https://arxiv.org/abs/2310.00001.';
 * const { reference } = parse(input);
 * // reference.type === 'PP'
 * // reference.authors === [{ name: '李明' }]
 * // reference.title === '基于大语言模型的代码生成研究'
 * // reference.version === 'V1'
 * // reference.platform === 'arXiv'
 * // reference.createDate === '2023-10-01'
 * // reference.accessDate === '2023-12-01'
 * // reference.url === 'https://arxiv.org/abs/2310.00001'
 * ```
 */
export class PreprintParser extends BaseParser {
  /**
   * 检查是否匹配预印本格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是预印本 [PP] 或 [PP/OL]
    return /^\[(PP|PP\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析预印本文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Preprint {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    const { authors, title, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position, true);
    position = afterTitle;

    // 跳过文献类型标识 [PP]
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
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析出版平台和创建日期
    let _platform = '';
    let _createDate = '';

    // 查找出版平台（到左括号或左方括号）
    const platformEnd = this.findNextParenOrBracket(tokens, position);
    if (platformEnd > position) {
      _platform = this.readTextUntil(tokens, position, platformEnd).trim().replace(/\.$/, '');
      position = platformEnd;
    }

    // 解析创建日期（如果有，格式为 (YYYY-MM-DD)）
    if (tokens[position]?.type === 'PAREN_OPEN') {
      position++; // 跳过 (
      const dateEnd = tokens.findIndex((t, i) => i > position && t.type === 'PAREN_CLOSE');
      if (dateEnd > position) {
        _createDate = this.readTextUntil(tokens, position, dateEnd).trim();
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
      type: 'PP' as never,
      authors,
      title,
      version,
      platform: _platform || undefined,
      createDate: _createDate || undefined,
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
