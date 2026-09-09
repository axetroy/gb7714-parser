import type { Token, Author } from '../types/index.js';
import type { ComponentPart, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors, readUntilDot, findNextDot } from '../utils/index.js';

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
    const authorsText = readUntilDot(tokens, position);
    position = findNextDot(tokens, position) + 1;
    const authors = parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析析出文献题名（到 //）
    let componentTitle = '';
    let componentType: string = 'Z'; // 默认类型
    let componentMediaType: import('../types/index.js').MediaType | undefined;
    const doubleSlashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DOUBLE_SLASH');
    if (doubleSlashIndex >= position) {
      componentTitle = this.readTextUntil(tokens, position, doubleSlashIndex).trim().replace(/\.$/, '');
      // 尝试从题名中提取文献类型标识（从文本中提取）
      const typeMatch = componentTitle.match(/\[([A-Z\/]+)\]$/);
      if (typeMatch) {
        const typeIndicator = typeMatch[1];
        if (typeIndicator) {
          const parsed = parseTypeIndicator(`[${typeIndicator}]`);
          componentType = parsed.baseType || 'Z';
          componentMediaType = parsed.mediaType;
          // 移除题名中的类型标识
          componentTitle = componentTitle.replace(/\s*\[([A-Z\/]+)\]\s*$/, '').trim();
        }
      } else {
        // 检查是否在 DOUBLE_SLASH 之前有 TYPE_INDICATOR token
        const typeIndicatorToken = tokens.slice(position, doubleSlashIndex).find(t => t.type === 'TYPE_INDICATOR');
        if (typeIndicatorToken) {
          const parsed = parseTypeIndicator(typeIndicatorToken.value);
          componentType = parsed.baseType || 'Z';
          componentMediaType = parsed.mediaType;
        }
      }
      position = doubleSlashIndex + 1;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析图书作者（如果有）
    let hostAuthors: Author[] = [];
    const nextDotIndex = findNextDot(tokens, position);
    if (nextDotIndex > position) {
      const hostAuthorText = this.readTextUntil(tokens, position, nextDotIndex).trim();
      // 检查是否是作者（包含逗号或中文）
      if (hostAuthorText.includes(',') || hostAuthorText.includes('，') || /^[\u4e00-\u9fa5]+$/.test(hostAuthorText)) {
        hostAuthors = parseAuthors(hostAuthorText);
        position = nextDotIndex + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析图书题名
    let hostTitle = '';
    const hostTitleEnd = findNextDot(tokens, position);
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
      type: componentType as never, // 析出文献继承原始文献类型
      authors,
      title: componentTitle,
      mediaType: componentMediaType,
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

}
