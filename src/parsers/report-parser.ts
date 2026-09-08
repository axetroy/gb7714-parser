import type { Token } from '../types/index.js';
import type { Report, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';

/**
 * 报告解析器
 * 解析格式：[1] 作者. 题名: 报告编号[R]. 发布日期: 页码.
 */
export class ReportParser implements ParserStrategy {
  /**
   * 检查是否匹配报告格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是报告 [R] 或 [R/OL]
    return /^\[(R|R\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析报告文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Report {
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

    // 解析作者
    const authorsText = this.readUntilDot(tokens, position);
    position = this.findNextDot(tokens, position) + 1;
    const authors = this.parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名和报告编号（到文献类型标识 [R]）
    let title = '';
    let reportNumber = '';
    const titleEnd = this.findNextTypeIndicator(tokens, position);
    
    // 查找冒号来分离题名和报告编号
    const colonIndex = tokens.findIndex((t, i) => i >= position && i < titleEnd && (t.value === ':' || t.value === '：'));
    
    if (colonIndex >= position && colonIndex < titleEnd) {
      title = this.readTextUntil(tokens, position, colonIndex).trim().replace(/\.$/, '');
      position = colonIndex + 1;
      reportNumber = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      position = titleEnd;
    } else {
      title = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      position = titleEnd;
    }

    // 跳过文献类型标识 [R]
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (typeIndicator) {
      position = tokens.indexOf(typeIndicator) + 1;
    }

    // 跳过 . 
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析发布日期
    let releaseDate = '';
    const dateToken = tokens.slice(position).find(t => t.type === 'DATE' || t.type === 'YEAR');
    if (dateToken) {
      releaseDate = dateToken.value;
      position = tokens.indexOf(dateToken) + 1;
    }

    // 解析页码（如果有）
    let pages = '';
    const colonIndex2 = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex2 >= position) {
      position = colonIndex2 + 1;
      const pageTokens = tokens.slice(position).filter(t =>
        t.type === 'NUMBER' || t.type === 'DASH' || t.type === 'TEXT'
      );
      if (pageTokens.length > 0) {
        pages = pageTokens.map(t => t.value).join('').replace(/\.$/, '');
      }
    }

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

    return {
      type: 'R' as never,
      authors,
      title,
      reportNumber: reportNumber || undefined,
      releaseDate: releaseDate || undefined,
      pages: pages || undefined,
      pid: pid || undefined,
    };
  }

  private skipWhitespace(tokens: Token[], position: number): number {
    while (position < tokens.length && tokens[position]?.type === 'TEXT' && tokens[position]?.value.trim() === '') {
      position++;
    }
    return position;
  }

  private readUntilDot(tokens: Token[], start: number): string {
    let result = '';
    let i = start;
    while (i < tokens.length && tokens[i]?.type !== 'DOT') {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'COMMA') {
        result += ',';
      } else if (token.type === 'NUMBER') {
        result += token.value;
      }
      i++;
    }
    return result;
  }

  private findNextDot(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'DOT') return i;
    }
    return tokens.length;
  }

  private findNextTypeIndicator(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'TYPE_INDICATOR') return i;
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
      } else if (token.type === 'COLON') {
        result += ':';
      }
    }
    return result;
  }

  private parseAuthors(text: string): { surname: string; givenName?: string }[] {
    const parts = text.split(/[,，]/);
    return parts.map(part => {
      const name = part.trim();
      if (/^[\u4e00-\u9fa5]+$/.test(name)) {
        return { surname: name };
      }
      const spaceParts = name.split(/\s+/);
      if (spaceParts.length >= 2) {
        return {
          surname: spaceParts[spaceParts.length - 1]!,
          givenName: spaceParts.slice(0, -1).join(' '),
        };
      }
      return { surname: name };
    });
  }
}
