import type { Token } from '../types/index.js';
import type { Book, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';

/**
 * 图书解析器
 * 解析格式：[1] 作者. 书名[M]. 出版地: 出版社, 年份: 页码.
 */
export class BookParser implements ParserStrategy {
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

    // 解析题名
    const titleText = this.readUntilTypeIndicator(tokens, position);
    position = this.findNextTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识 [M]
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (typeIndicator) {
      position = tokens.indexOf(typeIndicator) + 1;
    }

    // 跳过 .
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析版本（如果有）
    let version: string | undefined;
    const versionToken = tokens.slice(position).find(t =>
      t.type === 'TEXT' && /^(第?\d+版|[0-9]+th?\s*ed|修订版|新版|刻本|影印本)/i.test(t.value)
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
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

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
      if (tokens[i]?.type === 'TEXT') {
        result += tokens[i]!.value;
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

  private findNextTypeIndicator(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'TYPE_INDICATOR') return i;
    }
    return tokens.length;
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

    while (i < tokens.length) {
      const token = tokens[i]!;

      // 冒号：从出版地切换到出版者
      if (token.value === ':' || token.value === '：') {
        if (phase === 'place') {
          phase = 'publisher';
        }
        i++;
        continue;
      }

      // 逗号：从出版者切换到年份
      if (token.type === 'COMMA' || token.value === '，') {
        if (phase === 'publisher') {
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
        } else if (phase === 'publisher') {
          publisher += token.value;
        }
      }

      i++;
    }

    return { place: place.trim(), publisher: publisher.trim(), year };
  }

  private parseAuthors(text: string): { surname: string; givenName?: string }[] {
    const parts = text.split(/[,，]/);
    return parts.map(part => {
      const name = part.trim();
      if (/^[\u4e00-\u9fa5]+$/.test(name)) {
        return { surname: name };
      }
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
