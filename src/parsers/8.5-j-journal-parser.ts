import type { Token } from '../types/index.js';
import type { Journal, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 期刊解析器
 *
 * 解析格式：`[序号] 作者. 题名[J]. 刊名, 年, 卷(期): 页码.`
 *
 * @example
 * ```typescript
 * const input = '[1] 李明, 张华. 深度学习在自然语言处理中的应用[J]. 计算机学报, 2023, 46(3): 512-525.';
 * const { reference } = parse(input);
 * // reference.type === 'J'
 * // reference.authors === [{ name: '李明' }, { name: '张华' }]
 * // reference.title === '深度学习在自然语言处理中的应用'
 * // reference.journalTitle === '计算机学报'
 * // reference.year === '2023'
 * // reference.volume === '46'
 * // reference.issue === '3'
 * // reference.pages === '512-525'
 * ```
 *
 * @example
 * ```typescript
 * // 在线期刊
 * const input = '[2] Smith J, Doe A. Machine learning review[J/OL]. AI Journal, 2023, 10(2). https://example.com.';
 * const { reference } = parse(input);
 * // reference.mediaType === 'OL'
 * ```
 */
export class JournalParser extends BaseParser {
  /**
   * 检查是否匹配期刊格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是期刊 [J] 或 [J/OL]
    if (!/^\[(J|J\/OL)\]$/.test(typeIndicator.value)) return false;

    // 期刊文章不应匹配连续出版物格式（含破折号范围标记如 "1984, 1(1)—."）
    const hasSerialPattern = tokens.some((t, i) => {
      if (t.type === 'DASH') {
        const next = tokens[i + 1];
        return next && (next.type === 'COMMA' || next.type === 'DOT');
      }
      return false;
    });
    if (hasSerialPattern) return false;

    return true;
  }

  /**
   * 解析期刊文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Journal {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    const { authors, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [J] 和随后的 .
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 跳过析出文献其他责任者（如 "顾幼静,译."）
    // 格式：姓名,译. 或 姓名,注. 等，出现在类型标识后的 DOT 和期刊题名之间
    if (tokens[position]?.type === 'TEXT') {
      const commaAfterName = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
      if (commaAfterName > position) {
        const afterComma = tokens.slice(commaAfterName + 1).find(t => t.type === 'TEXT');
        if (afterComma && /^[\u4e00-\u9fa5]+$/.test(afterComma.value) &&
            tokens.findIndex((t, i) => i > tokens.indexOf(afterComma) && t.type === 'DOT') > tokens.indexOf(afterComma)) {
          // 确认是 "姓名,译." 模式，跳过整个责任者段
          position = tokens.findIndex((t, i) => i >= position && t.type === 'DOT') + 1;
          position = this.skipWhitespace(tokens, position);
        }
      }
    }

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
    if (volumeToken) {
      const prevToken = tokens[tokens.indexOf(volumeToken) - 1];
      if (prevToken && (prevToken.value === ',' || prevToken.value === '，')) {
        volume = volumeToken.value;
        position = tokens.indexOf(volumeToken) + 1;
      }
    }

    // 解析期号
    let issue = '';
    const issueToken = tokens.slice(position).find(t => t.type === 'PAREN_OPEN');
    if (issueToken) {
      const issueStart = tokens.indexOf(issueToken);
      const issueEnd = tokens.findIndex((t, i) => i > issueStart && t.type === 'PAREN_CLOSE');
      if (issueEnd > issueStart) {
        issue = this.readTextUntil(tokens, issueStart + 1, issueEnd).trim();
        position = issueEnd + 1;
      }
    }

    // 解析页码
    const { pages } = this.parsePages(tokens, position);

    // 解析 DOI/PID 和 URL
    const pid = this.parsePID(tokens);
    const url = this.parseURL(tokens);

    return {
      type: 'J' as never,
      authors,
      title,
      subtitle,
      journalTitle: journalTitle.trim().replace(/\.$/, ''),
      year,
      volume: volume || undefined,
      issue: issue || undefined,
      pages: pages || undefined,
      pid: pid || undefined,
      url: url || undefined,
      mediaType,
    };
  }
}
