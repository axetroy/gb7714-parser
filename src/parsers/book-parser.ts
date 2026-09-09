import type { Token } from '../types/index.js';
import type { Book, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 图书解析器
 *
 * 解析格式：`[序号] 作者. 书名[M]. 出版地: 出版社, 年份: 页码.`
 *
 * @example
 * ```typescript
 * const input = '[1] 周志华. 机器学习[M]. 北京: 清华大学出版社, 2016: 420.';
 * const { reference } = parse(input);
 * // reference.type === 'M'
 * // reference.authors === [{ name: '周志华' }]
 * // reference.title === '机器学习'
 * // reference.publisherPlace === '北京'
 * // reference.publisher === '清华大学出版社'
 * // reference.year === '2016'
 * // reference.pages === '420'
 * ```
 *
 * @example
 * ```typescript
 * // 英文图书
 * const input = '[2] Goodfellow I, Bengio Y, Courville A. Deep learning[M]. MIT press, 2016.';
 * const { reference } = parse(input);
 * // reference.authors.length === 3
 * ```
 *
 * @example
 * ```typescript
 * // 带版本的图书
 * const input = '[3] authors. Programming language[M]. 3rd ed. Publisher, 2020.';
 * const { reference } = parse(input);
 * // reference.version === '3rd ed'
 * ```
 */
export class BookParser extends BaseParser {
  /**
   * 检查是否匹配图书格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是图书 [M] 或 [M/OL]
    return /^\[(M|M\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析图书文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Book {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者
    const { authors, position: afterAuthors } = this.parseRequiredAuthors(tokens, position);
    position = afterAuthors;

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名
    const { title, position: afterTitle } = this.parseTitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [M] 和随后的 .
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析版本（如果有）
    // 标准 §7.4: 版本宜用阿拉伯数字、序数缩写形式或其他标识表示
    // 支持格式: "第3版", "3版", "新1版", "V1.0", "3rd ed", "Rev. ed", "修订版", "刻本", "影印本" 等
    let version: string | undefined;
    const versionToken = tokens.slice(position).find(t =>
      t.type === 'TEXT' && /^(第?\d+版|新\d+版|V\d+\.\d+|[0-9]+th?\s*ed|Rev\.\s*ed|修订版|新版|刻本|影印本)/i.test(t.value)
    );
    if (versionToken && tokens[tokens.indexOf(versionToken) - 1]?.type === 'DOT') {
      version = versionToken.value;
      position = tokens.indexOf(versionToken) + 1;
      // 跳过后续的 .
      position = this.skipWhitespace(tokens, position);
      if (tokens[position]?.type === 'DOT') {
        position++;
      }
      position = this.skipWhitespace(tokens, position);
    }

    // 解析出版信息（出版地: 出版者, 年份: 页码）
    const publisherInfo = this.readPublisherInfo(tokens, position);
    const publisherPlace = publisherInfo.place;
    const publisher = publisherInfo.publisher;
    const year = publisherInfo.year;

    // 解析页码（如果有，格式为 : 页码）
    let pages: string | undefined;
    // 查找年份后面的冒号
    const yearIndex = tokens.findIndex((t, i) => i >= position && t.type === 'YEAR' && t.value === year);
    if (yearIndex >= position) {
      const afterYear = tokens.slice(yearIndex + 1);
      const colonIndex = afterYear.findIndex(t => t.value === ':' || t.value === '：');
      if (colonIndex >= 0) {
        const pageTokens = afterYear.slice(colonIndex + 1).filter(t =>
          t.type === 'NUMBER' || t.type === 'DASH' || t.type === 'TEXT'
        );
        if (pageTokens.length > 0) {
          pages = pageTokens.map(t => t.value).join('').replace(/\.$/, '');
        }
      }
    }

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'M' as never,
      authors,
      title,
      publisherPlace: publisherPlace || undefined,
      publisher: publisher || undefined,
      year: year || undefined,
      version,
      pages,
      pid: pid || undefined,
      mediaType,
    };
  }

  private readPublisherInfo(tokens: Token[], start: number): {
    place: string;
    publisher: string;
    year: string;
  } {
    let place = '';
    let publisher = '';
    let year = '';

    let i = start;
    let phase: 'place' | 'publisher' | 'year' = 'place';
    let lastEndPosition = -1;

    while (i < tokens.length) {
      const token = tokens[i]!;

      // 冒号：从出版地切换到出版者
      if (token.value === ':' || token.value === '：') {
        if (phase === 'place') {
          phase = 'publisher';
          lastEndPosition = -1;
        }
        i++;
        continue;
      }

      // 逗号：从出版者切换到年份
      if (token.type === 'COMMA' || token.value === '，') {
        if (phase === 'publisher') {
          phase = 'year';
          lastEndPosition = -1;
        }
        i++;
        continue;
      }

      if (token.type === 'YEAR') {
        year = token.value;
        i++;
        continue;
      }

      if (token.type === 'TEXT') {
        // 计算与上一个 token 之间的空格数
        const gap = lastEndPosition >= 0 ? token.position - lastEndPosition : 0;
        const spaces = gap > 0 ? ' '.repeat(gap) : '';

        if (phase === 'place') {
          place += spaces + token.value;
          lastEndPosition = token.position + token.value.length;
        } else if (phase === 'publisher') {
          publisher += spaces + token.value;
          lastEndPosition = token.position + token.value.length;
        }
      }

      i++;
    }

    return { place: place.trim(), publisher: publisher.trim(), year };
  }
}
