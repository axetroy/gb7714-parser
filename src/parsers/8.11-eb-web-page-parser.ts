import type { Token } from '../types/index.js';
import type { WebPage, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 网站/网页解析器
 *
 * 解析格式：`[序号] 作者. 题名[EB/OL]. (创建日期)[引用日期]. URL.`
 *
 * @example
 * ```typescript
 * const input = '[1] 张三. 人工智能技术发展概述[EB/OL]. (2023-01-15)[2023-12-01]. https://example.com/ai.';
 * const { reference } = parse(input);
 * // reference.type === 'EB'
 * // reference.authors === [{ name: '张三' }]
 * // reference.title === '人工智能技术发展概述'
 * // reference.createDate === '2023-01-15'
 * // reference.accessDate === '2023-12-01'
 * // reference.url === 'https://example.com/ai'
 * ```
 */
export class WebPageParser extends BaseParser {
  /**
   * 检查是否匹配网站/网页格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是网站/网页 [EB] 或 [EB/OL]
    return /^\[(EB|EB\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析网站/网页文献
   */
  parse(tokens: Token[], _options?: ParseOptions): WebPage {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    const { authors, truncated, authorComma, subtitleSeparator: _subtitleSeparator, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position, true);
    position = afterTitle;

    // 跳过文献类型标识 [EB]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析创建日期（如果有，格式为 (YYYY-MM-DD)）
    let createDate = '';
    const parenOpenIndex = this.findNextBracket(tokens, position);
    if (parenOpenIndex < tokens.length && tokens[parenOpenIndex]?.type === 'PAREN_OPEN') {
      createDate = this.readTextUntilNextBracket(tokens, parenOpenIndex + 1);
      position = this.findNextBracket(tokens, parenOpenIndex + 1) + 1;
    }

    // 解析引用日期（格式为 [YYYY-MM-DD]）
    let accessDate = '';
    const bracketOpenIndex = this.findNextBracket(tokens, position);
    if (bracketOpenIndex < tokens.length && tokens[bracketOpenIndex]?.type === 'BRACKET_OPEN') {
      accessDate = this.readTextUntilNextBracket(tokens, bracketOpenIndex + 1);
      position = this.findNextBracket(tokens, bracketOpenIndex + 1) + 1;
    }

    // 跳过 .
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析 URL
    const urlToken = tokens.find(t => t.type === 'URL');
    const url = urlToken?.value?.replace(/\.$/, '') || '';

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'EB' as never,
      authors,
      authorsTruncated: truncated || undefined,
      title,
      subtitle,
      createDate: createDate || undefined,
      accessDate,
      url,
      pid: pid || undefined,
      mediaType,
      authorComma: authorComma || undefined,
    };
  }

  private findNextBracket(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'PAREN_OPEN' || tokens[i]?.type === 'BRACKET_OPEN') return i;
    }
    return tokens.length;
  }

  private readTextUntilNextBracket(tokens: Token[], start: number): string {
    let result = '';
    let i = start;
    while (i < tokens.length) {
      const token = tokens[i]!;
      if (token.type === 'PAREN_OPEN' || token.type === 'BRACKET_OPEN') {
        break;
      }
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'DATE') {
        result += token.value;
      }
      i++;
    }
    return result;
  }
}
