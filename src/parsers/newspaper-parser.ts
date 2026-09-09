import type { Token } from '../types/index.js';
import type { Newspaper, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors, readUntilDot, readUntilTypeIndicator, findNextDot, findNextTypeIndicator } from '../utils/index.js';

/**
 * 报纸解析器
 * 解析格式：[1] 作者. 题名[N]. 报纸名, 出版日期(YYYY-MM-DD): 版次.
 * 标准 §8.5.1.4: 报纸应在报纸名后著录其出版日期与版次，如 2013-03-16 (1)
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
    const authorsText = readUntilDot(tokens, position);
    position = findNextDot(tokens, position) + 1;
    const authors = parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名
    const titleText = readUntilTypeIndicator(tokens, position);
    position = findNextTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识 [N]
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

    // 解析报纸名（到 , 或 年份）
    const newspaperTitle = this.readUntilCommaOrYear(tokens, position);
    position = this.findNextCommaOrYear(tokens, position);

    // 解析年份
    let year = '';
    const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
    if (yearToken) {
      year = yearToken.value;
      position = tokens.indexOf(yearToken) + 1;
    }

    // 解析月日
    let monthDay = '';
    const monthDayStart = position;
    while (position < tokens.length && 
           (tokens[position]?.type === 'NUMBER' || tokens[position]?.type === 'DASH' || tokens[position]?.type === 'TEXT')) {
      position++;
    }
    if (position > monthDayStart) {
      monthDay = tokens.slice(monthDayStart, position).map(t => t.value).join('');
    }

    // 解析版次
    let edition = '';
    const colonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex >= position) {
      position = colonIndex + 1;
      const editionTokens = tokens.slice(position).filter(t =>
        t.type === 'NUMBER' || t.type === 'TEXT'
      );
      if (editionTokens.length > 0) {
        edition = editionTokens.map(t => t.value).join('').replace(/\.$/, '');
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
      newspaperTitle: newspaperTitle.trim().replace(/\.$/, ''),
      year: year || '',
      monthDay: monthDay || undefined,
      edition: edition || undefined,
      url: url || undefined,
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
    let i = start;
    while (i < tokens.length) {
      const token = tokens[i]!;
      if (token.type === 'COMMA') break;
      if (token.type === 'YEAR') break;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'DOT') {
        result += '.';
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
