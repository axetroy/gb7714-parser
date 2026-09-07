import type { Token } from '../types/index.js';
import type { Standard, ParseOptions } from '../types/index.js';
import type { ParserStrategy } from './base.js';

/**
 * 标准解析器
 * 解析格式：[1] 标准编号 标准名称[S].
 * 示例：GB/T 3792—2021 信息与文献馆藏操作 注册[S].
 */
export class StandardParser implements ParserStrategy {
  /**
   * 检查是否匹配标准格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是标准 [S] 或 [S/OL]
    return /^\[(S|S\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析标准文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Standard {
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

    // 解析标准编号和标准名称（到文献类型标识 [S]）
    let standardNumber = '';
    let standardName = '';
    const titleEnd = this.findNextTypeIndicator(tokens, position);
    
    // 查找标准编号（通常以 GB/T、GB 等开头）
    const fullText = this.readTextUntil(tokens, position, titleEnd);
    
    // 匹配标准编号格式
    const standardNumberMatch = fullText.match(/^((?:GB|ISO|IEC|行业标准代码)[\/\s]*[A-Z]*(?:\s*[:\uff1a]\s*)?[\d—\-]+(?:-\d+)*)/i);
    if (standardNumberMatch) {
      standardNumber = standardNumberMatch[1].trim();
      standardName = fullText.slice(standardNumberMatch[1].length).trim();
    } else {
      // 如果没有匹配到标准编号格式，尝试用空格分割
      const spaceIndex = fullText.indexOf(' ');
      if (spaceIndex > 0) {
        standardNumber = fullText.slice(0, spaceIndex).trim();
        standardName = fullText.slice(spaceIndex + 1).trim();
      } else {
        standardNumber = fullText.trim();
      }
    }

    position = titleEnd;

    // 跳过文献类型标识 [S]
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

    // 解析 URL（如果有）
    let url: string | undefined;
    const urlToken = tokens.find(t => t.type === 'URL');
    if (urlToken) {
      url = urlToken.value.replace(/\.$/, '');
    }

    return {
      type: 'S' as never,
      authors: [],
      title: standardName || standardNumber,
      standardNumber,
      standardName: standardName || standardNumber,
      url,
    };
  }

  private skipWhitespace(tokens: Token[], position: number): number {
    while (position < tokens.length && tokens[position]?.type === 'TEXT' && tokens[position]?.value.trim() === '') {
      position++;
    }
    return position;
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
}
