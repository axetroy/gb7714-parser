import type { Token } from '../types/index.js';
import type { Serial, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator } from '../utils/index.js';

/**
 * 连续出版物解析器
 * 解析格式：[1] 作者. 题名[J]. 年, 卷(期)—年, 卷(期). 出版地: 出版者, 出版年—.
 */
export class SerialParser implements ParserStrategy {
  /**
   * 检查是否匹配连续出版物格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是期刊 [J] 或 [J/OL]
    if (!/^\[(J|J\/OL)\]$/.test(typeIndicator.value)) {
      return false;
    }

    // 检查是否包含连续出版物特征：年, 卷(期)— 或年—
    const hasSerialPattern = tokens.some((t, i) => {
      // 查找 DASH 后跟逗号或句点（表示连续出版物）
      if (t.type === 'DASH') {
        const next = tokens[i + 1];
        if (next && (next.type === 'COMMA' || next.type === 'DOT')) {
          return true;
        }
        // 或者 DASH 后跟年份
        const nextNonText = tokens.slice(i + 1).find(tt => tt.type !== 'TEXT');
        if (nextNonText && nextNonText.type === 'YEAR') {
          return true;
        }
      }
      return false;
    });

    return hasSerialPattern;
  }

  /**
   * 解析连续出版物
   */
  parse(tokens: Token[], _options?: ParseOptions): Serial {
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
    const authorsText = this.readUntilDot(tokens, position);
    position = this.findNextDot(tokens, position) + 1;
    const authors = this.parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名（到文献类型标识 [J]）
    const titleText = this.readUntilTypeIndicator(tokens, position);
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

    // 解析年卷期信息（年, 卷(期)—年, 卷(期) 或 年—）
    let startYear = '';
    let startVolume = '';
    let startIssue = '';
    let endYear = '';
    let endVolume = '';
    let endIssue = '';

    // 查找起始年份
    const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
    if (yearToken) {
      startYear = yearToken.value;
      position = tokens.indexOf(yearToken) + 1;
    }

    // 查找起始卷号（逗号后的数字）
    const commaIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
    if (commaIndex >= position) {
      position = commaIndex + 1;
      const volumeToken = tokens.slice(position).find(t => t.type === 'NUMBER');
      if (volumeToken) {
        startVolume = volumeToken.value;
        position = tokens.indexOf(volumeToken) + 1;
      }
    }

    // 查找起始期号（括号内的内容）
    const parenOpenIndex = tokens.findIndex((t, i) => i >= position && t.type === 'PAREN_OPEN');
    if (parenOpenIndex >= position) {
      position = parenOpenIndex + 1;
      const parenCloseIndex = tokens.findIndex((t, i) => i > position && t.type === 'PAREN_CLOSE');
      if (parenCloseIndex > position) {
        startIssue = tokens.slice(position, parenCloseIndex).map(t => t.value).join('');
        position = parenCloseIndex + 1;
      }
    }

    // 查找 DASH（表示连续出版物）
    const dashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DASH');
    if (dashIndex >= position) {
      position = dashIndex + 1;

      // 查找结束年份
      const endYearToken = tokens.slice(position).find(t => t.type === 'YEAR');
      if (endYearToken) {
        endYear = endYearToken.value;
        position = tokens.indexOf(endYearToken) + 1;
      } else {
        // 无限期发行，结束年份为空
        endYear = '';
      }
    }

    // 解析出版地、出版者、出版年
    let publisherPlace = '';
    let publisher = '';
    let publicationStartYear = '';
    let publicationEndYear = '';

    // 查找冒号（出版地前）
    const colonIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COLON');
    if (colonIndex >= position) {
      // 出版地在冒号前
      publisherPlace = this.readTextUntil(tokens, position, colonIndex).trim().replace(/\.$/, '');
      position = colonIndex + 1;

      // 查找出版者（到逗号）
      const nextCommaIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
      if (nextCommaIndex >= position) {
        publisher = this.readTextUntil(tokens, position, nextCommaIndex).trim().replace(/\.$/, '');
        position = nextCommaIndex + 1;

        // 查找出版年起始
        const pubYearToken = tokens.slice(position).find(t => t.type === 'YEAR');
        if (pubYearToken) {
          publicationStartYear = pubYearToken.value;
          position = tokens.indexOf(pubYearToken) + 1;

          // 查找出版年结束（DASH）
          const pubDashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DASH');
          if (pubDashIndex >= position) {
            position = pubDashIndex + 1;
            // 无限期发行
            publicationEndYear = '';
          }
        }
      }
    }

    // 解析 URL
    const urlToken = tokens.find(t => t.type === 'URL');
    const url = urlToken?.value?.replace(/\.$/, '');

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

    return {
      type: 'J' as never,
      authors,
      title,
      serialTitle: title,
      startYear,
      startVolume: startVolume || undefined,
      startIssue: startIssue || undefined,
      endYear: endYear || undefined,
      endVolume: endVolume || undefined,
      endIssue: endIssue || undefined,
      publisherPlace: publisherPlace || undefined,
      publisher: publisher || undefined,
      publicationStartYear: publicationStartYear || undefined,
      publicationEndYear: publicationEndYear || undefined,
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

  private readUntilDot(tokens: Token[], start: number): string {
    let result = '';
    let i = start;
    while (i < tokens.length && tokens[i]?.type !== 'DOT') {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'COMMA') {
        result += ',';
      } else if (token.type === 'NUMBER') {
        result += token.value;
      }
      i++;
    }
    return result;
  }

  private findNextDot(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'DOT') return i;
    }
    return tokens.length;
  }

  private readUntilTypeIndicator(tokens: Token[], start: number): string {
    let result = '';
    let i = start;
    while (i < tokens.length && tokens[i]?.type !== 'TYPE_INDICATOR') {
      if (tokens[i]?.type === 'TEXT') {
        result += tokens[i]!.value;
      } else if (tokens[i]?.type === 'DOT') {
        result += '.';
      }
      i++;
    }
    return result;
  }

  private readTextUntil(tokens: Token[], start: number, end: number): string {
    let result = '';
    for (let i = start; i < end; i++) {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'DOT') {
        result += '.';
      } else if (token.type === 'DATE') {
        result += token.value;
      }
    }
    return result;
  }

  private parseAuthors(text: string): { surname: string; givenName?: string }[] {
    const parts = text.split(/[,，]/);
    return parts.map(part => {
      const name = part.trim();
      if (!name) return { surname: '' };
      // 处理中文作者
      if (/^[\u4e00-\u9fa5]+$/.test(name)) {
        return { surname: name };
      }
      // 处理西文作者（名 姓 或 姓, 名）
      const spaceParts = name.split(/\s+/);
      if (spaceParts.length >= 2) {
        return {
          surname: spaceParts[spaceParts.length - 1]!,
          givenName: spaceParts.slice(0, -1).join(' '),
        };
      }
      return { surname: name };
    });
  }
}
