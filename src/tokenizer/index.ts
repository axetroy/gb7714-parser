import type { Token, TokenType } from '../types/index.js';

/**
 * 词法分析器
 * 将输入的参考文献字符串切分成有意义的词法单元（Token）
 */
export class Tokenizer {
  private input: string;
  private position: number;
  private tokens: Token[];

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
  }

  /**
   * 对输入字符串进行词法分析
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;

    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.input[this.position]!;

      // 文献类型标识 [J] [M] [D] 等（优先于普通方括号）
      if (char === '[' && this.isTypeIndicator()) {
        this.readTypeIndicator();
        continue;
      }

      // 方括号 [ ]
      if (char === '[') {
        this.addToken('BRACKET_OPEN', '[');
        continue;
      }
      if (char === ']') {
        this.addToken('BRACKET_CLOSE', ']');
        continue;
      }

      // 圆括号 ( )
      if (char === '(') {
        this.addToken('PAREN_OPEN', '(');
        continue;
      }
      if (char === ')') {
        this.addToken('PAREN_CLOSE', ')');
        continue;
      }

      // 句点
      if (char === '.') {
        this.addToken('DOT', '.');
        continue;
      }

      // 逗号
      if (char === '，' || char === ',') {
        this.addToken('COMMA', char);
        continue;
      }

      // 冒号
      if (char === '：' || char === ':') {
        this.addToken('COLON', char);
        continue;
      }

      // 分号
      if (char === '；' || char === ';') {
        this.addToken('SEMICOLON', char);
        continue;
      }

      // 双斜杠 //
      if (char === '/' && this.peek(1) === '/') {
        this.addToken('DOUBLE_SLASH', '//');
        this.position += 2;
        continue;
      }

      // 单斜杠 /
      if (char === '/') {
        this.addToken('SLASH', '/');
        continue;
      }

      // 短横线 -
      if (char === '-' || char === '—' || char === '–') {
        this.addToken('DASH', char);
        continue;
      }

      // 文献类型标识 [J] [M] [D] 等
      if (char === '[' && this.isTypeIndicator()) {
        this.readTypeIndicator();
        continue;
      }

      // DOI (优先于 URL 检查)
      if (this.isDoi()) {
        this.readDoi();
        continue;
      }

      // URL
      if (this.isUrl()) {
        this.readUrl();
        continue;
      }

      // 日期 YYYY-MM-DD 或 (YYYY-MM-DD) 或 [YYYY-MM-DD]
      if (this.isDate()) {
        this.readDate();
        continue;
      }

      // 数字
      if (this.isDigit(char)) {
        this.readNumber();
        continue;
      }

      // 文本内容（作者、题名等）
      this.readText();
    }

    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && this.isWhitespace(this.input[this.position]!)) {
      this.position++;
    }
  }

  private peek(offset: number): string {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos]! : '';
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({ type, value, position: this.position });
    this.position += value.length;
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * 检查当前位置是否是文献类型标识
   * 格式：[J] [M] [D] [C] [EB/OL] 等
   */
  private isTypeIndicator(): boolean {
    // 查找匹配的 ]
    let i = this.position + 1;
    while (i < this.input.length && this.input[i] !== ']') {
      i++;
    }
    if (i >= this.input.length) return false;

    // 提取括号内容
    const content = this.input.slice(this.position + 1, i);

    // 检查是否是有效的文献类型标识
    const typePattern = /^(J|M|D|C|N|P|R|S|EB|A|CM|DS|PP|G|CP|DB|Z)(\/OL)?$/;
    return typePattern.test(content);
  }

  /**
   * 读取文献类型标识
   */
  private readTypeIndicator(): void {
    let i = this.position + 1;
    while (i < this.input.length && this.input[i] !== ']') {
      i++;
    }
    i++; // 包含 ]

    const value = this.input.slice(this.position, i);
    this.addToken('TYPE_INDICATOR', value);
  }

  /**
   * 检查当前位置是否是 DOI
   */
  private isDoi(): boolean {
    const doiPattern = /^(doi:\s*10\.\d{4,}\/)/i;
    const remaining = this.input.slice(this.position);
    return doiPattern.test(remaining);
  }

  /**
   * 读取 DOI
   */
  private readDoi(): void {
    let i = this.position;
    // DOI 包含数字、字母、点号、斜杠、连字符等
    while (i < this.input.length && !this.isWhitespace(this.input[i]!) && this.input[i] !== '\n') {
      i++;
    }
    const value = this.input.slice(this.position, i);
    this.addToken('PID', value);
  }

  /**
   * 检查当前位置是否是 URL
   */
  private isUrl(): boolean {
    const urlPattern = /^(https?:\/\/|http:\/\/)/i;
    const remaining = this.input.slice(this.position);
    return urlPattern.test(remaining);
  }

  /**
   * 读取 URL
   */
  private readUrl(): void {
    let i = this.position;
    // URL 以空白字符或行尾结束（URL 可以包含点号、斜杠等）
    while (i < this.input.length && !this.isWhitespace(this.input[i]!) && this.input[i] !== '\n') {
      i++;
    }
    const value = this.input.slice(this.position, i);
    this.addToken('URL', value);
  }

  /**
   * 检查当前位置是否是日期
   */
  private isDate(): boolean {
    const remaining = this.input.slice(this.position);

    // YYYY-MM-DD 格式
    if (/^\d{4}-\d{2}-\d{2}/.test(remaining)) return true;

    // (YYYY-MM-DD) 格式
    if (/^\(\d{4}-\d{2}-\d{2}\)/.test(remaining)) return true;

    // [YYYY-MM-DD] 格式
    if (/^\[\d{4}-\d{2}-\d{2}\]/.test(remaining)) return true;

    // 仅年份 YYYY
    if (/^\d{4}[年]?/.test(remaining)) return true;

    return false;
  }

  /**
   * 读取日期
   */
  private readDate(): void {
    const remaining = this.input.slice(this.position);

    // (YYYY-MM-DD) 格式
    const parenDateMatch = remaining.match(/^\(\d{4}-\d{2}-\d{2}\)/);
    if (parenDateMatch) {
      this.addToken('DATE', parenDateMatch[0]!);
      return;
    }

    // [YYYY-MM-DD] 格式
    const bracketDateMatch = remaining.match(/^\[\d{4}-\d{2}-\d{2}\]/);
    if (bracketDateMatch) {
      this.addToken('DATE', bracketDateMatch[0]!);
      return;
    }

    // YYYY-MM-DD 格式
    const fullDateMatch = remaining.match(/^\d{4}-\d{2}-\d{2}/);
    if (fullDateMatch) {
      this.addToken('DATE', fullDateMatch[0]!);
      return;
    }

    // 仅年份
    const yearMatch = remaining.match(/^\d{4}/);
    if (yearMatch) {
      this.addToken('YEAR', yearMatch[0]!);
      return;
    }
  }

  /**
   * 读取数字
   */
  private readNumber(): void {
    let i = this.position;
    while (i < this.input.length && (this.isDigit(this.input[i]!) || this.input[i] === '.')) {
      i++;
    }
    const value = this.input.slice(this.position, i);
    this.addToken('NUMBER', value);
  }

  /**
   * 读取文本内容
   */
  private readText(): void {
    let i = this.position;
    while (i < this.input.length) {
      const char = this.input[i]!;
      // 遇到特殊字符停止
      if (char === '[' || char === ']' || char === '(' || char === ')' ||
          char === '.' || char === '，' || char === ',' ||
          char === '：' || char === ':' || char === '；' || char === ';' ||
          char === '/' || char === '-' || char === '—' || char === '–' ||
          this.isWhitespace(char)) {
        break;
      }
      i++;
    }

    if (i > this.position) {
      const value = this.input.slice(this.position, i);
      this.addToken('TEXT', value);
    } else {
      // 跳过无法识别的字符
      this.position++;
    }
  }
}

/**
 * 便捷函数：对输入字符串进行词法分析
 */
export function tokenize(input: string): Token[] {
  const tokenizer = new Tokenizer(input);
  return tokenizer.tokenize();
}
