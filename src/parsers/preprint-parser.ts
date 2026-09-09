import type { Token, Author } from '../types/index.js';
import type { Preprint, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors, readUntilTypeIndicator, findNextDot } from '../utils/index.js';

/**
 * 预印本解析器
 * 解析格式：[1] 作者. 题名[PP/OL]. 版本. 出版平台 (创建日期)[引用日期]. URL.
 */
export class PreprintParser implements ParserStrategy {
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
      const beforeDot = this.readTextUntil(tokens, position, dotIndex);
      if (beforeDot.includes(',') || beforeDot.includes('，') || /^[\u4e00-\u9fa5]+$/.test(beforeDot.trim())) {
        authors = parseAuthors(beforeDot);
        position = dotIndex + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名（到文献类型标识 [PP]）
    const titleText = readUntilTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识 [PP]
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

    // 解析版本（如果有）
    let version: string | undefined;
    const versionEnd = findNextDot(tokens, position);
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
    let url = '';
    const urlToken = tokens.find(t => t.type === 'URL');
    if (urlToken) {
      url = urlToken.value.replace(/\.$/, '');
    }

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

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

  private skipWhitespace(tokens: Token[], position: number): number {
    while (position < tokens.length && tokens[position]?.type === 'TEXT' && tokens[position]?.value.trim() === '') {
      position++;
    }
    return position;
  }


  private findNextParenOrBracket(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'PAREN_OPEN' || tokens[i]?.type === 'BRACKET_OPEN') return i;
    }
    return tokens.length;
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
