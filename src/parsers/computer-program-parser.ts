import type { Token } from '../types/index.js';
import type { ComputerProgram, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';
import { parseTypeIndicator, parseAuthors } from '../utils/index.js';

/**
 * 计算机程序解析器
 * 解析格式：[1] 作者. 程序名[CP]. 版本. 运行环境. 出版地: 出版者, 出版年.
 */
export class ComputerProgramParser implements ParserStrategy {
  /**
   * 检查是否匹配计算机程序格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是计算机程序 [CP] 或 [CP/OL]
    return /^\[(CP|CP\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析计算机程序文献
   */
  parse(tokens: Token[], _options?: ParseOptions): ComputerProgram {
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
    const authors = parseAuthors(authorsText);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名
    const titleText = this.readUntilTypeIndicator(tokens, position);
    position = this.findNextTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');

    // 跳过文献类型标识 [CP]
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

    // 解析版本（如果有）
    let programVersion: string | undefined;
    const versionEnd = this.findNextDot(tokens, position);
    if (versionEnd > position) {
      const versionText = this.readTextUntil(tokens, position, versionEnd).trim();
      if (versionText && !versionText.includes('(') && !versionText.includes('（')) {
        programVersion = versionText;
        position = versionEnd + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析运行环境（如果有）
    let runtimeEnvironment: string | undefined;
    const envEnd = this.findNextDot(tokens, position);
    if (envEnd > position) {
      const envText = this.readTextUntil(tokens, position, envEnd).trim();
      if (envText && !envText.includes('(') && !envText.includes('（')) {
        runtimeEnvironment = envText;
        position = envEnd + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析出版地、出版者、出版年
    let publisherPlace = '';
    let publisher = '';
    let year = '';

    // 查找冒号（出版地: 出版者）
    const colonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex >= position) {
      publisherPlace = this.readTextUntil(tokens, position, colonIndex).trim();
      position = colonIndex + 1;

      // 查找逗号（出版者, 出版年）
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

    // 解析 URL（如果有）
    const urlToken = tokens.find(t => t.type === 'URL');
    const url = urlToken?.value;

    // 解析 DOI/PID
    const pidToken = tokens.find(t => t.type === 'PID');
    const pid = pidToken?.value;

    return {
      type: 'CP' as never,
      authors,
      title,
      programVersion,
      runtimeEnvironment,
      publisherPlace: publisherPlace || undefined,
      publisher: publisher || undefined,
      year: year || undefined,
      url: url || undefined,
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

  private readTextUntil(tokens: Token[], start: number, end: number): string {
    let result = '';
    for (let i = start; i < end; i++) {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        result += token.value;
      } else if (token.type === 'DOT') {
        result += '.';
      } else if (token.type === 'NUMBER') {
        result += token.value;
      } else if (token.type === 'DASH') {
        result += token.value;
      } else if (token.type === 'SLASH') {
        result += '/';
      } else if (token.type === 'COLON') {
        result += ':';
      }
    }
    return result;
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

}
