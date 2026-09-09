import type { Token } from '../types/index.js';
import type { Thesis, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors, readUntilDot, readUntilTypeIndicator, findNextDot, findNextTypeIndicator } from '../utils/index.js';

/**
 * 学位论文解析器
 * 解析格式：[1] 作者. 题名[D]. 出版地: 学位授予单位, 年份: 页码.
 */
export class ThesisParser implements ParserStrategy {
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

    // 跳过文献类型标识 [D]
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

    // 解析 URL（如果有）
    let url: string | undefined;
    const urlToken = tokens.find(t => t.type === 'URL');
    if (urlToken) {
      // 去掉 URL 末尾的点号
      url = urlToken.value.replace(/\.$/, '');
    }

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

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

  private skipWhitespace(tokens: Token[], position: number): number {
    while (position < tokens.length && tokens[position]?.type === 'TEXT' && tokens[position]?.value.trim() === '') {
      position++;
    }
    return position;
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

    while (i < tokens.length) {
      const token = tokens[i]!;

      // 冒号：从出版地切换到学位授予单位
      if (token.value === ':' || token.value === '：') {
        if (phase === 'place') {
          phase = 'institution';
        }
        i++;
        continue;
      }

      // 逗号：从学位授予单位切换到年份
      if (token.type === 'COMMA' || token.value === '，') {
        if (phase === 'institution') {
          phase = 'year';
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
        if (phase === 'place') {
          place += token.value;
        } else if (phase === 'institution') {
          institution += token.value;
        }
      }

      i++;
    }

    return { place: place.trim(), institution: institution.trim(), year };
  }

}
