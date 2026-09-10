import type { Token, Author, MediaType } from '../types/index.js';
import type { Reference, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';
import { parseTypeIndicator, parseAuthors } from '../utils/index.js';

/**
 * 著者-出版年制解析器
 *
 * 解析格式：`(作者, 年). 题名[J]. 刊名, 卷(期): 页码.`
 *
 * @example
 * ```typescript
 * const input = '(张三, 2023). 人工智能在教育中的应用[J]. 现代教育技术, 2023, 35(2): 15-22.';
 * const { reference } = parse(input);
 * // reference.type === 'J'
 * // reference.authors === [{ name: '张三' }]
 * // reference.year === '2023'
 * // reference.title === '人工智能在教育中的应用'
 * // reference.pages === '15-22'
 * ```
 *
 * @example
 * ```typescript
 * // 多作者
 * const input = '(张三, 李四, 王五, 2023). 深度学习综述[J]. 计算机学报, 2023, 46(3): 512-525.';
 * const { reference } = parse(input);
 * // reference.authors === [{ name: '张三' }, { name: '李四' }, { name: '王五' }]
 * ```
 */
export class AuthorDateParser extends BaseParser {
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
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和年份 (作者, 年)
    let authors: Author[] = [];
    let year = '';

    if (tokens[position]?.type === 'PAREN_OPEN') {
      position++; // 跳过 (

      // 读取括号内容直到 )
      let depth = 1;
      const parenContent: string[] = [];
      while (position < tokens.length && depth > 0) {
        const token = tokens[position];
        if (!token) break;

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
        position++;
      }

      // 解析作者
      const authorText = parenContent.join('');
      const { authors: _a2, truncated: _t2 } = parseAuthors(authorText);
      authors = _a2;

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
    const { title, position: afterTitle } = this.parseTitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    let referenceType = 'Z';
    let mediaType: MediaType | undefined;
    if (typeIndicator) {
      const parsed = parseTypeIndicator(typeIndicator.value);
      referenceType = parsed.baseType || 'Z';
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
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: referenceType as never,
      authors,
      
      title,
      year: year || undefined,
      pages: pages || undefined,
      url: url || undefined,
      pid: pid || undefined,
      mediaType,
    };
  }

  private findNextComma(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'COMMA') return i;
    }
    return tokens.length;
  }
}
