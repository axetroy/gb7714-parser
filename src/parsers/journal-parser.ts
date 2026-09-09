import type { Token } from '../types/index.js';
import type { Journal, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors, readUntilDot, readUntilTypeIndicator, findNextDot, findNextTypeIndicator } from '../utils/index.js';

/**
 * 期刊解析器
 * 解析格式：[1] 作者. 题名[J]. 刊名, 年, 卷(期): 页码.
 * 支持合期号格式：卷(8/9/10) 或 卷(S1) 等（标准 §8.5.1.2）
 */
export class JournalParser implements ParserStrategy {
  /**
   * 检查是否匹配期刊格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是期刊 [J] 或 [J/OL]
    return /^\[(J|J\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析期刊文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Journal {
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
    const authorsText = readUntilDot(tokens, position);
    position = findNextDot(tokens, position) + 1;
    const authors = parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名
    const titleText = readUntilTypeIndicator(tokens, position);
    position = findNextTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识 [J]
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

    // 解析刊名（到 , 或 年份）
    const journalTitle = this.readUntilCommaOrYear(tokens, position);
    position = this.findNextCommaOrYear(tokens, position);

    // 解析年份
    let year = '';
    const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
    if (yearToken) {
      year = yearToken.value;
      position = tokens.indexOf(yearToken) + 1;
    }

    // 解析卷号
    let volume = '';
    const volumeToken = tokens.slice(position).find(t => t.type === 'NUMBER' && !t.value.includes('-'));
    if (volumeToken && tokens[tokens.indexOf(volumeToken) - 1]?.value === ',') {
      volume = volumeToken.value;
      position = tokens.indexOf(volumeToken) + 1;
    }

    // 解析期号
    let issue = '';
    const issueToken = tokens.slice(position).find(t => t.type === 'PAREN_OPEN');
    if (issueToken) {
      const issueStart = tokens.indexOf(issueToken);
      const issueEnd = tokens.findIndex((t, i) => i > issueStart && t.type === 'PAREN_CLOSE');
      if (issueEnd > issueStart) {
        issue = tokens.slice(issueStart + 1, issueEnd).map(t => t.value).join('');
        position = issueEnd + 1;
      }
    }

    // 解析页码
    let pages = '';
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

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

    return {
      type: 'J' as never,
      authors,
      title,
      journalTitle: journalTitle.trim().replace(/\.$/, ''),
      year,
      volume: volume || undefined,
      issue: issue || undefined,
      pages: pages || undefined,
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





  private readUntilCommaOrYear(tokens: Token[], start: number): string {
    let result = '';
    let lastEndPosition = -1;
    let i = start;
    while (i < tokens.length) {
      const token = tokens[i]!;
      if (token.type === 'COMMA') break;
      if (token.type === 'YEAR') break;
      if (token.type === 'TEXT') {
        if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
          result += ' ';
        }
        result += token.value;
        lastEndPosition = token.position + token.value.length;
      } else if (token.type === 'DOT') {
        result += '.';
        lastEndPosition = token.position + 1;
      }
      i++;
    }
    return result;
  }

  private findNextCommaOrYear(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'COMMA' || tokens[i]?.type === 'YEAR') return i;
    }
    return tokens.length;
  }
}
