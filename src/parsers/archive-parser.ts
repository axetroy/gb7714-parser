import type { Token, Author } from '../types/index.js';
import type { Archive, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors, findNextDot, findNextTypeIndicator } from '../utils/index.js';

/**
 * 档案解析器
 * 解析格式：[1] 作者. 题名: 档号[A]. 收藏者所在地: 收藏者, 形成日期.
 */
export class ArchiveParser implements ParserStrategy {
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

    // 解析题名和档号（到文献类型标识 [A]）
    let title = '';
    let archiveNumber = '';
    const titleEnd = findNextTypeIndicator(tokens, position);
    
    // 查找冒号来分离题名和档号
    const colonIndex = tokens.findIndex((t, i) => i >= position && i < titleEnd && (t.value === ':' || t.value === '：'));
    
    if (colonIndex >= position && colonIndex < titleEnd) {
      title = this.readTextUntil(tokens, position, colonIndex).trim().replace(/\.$/, '');
      position = colonIndex + 1;
      archiveNumber = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      position = titleEnd;
    } else {
      title = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      position = titleEnd;
    }

    // 跳过文献类型标识 [A]
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

    // 解析 URL（如果有）
    let url: string | undefined;
    const urlToken = tokens.find(t => t.type === 'URL');
    if (urlToken) {
      url = urlToken.value.replace(/\.$/, '');
    }

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

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

  private skipWhitespace(tokens: Token[], position: number): number {
    while (position < tokens.length && tokens[position]?.type === 'TEXT' && tokens[position]?.value.trim() === '') {
      position++;
    }
    return position;
  }

  private readTextUntil(tokens: Token[], start: number, end: number): string {
    let result = '';
    let lastEndPosition = -1;
    for (let i = start; i < end; i++) {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
          result += ' ';
        }
        result += token.value;
        lastEndPosition = token.position + token.value.length;
      } else if (token.type === 'DOT') {
        result += '.';
        lastEndPosition = token.position + 1;
      } else if (token.type === 'COLON') {
        result += ':';
        lastEndPosition = token.position + 1;
      } else if (token.type === 'COMMA') {
        result += ',';
        lastEndPosition = token.position + 1;
      } else if (token.type === 'DATE') {
        result += token.value;
        lastEndPosition = token.position + token.value.length;
      }
    }
    return result;
  }

}
