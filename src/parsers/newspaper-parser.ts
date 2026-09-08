import type { Token } from '../types/index.js';
import type { Newspaper, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';

/**
 * 报纸解析器
 * 解析格式：[1] 作者. 题名[N]. 报纸名, 出版地(可选), 出版日期: 版次(可选).
 */
export class NewspaperParser implements ParserStrategy {
  /**
   * 检查是否匹配报纸格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是报纸 [N] 或 [N/OL]
    return /^\[(N|N\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析报纸文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Newspaper {
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

    // 解析题名
    const titleText = this.readUntilTypeIndicator(tokens, position);
    position = this.findNextTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识 [N]
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

    // 解析报纸名（到 , 或 年份）
    position = this.findNextCommaOrYear(tokens, position);

    // 解析年份
    let year = '';
    const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
    if (yearToken) {
      year = yearToken.value;
      position = tokens.indexOf(yearToken) + 1;
    }

    // 解析月日（跳过）
    const monthDayTokens = tokens.slice(position).filter(t =>
      t.type === 'NUMBER' || t.type === 'DASH' || t.type === 'TEXT'
    );
    if (monthDayTokens.length > 0) {
      position += monthDayTokens.length;
    }

    // 解析版次
    let pages = '';
    const colonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex >= position) {
      position = colonIndex + 1;
      const pageTokens = tokens.slice(position).filter(t =>
        t.type === 'NUMBER' || t.type === 'TEXT'
      );
      if (pageTokens.length > 0) {
        pages = pageTokens.map(t => t.value).join('').replace(/\.$/, '');
      }
    }

    // 解析 URL
    const urlToken = tokens.find(t => t.type === 'URL');
    const url = urlToken?.value;

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

    return {
      type: 'N' as never,
      authors,
      title,
      newspaperTitle: '',
      year: year || '',
      pages: pages || undefined,
      url: url || undefined,
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

  private readUntilTypeIndicator(tokens: Token[], start: number): string {
    let result = '';
    let i = start;
    while (i < tokens.length && tokens[i]?.type !== 'TYPE_INDICATOR') {
      if (tokens[i]?.type === 'TEXT') {
        result += tokens[i]!.value;
      } else if (tokens[i]?.type === 'DOT') {
        result += '.';
      }
      i++;
    }
    return result;
  }

  private findNextTypeIndicator(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'TYPE_INDICATOR') return i;
    }
    return tokens.length;
  }

  private findNextCommaOrYear(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'COMMA' || tokens[i]?.type === 'YEAR') return i;
    }
    return tokens.length;
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
