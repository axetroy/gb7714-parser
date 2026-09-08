import type { Token } from '../types/index.js';
import type { ComponentPart, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';

/**
 * 析出文献解析器
 * 解析格式：[1] 作者. 析出文献题名//图书作者. 图书题名. 出版地: 出版者, 出版年: 析出文献页码.
 */
export class ComponentPartParser implements ParserStrategy {
  /**
   * 检查是否匹配析出文献格式
   * 析出文献的特征是包含 // 分隔符
   */
  match(tokens: Token[]): boolean {
    // 检查是否包含 // 分隔符
    return tokens.some(t => t.type === 'DOUBLE_SLASH');
  }

  /**
   * 解析析出文献
   */
  parse(tokens: Token[], _options?: ParseOptions): ComponentPart {
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

    // 解析析出文献作者
    const authorsText = this.readUntilDot(tokens, position);
    position = this.findNextDot(tokens, position) + 1;
    const authors = this.parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析析出文献题名（到 //）
    let componentTitle = '';
    const doubleSlashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DOUBLE_SLASH');
    if (doubleSlashIndex >= position) {
      componentTitle = this.readTextUntil(tokens, position, doubleSlashIndex).trim().replace(/\.$/, '');
      position = doubleSlashIndex + 1;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析图书作者（如果有）
    let hostAuthors: { surname: string; givenName?: string }[] = [];
    const nextDotIndex = this.findNextDot(tokens, position);
    if (nextDotIndex > position) {
      const hostAuthorText = this.readTextUntil(tokens, position, nextDotIndex).trim();
      // 检查是否是作者（包含逗号或中文）
      if (hostAuthorText.includes(',') || hostAuthorText.includes('，') || /^[\u4e00-\u9fa5]+$/.test(hostAuthorText)) {
        hostAuthors = this.parseAuthors(hostAuthorText);
        position = nextDotIndex + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析图书题名
    let hostTitle = '';
    const hostTitleEnd = this.findNextDot(tokens, position);
    if (hostTitleEnd > position) {
      hostTitle = this.readTextUntil(tokens, position, hostTitleEnd).trim().replace(/\.$/, '');
      position = hostTitleEnd + 1;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析出版信息（出版地: 出版者, 出版年）
    let publisherPlace = '';
    let publisher = '';
    let year = '';

    // 查找冒号
    const colonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex >= position) {
      publisherPlace = this.readTextUntil(tokens, position, colonIndex).trim();
      position = colonIndex + 1;

      // 查找逗号
      const commaIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
      if (commaIndex >= position) {
        publisher = this.readTextUntil(tokens, position, commaIndex).trim();
        position = commaIndex + 1;

        // 解析出版年
        const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
        if (yearToken) {
          year = yearToken.value;
          position = tokens.indexOf(yearToken) + 1;
        }
      } else {
        publisher = this.readTextUntil(tokens, position, tokens.length).trim();
      }
    }

    // 跳过 . 
    position = this.skipWhitespace(tokens, position);
    if (tokens[position]?.type === 'DOT') {
      position++;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析析出文献页码（如果有）
    let pages = '';
    const colonIndex2 = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex2 >= position) {
      position = colonIndex2 + 1;
      const pageTokens = tokens.slice(position).filter(t =>
        t.type === 'NUMBER' || t.type === 'DASH' || t.type === 'TEXT'
      );
      if (pageTokens.length > 0) {
        pages = pageTokens.map(t => t.value).join('').replace(/\.$/, '');
      }
    }

    // 解析 URL（如果有）
    let url: string | undefined;
    const urlToken = tokens.find(t => t.type === 'URL');
    if (urlToken) {
      url = urlToken.value.replace(/\.$/, '');
    }

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

    return {
      type: 'Z' as never, // 析出文献使用通用类型
      authors,
      title: componentTitle,
      host: {
        authors: hostAuthors.length > 0 ? hostAuthors : undefined,
        title: hostTitle,
        publisherPlace: publisherPlace || undefined,
        publisher: publisher || undefined,
        year: year || undefined,
      },
      pages: pages || undefined,
      url,
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
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'COMMA') {
        result += ',';
      } else if (token.type === 'NUMBER') {
        result += token.value;
      } else if (token.type === 'DOUBLE_SLASH') {
        result += '//';
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

  private readTextUntil(tokens: Token[], start: number, end: number): string {
    let result = '';
    for (let i = start; i < end; i++) {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'DOT') {
        result += '.';
      } else if (token.type === 'COLON') {
        result += ':';
      } else if (token.type === 'DOUBLE_SLASH') {
        result += '//';
      } else if (token.type === 'NUMBER') {
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
