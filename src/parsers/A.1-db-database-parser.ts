import type { Token, Author } from '../types/index.js';
import type { Database, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';
import { parseAuthors } from '../utils/index.js';

/**
 * 数据库解析器
 *
 * 解析格式：`[序号] 作者. 数据库名[DB]. 出版地: 出版者, 出版年.`
 *
 * @example
 * ```typescript
 * const input = '[1] 中国知网. 中国学术期刊全文数据库[DB]. 北京: 中国知网, 2023.';
 * const { reference } = parse(input);
 * // reference.type === 'DB'
 * // reference.authors === [{ name: '中国知网' }]
 * // reference.title === '中国学术期刊全文数据库'
 * // reference.databaseName === '中国学术期刊全文数据库'
 * // reference.publisherPlace === '北京'
 * // reference.publisher === '中国知网'
 * // reference.year === '2023'
 * ```
 */
export class DatabaseParser extends BaseParser {
  /**
   * 检查是否匹配数据库格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是数据库 [DB] 或 [DB/OL]
    return /^\[(DB|DB\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析数据库文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Database {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者（如果有）
    let authors: Author[] = [];
    const firstDotIndex = this.findNextDot(tokens, position);
    const typeIndicatorIndex = this.findNextTypeIndicator(tokens, position);
    if (firstDotIndex < typeIndicatorIndex) {
      // DOT 出现在 TYPE_INDICATOR 之前，说明有作者
      const beforeDot = this.readTextUntil(tokens, position, firstDotIndex);
      const { authors: _a3, truncated: _t3 } = parseAuthors(beforeDot);
      authors = _a3;
      position = firstDotIndex + 1;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名（到文献类型标识 [DB]）
    const { title, position: afterTitle } = this.parseTitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [DB]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析出版信息（出版地: 出版者, 出版年）
    const { publisherPlace, publisher, year } = this.parsePublisherInfo(tokens, position);

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'DB' as never,
      authors,
      
      title,
      databaseName: title,
      publisherPlace: publisherPlace || undefined,
      publisher: publisher || undefined,
      year: year || undefined,
      url: url || undefined,
      pid: pid || undefined,
      mediaType,
    };
  }
}
