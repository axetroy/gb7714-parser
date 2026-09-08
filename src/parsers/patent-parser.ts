import type { Token } from '../types/index.js';
import type { Patent, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';

/**
 * 专利解析器
 * 解析格式：[1] 发明人. 题名: 专利申请号[P]. 公告日期.
 */
export class PatentParser implements ParserStrategy {
  /**
   * 检查是否匹配专利格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是专利 [P] 或 [P/OL]
    return /^\[(P|P\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析专利文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Patent {
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

    // 解析发明人
    const authorsText = this.readUntilDot(tokens, position);
    position = this.findNextDot(tokens, position) + 1;
    const authors = this.parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名和专利申请号（到文献类型标识 [P]）
    let title = '';
    let patentNumber = '';
    const titleEnd = this.findNextTypeIndicator(tokens, position);
    
    // 查找冒号来分离题名和专利申请号
    const colonIndex = tokens.findIndex((t, i) => i >= position && i < titleEnd && (t.value === ':' || t.value === '：'));
    
    if (colonIndex >= position && colonIndex < titleEnd) {
      title = this.readTextUntil(tokens, position, colonIndex).trim().replace(/\.$/, '');
      position = colonIndex + 1;
      patentNumber = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      position = titleEnd;
    } else {
      title = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      position = titleEnd;
    }

    // 跳过文献类型标识 [P]
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

    // 解析公告日期
    let announceDate = '';
    const dateToken = tokens.slice(position).find(t => t.type === 'DATE');
    if (dateToken) {
      announceDate = dateToken.value;
      position = tokens.indexOf(dateToken) + 1;
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
      type: 'P' as never,
      authors,
      title,
      patentNumber: patentNumber || '',
      announceDate: announceDate || undefined,
      url,
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
