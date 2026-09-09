import type { Token } from '../types/index.js';
import type { Thesis, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 学位论文解析器
 *
 * 解析格式：`[序号] 作者. 题名[D]. 出版地: 学位授予单位, 年份: 页码.`
 *
 * @example
 * ```typescript
 * const input = '[1] 张三. 深度学习在计算机视觉中的应用[D]. 北京: 清华大学, 2023.';
 * const { reference } = parse(input);
 * // reference.type === 'D'
 * // reference.authors === [{ name: '张三' }]
 * // reference.title === '深度学习在计算机视觉中的应用'
 * // reference.awardPlace === '北京'
 * // reference.awardInstitution === '清华大学'
 * // reference.awardYear === '2023'
 * ```
 */
export class ThesisParser extends BaseParser {
  /**
   * 检查是否匹配学位论文格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是学位论文 [D] 或 [D/OL]
    return /^\[(D|D\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析学位论文
   */
  parse(tokens: Token[], _options?: ParseOptions): Thesis {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    const { authors, title, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [D]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析学位授予信息（出版地: 学位授予单位, 年份: 页码）
    const awardInfo = this.readAwardInfo(tokens, position);
    const awardPlace = awardInfo.place;
    const awardInstitution = awardInfo.institution;
    const awardYear = awardInfo.year;

    // 解析页码
    let pages: string | undefined;
    const yearIndex = tokens.findIndex((t, i) => i >= position && t.type === 'YEAR' && t.value === awardYear);
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

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'D' as never,
      authors,
      title,
      awardPlace: awardPlace || undefined,
      awardInstitution,
      awardYear: awardYear || undefined,
      pages,
      url,
      pid: pid || undefined,
      mediaType,
    };
  }

  private readAwardInfo(tokens: Token[], start: number): {
    place: string;
    institution: string;
    year: string;
  } {
    let place = '';
    let institution = '';
    let year = '';

    let i = start;
    let phase: 'place' | 'institution' | 'year' = 'place';
    let lastEndPosition = -1;

    while (i < tokens.length) {
      const token = tokens[i]!;

      // 冒号：从出版地切换到学位授予单位
      if (token.value === ':' || token.value === '：') {
        if (phase === 'place') {
          phase = 'institution';
          lastEndPosition = -1;
        }
        i++;
        continue;
      }

      // 逗号：从学位授予单位切换到年份
      if (token.type === 'COMMA' || token.value === '，') {
        if (phase === 'institution') {
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
        } else if (phase === 'institution') {
          institution += spaces + token.value;
          lastEndPosition = token.position + token.value.length;
        }
      }

      i++;
    }

    return { place: place.trim(), institution: institution.trim(), year };
  }
}
