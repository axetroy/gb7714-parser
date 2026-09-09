import type { Token, Author } from '../types/index.js';
import type { WebPage, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors, readUntilTypeIndicator, findNextDot } from '../utils/index.js';

/**
 * 网站/网页解析器
 * 解析格式：[1] 作者. 题名[EB/OL]. (创建日期)[引用日期]. URL.
 */
export class WebPageParser implements ParserStrategy {
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
    if (tokens[position]?.type === 'BRACKET_OPEN') {
      position++;
      while (position < tokens.length && tokens[position]?.type !== 'BRACKET_CLOSE') {
        position++;
      }
      position++; // 跳过 ]
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者（如果有）
    let authors: Author[] = [];
    const dotIndex = findNextDot(tokens, position);
    if (dotIndex > position) {
      // 检查点号前是否可能是作者（包含逗号分隔的多个作者）
      const beforeDot = this.readTextUntil(tokens, position, dotIndex);
      if (beforeDot.includes(',') || beforeDot.includes('，') || /^[\u4e00-\u9fa5]+$/.test(beforeDot.trim())) {
        authors = parseAuthors(beforeDot);
        position = dotIndex + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名（到文献类型标识 [EB]）
    const titleText = readUntilTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识 [EB]
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    let mediaType: import('../types/index.js').MediaType | undefined;
    if (typeIndicator) {
      const parsed = parseTypeIndicator(typeIndicator.value);
      mediaType = parsed.mediaType;
      position = tokens.indexOf(typeIndicator) + 1;
    }

    // 跳过 . 
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析创建日期（如果有，格式为 (YYYY-MM-DD)）
    let createDate = '';
    const createDateMatch = this.readTextUntilNextBracket(tokens, position);
    if (createDateMatch) {
      createDate = createDateMatch;
      position = this.findNextBracket(tokens, position) + 1;
    }

    // 解析引用日期（格式为 [YYYY-MM-DD]）
    let accessDate = '';
    const accessDateMatch = this.readTextUntilNextBracket(tokens, position);
    if (accessDateMatch) {
      accessDate = accessDateMatch;
      position = this.findNextBracket(tokens, position) + 1;
    }

    // 跳过 . 
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析 URL
    let url = '';
    const urlToken = tokens.find(t => t.type === 'URL');
    if (urlToken) {
      url = urlToken.value.replace(/\.$/, '');
    }

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

    return {
      type: 'EB' as never,
      authors,
      title,
      createDate: createDate || undefined,
      accessDate,
      url,
      pid: pid || undefined,
      mediaType,
    };
  }

  private skipWhitespace(tokens: Token[], position: number): number {
    while (position < tokens.length && tokens[position]?.type === 'TEXT' && tokens[position]?.value.trim() === '') {
      position++;
    }
    return position;
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

  private readTextUntil(tokens: Token[], start: number, end: number): string {
    let result = '';
    for (let i = start; i < end; i++) {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'DOT') {
        result += '.';
      } else if (token.type === 'DATE') {
        result += token.value;
      }
    }
    return result;
  }

}
