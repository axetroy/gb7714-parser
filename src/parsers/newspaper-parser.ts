import type { Token } from '../types/index.js';
import type { Newspaper, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 报纸解析器
 *
 * 解析格式：`[序号] 作者. 题名[N]. 报纸名, 出版日期(YYYY-MM-DD): 版次.`
 *
 * 标准 §8.5.1.4: 报纸应在报纸名后著录其出版日期与版次，如 2013-03-16 (1)
 *
 * @example
 * ```typescript
 * const input = '[1] 张三. 人工智能技术突破[N]. 科技日报, 2023-06-15(1).';
 * const { reference } = parse(input);
 * // reference.type === 'N'
 * // reference.authors === [{ name: '张三' }]
 * // reference.title === '人工智能技术突破'
 * // reference.newspaperTitle === '科技日报'
 * // reference.year === '2023'
 * // reference.monthDay === '06-15'
 * // reference.edition === '1'
 * ```
 *
 * @example
 * ```typescript
 * // 在线报纸
 * const input = '[2] 李四. 新能源汽车发展[N/OL]. 人民日报, 2023-06-15(5). https://paper.people.com.';
 * const { reference } = parse(input);
 * // reference.mediaType === 'OL'
 * // reference.url === 'https://paper.people.com'
 * ```
 */
export class NewspaperParser extends BaseParser {
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

    // 跳过文献类型标识 [N]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

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
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

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
}
