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
    // 注意：只检查 em-dash（—），不检查普通连字符（-）
    const hasSerialPattern = tokens.some((t, i) => {
      if (t.type === 'DASH' && t.value === '—') {
        const next = tokens[i + 1];
        return next && (next.type === 'COMMA' || next.type === 'DOT' || next.type === 'YEAR');
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
    const { authors, truncated, authorComma, subtitleSeparator, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [J] 和随后的 .
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析析出文献其他责任者（如 "顾幼静，译."）
    // 标准 §8.5: 类型标识后著录析出文献其他责任者，如 "顾幼静，译. 东方博物, ..."
    let otherAuthors: import('../types/index.js').Author[] | undefined;
    if (tokens[position]?.type === 'TEXT') {
      const translatorIndex = tokens.findIndex((t, i) => i >= position && t.type === 'TEXT' && /译$/.test(t.value.trim()));
      if (translatorIndex >= position) {
        // 往前找姓名边界：停止在 DOT/COLON 之前（跳过 COMMA）
        let start = translatorIndex;
        while (start > position) {
          const prev = tokens[start - 1]!;
          if (prev.type === 'DOT' || prev.type === 'COLON') break;
          if (prev.type === 'COMMA') { start--; continue; }
          start--;
        }
        const nameTokens = tokens.slice(start, translatorIndex + 1);
        if (nameTokens.length > 0) {
          // 拼接姓名：COMMA token 还原为全角逗号，"译" 保留在姓名中
          const nameParts = nameTokens.map(t => t.type === 'COMMA' ? '，' : t.value);
          const name = nameParts.join('').replace(/[，,。.]+$/, '').trim();
          if (name) {
            otherAuthors = [{ name }];
          }
        }
        // 跳过 "译" 及随后的 DOT
        let pos = translatorIndex + 1;
        pos = this.skipWhitespace(tokens, pos);
        if (tokens[pos]?.type === 'DOT') pos++;
        position = this.skipWhitespace(tokens, pos);
      }
    }

    // 解析刊名（到 , 或 年份）
    const journalTitle = this.readUntilCommaOrYear(tokens, position);
    position = this.findNextCommaOrYear(tokens, position);

    // 解析年份或在线出版日期
    // 标准 §7.5.4.2: 期刊在线出版日期按 YYYY-MM-DD 著录，如 "铁道学报,2024-05-09."
    let year = '';
    let onlineDate = '';
    const dateToken = tokens.slice(position).find(t => t.type === 'DATE');
    if (dateToken) {
      onlineDate = dateToken.value;
      position = tokens.indexOf(dateToken) + 1;
    } else {
      const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
      if (yearToken) {
        year = yearToken.value;
        position = tokens.indexOf(yearToken) + 1;
      }
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

    // 检测卷期分隔符（卷和期之间是否有空格）
    let volumeSeparator: ' ' | '' = '';
    if (volume) {
      const volToken = tokens.find(t => t.type === 'NUMBER' && t.value === volume);
      if (volToken) {
        const volIdx = tokens.indexOf(volToken);
        const afterVolToken = tokens[volIdx + 1];
        if (afterVolToken && afterVolToken.type === 'PAREN_OPEN') {
          // 检查位置间隙判断是否有空格
          const gap = afterVolToken.position - (volToken.position + volToken.value.length);
          volumeSeparator = gap > 0 ? ' ' : '';
        }
      }
    }

    // 检测年份后是否直接跟括号（表示无卷号，如 "2013 (1)"）
    let issueSpace = false;
    if (!volume) {
      const yearIdx = tokens.indexOf(tokens.find(t => t.type === 'YEAR' && t.value === year)!);
      if (yearIdx >= 0) {
        const nextToken = tokens[yearIdx + 1];
        if (nextToken && nextToken.type === 'PAREN_OPEN') {
          issueSpace = true;
        }
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
      authorsTruncated: truncated || undefined,
      otherAuthors,
      title,
      subtitle,
      journalTitle: journalTitle.trim().replace(/\.$/, ''),
      year,
      onlineDate: onlineDate || undefined,
      volume: volume || undefined,
      volumeSeparator: volumeSeparator || undefined,
      issue: issue || undefined,
      issueSpace: issueSpace || undefined,
      pages: pages || undefined,
      pid: pid || undefined,
      url: url || undefined,
      mediaType,
      authorComma: authorComma || undefined,
      subtitleSeparator: subtitleSeparator || undefined,
    };
  }
}
