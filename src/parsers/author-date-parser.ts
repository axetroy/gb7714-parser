import type { Token } from '../types/index.js';
import type { Reference, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';

/**
 * 著者-出版年制解析器
 * 解析格式：(作者, 年). 题名[J]. 刊名, 卷(期): 页码.
 */
export class AuthorDateParser implements ParserStrategy {
  /**
   * 检查是否匹配著者-出版年制格式
   * 特征：以 ( 开头，包含作者和年份
   */
  match(tokens: Token[]): boolean {
    // 著者-出版年制以 ( 开头
    if (tokens.length === 0 || tokens[0]?.type !== 'PAREN_OPEN') {
      return false;
    }

    // 查找匹配的 )
    let depth = 0;
    for (const token of tokens) {
      if (token.type === 'PAREN_OPEN') depth++;
      if (token.type === 'PAREN_CLOSE') depth--;
      if (depth === 0) break;
    }

    // 检查括号内是否有逗号和年份
    const parenContent = this.getParenContent(tokens);
    if (!parenContent) return false;

    // 检查是否包含逗号
    const hasComma = parenContent.some(t => t.type === 'COMMA');
    // 检查是否包含年份
    const hasYear = parenContent.some(t => t.type === 'YEAR');

    return hasComma && hasYear;
  }

  /**
   * 获取括号内容
   */
  private getParenContent(tokens: Token[]): Token[] | null {
    if (tokens[0]?.type !== 'PAREN_OPEN') return null;

    let depth = 0;
    const content: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;
      if (token.type === 'PAREN_OPEN') {
        depth++;
        if (depth > 1) content.push(token);
      } else if (token.type === 'PAREN_CLOSE') {
        depth--;
        if (depth === 0) return content;
        content.push(token);
      } else {
        content.push(token);
      }
    }

    return null;
  }

  /**
   * 解析著者-出版年制文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Reference {
    let position = 0;

    // 跳过序号 [1]（如果有的话）
    if (tokens[position]?.type === 'BRACKET_OPEN') {
      position++;
      while (position < tokens.length && tokens[position]?.type !== 'BRACKET_CLOSE') {
        position++;
      }
      position++; // 跳过 ]
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和年份 (作者, 年)
    let authors: { surname: string; givenName?: string }[] = [];
    let year = '';

    if (tokens[position]?.type === 'PAREN_OPEN') {
      position++; // 跳过 (

      // 读取括号内容直到 )
      let depth = 1;
      const parenContent: string[] = [];
      while (position < tokens.length && depth > 0) {
        const token = tokens[position]!;
        if (token.type === 'PAREN_OPEN') depth++;
        if (token.type === 'PAREN_CLOSE') depth--;
        if (depth === 0) break;

        if (token.type === 'COMMA') {
          // 逗号可能是作者分隔符或作者与年份的分隔符
          // 检查后面是否是年份
          const nextToken = tokens[position + 1];
          if (nextToken?.type === 'YEAR') {
            // 这是作者和年份的分隔符
            year = nextToken.value;
            position++; // 跳过逗号
            position++; // 跳过年份
            continue;
          }
          parenContent.push(',');
        } else if (token.type === 'YEAR') {
          year = token.value;
        } else if (token.type === 'TEXT') {
          parenContent.push(token.value);
        }
      }

      // 解析作者
      const authorText = parenContent.join('');
      authors = this.parseAuthors(authorText);

      position++; // 跳过 )
    }

    // 跳过 .
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名
    const titleText = this.readUntilTypeIndicator(tokens, position);
    position = this.findNextTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    let referenceType = 'Z';
    if (typeIndicator) {
      referenceType = typeIndicator.value.replace(/[[\]]/g, '').split('/')[0] || 'Z';
      position = tokens.indexOf(typeIndicator) + 1;
    }

    // 跳过 .
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析刊名/出版信息
    let pages = '';

    // 读取到下一个逗号或冒号
    const nextCommaIndex = this.findNextComma(tokens, position);
    if (nextCommaIndex >= position) {
      position = nextCommaIndex + 1;
    }

    // 解析卷号和期号（跳过）
    const volumeToken = tokens.slice(position).find(t => t.type === 'NUMBER');
    if (volumeToken) {
      position = tokens.indexOf(volumeToken) + 1;
    }

    const issueToken = tokens.slice(position).find(t => t.type === 'PAREN_OPEN');
    if (issueToken) {
      const issueStart = tokens.indexOf(issueToken);
      const issueEnd = tokens.findIndex((t, i) => i > issueStart && t.type === 'PAREN_CLOSE');
      if (issueEnd > issueStart) {
        position = issueEnd + 1;
      }
    }

    // 解析页码
    const colonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex >= position) {
      position = colonIndex + 1;
      const pageTokens = tokens.slice(position).filter(t =>
        t.type === 'NUMBER' || t.type === 'DASH' || t.type === 'TEXT'
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
      type: referenceType as never,
      authors,
      title,
      year: year || undefined,
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

  private findNextComma(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'COMMA') return i;
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
