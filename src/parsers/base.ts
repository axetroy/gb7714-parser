import type { Token, Author, MediaType, ParseError } from '../types/index.js';
import { ParseErrorCode } from '../types/index.js';
import type { ReferenceUnion, ParseOptions } from '../types/index.js';
import { parseAuthors, parseTypeIndicator, readUntilDot, readUntilTypeIndicator, findNextDot, findNextTypeIndicator, findNextColon } from '../utils/index.js';

/**
 * 解析器策略接口
 * 每种文献类型实现此接口
 */
export interface ParserStrategy {
  /**
   * 检查 token 序列是否匹配此解析器
   */
  match(tokens: Token[]): boolean;

  /**
   * 解析 token 序列为文献对象
   */
  parse(tokens: Token[], options?: ParseOptions): ReferenceUnion;
}

/**
 * 解析结果
 */
export interface ParserResult {
  errors: ParseError[];
  reference: ReferenceUnion;
  warnings: string[];
}

/**
 * 解析器基类
 * 提供所有解析器共用的工具方法
 */
export abstract class BaseParser implements ParserStrategy {
  abstract match(tokens: Token[]): boolean;
  abstract parse(tokens: Token[], options?: ParseOptions): ReferenceUnion;

  /**
   * 跳过序号 [1]
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 跳过序号后的位置
   */
  protected skipReferenceNumber(tokens: Token[], position: number): number {
    if (tokens[position]?.type === 'BRACKET_OPEN') {
      position++;
      while (position < tokens.length && tokens[position]?.type !== 'BRACKET_CLOSE') {
        position++;
      }
      position++; // 跳过 ]
    }
    return position;
  }

  /**
   * 跳过空白 Token
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 跳过空白后的位置
   */
  protected skipWhitespace(tokens: Token[], position: number): number {
    while (position < tokens.length && tokens[position]?.type === 'TEXT' && tokens[position]?.value.trim() === '') {
      position++;
    }
    return position;
  }

  /**
   * 解析必有作者（格式：作者.）
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含作者数组和下一个位置
   */
  protected parseRequiredAuthors(tokens: Token[], position: number): { authors: Author[]; position: number } {
    const authorsText = readUntilDot(tokens, position);
    position = findNextDot(tokens, position) + 1;
    const authors = parseAuthors(authorsText);
    return { authors, position };
  }

  /**
   * 解析可选作者（格式：作者. 或 直接是题名）
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含作者数组和下一个位置
   */
  protected parseOptionalAuthors(tokens: Token[], position: number): { authors: Author[]; position: number } {
    let authors: Author[] = [];
    // 找到第一个 TYPE_INDICATOR 的位置，作为搜索边界
    const typeIndicatorIndex = findNextTypeIndicator(tokens, position);
    // 在 TYPE_INDICATOR 之前寻找 DOT（作者分隔符）
    const dotIndex = findNextDot(tokens, position);
    // 有效搜索范围：不超过 TYPE_INDICATOR
    const searchLimit = typeIndicatorIndex < tokens.length
      ? Math.min(dotIndex, typeIndicatorIndex)
      : dotIndex;

    if (searchLimit > position && dotIndex <= searchLimit) {
      // 有 DOT 在 TYPE_INDICATOR 之前：DOT 前文本视为作者（无论是否为中文）
      // DOT 明确分隔了作者与题名，因此接受任何非空文本作为作者
      const beforeDot = this.readTextUntil(tokens, position, dotIndex);
      if (beforeDot.trim()) {
        authors = parseAuthors(beforeDot);
        position = dotIndex + 1;
      } else {
        position = dotIndex + 1;
      }
    } else if (searchLimit > position && typeIndicatorIndex <= dotIndex) {
      // 无 DOT 在 TYPE_INDICATOR 之前：检查 TYPE_INDICATOR 前的文本
      // 进一步检查：如果文本内含 COLON（如"作者：标题"格式），只取 COLON 前的部分
      const beforeTypeIndicator = this.readTextUntil(tokens, position, typeIndicatorIndex);
      const colonInText = tokens.findIndex((t, i) =>
        i >= position && i < typeIndicatorIndex && t.type === 'COLON'
      );
      const authorText = colonInText >= 0
        ? this.readTextUntil(tokens, position, colonInText).trim()
        : beforeTypeIndicator;
      if (this.isLikelyAuthorText(authorText)) {
        authors = parseAuthors(authorText);
        // 不移动 position：让外层 parseTitleWithOptionalSubtitle 重新扫描 TYPE_INDICATOR
        // position 保持原位，外层会从当前位置找到 TYPE_INDICATOR 并跳过
      }
    }
    return { authors, position };
  }

  /**
   * 判断文本是否可能是作者信息
   * @param text 要判断的文本
   * @returns 是否可能是作者
   */
  protected isLikelyAuthorText(text: string): boolean {
    return text.includes(',') || text.includes('，') || /^[\u4e00-\u9fa5]+$/.test(text.trim());
  }

  /**
   * 解析题名（格式：题名[类型标识]）
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含题名和下一个位置
   */
  protected parseTitle(tokens: Token[], position: number): { title: string; position: number } {
    const titleText = readUntilTypeIndicator(tokens, position);
    position = findNextTypeIndicator(tokens, position);
    const title = titleText.trim().replace(/\.$/, '');
    return { title, position };
  }

  /**
   * Pattern 1：解析作者 + 题名（含可选副题名）+ 文献类型标识
   * 格式：作者. 题名[: 副题名][文献类型标识/载体标识].
   *
   * 适用于：图书[M]、期刊[J]、学位论文[D]、连续出版物[J]、会议录[C]、报纸[N]、
   *         数据集[DS]、预印本[PP]、网站/网页[EB] 等
   *
   * @param optionalAuthors 作者是否为可选（默认 false）。当为 true 时，若首段文本无顿号/逗号分隔符
   *                        且不含中文姓名特征，则视为无作者，直接从题名开始解析。
   */
  protected parseTitleWithOptionalSubtitle(
    tokens: Token[],
    position: number,
    optionalAuthors: boolean = false,
  ): { authors: Author[]; title: string; subtitle?: string; position: number } {
    // 解析作者
    const { authors, position: afterAuthors } = optionalAuthors
      ? this.parseOptionalAuthors(tokens, position)
      : this.parseRequiredAuthors(tokens, position);
    position = afterAuthors;

    // 解析题名和可选副题名（到文献类型标识为止）
    const titleEnd = findNextTypeIndicator(tokens, position);
    const fullText = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');

    let title: string;
    let subtitle: string | undefined;

    // 标准 §6 符号说明使用全角冒号 "：" (U+FF1A) 作为副题名分隔符
    // 但实际示例中：
    //   - 西文文献（例[7][8]）使用 ASCII ":" 分隔副题名
    //   - 中文古籍（例[3][4]）使用全角 "：" 作为题名内的章节/卷次标记，非副题名
    // 策略：仅对 ASCII ":" 拆分副题名，全角 "：" 保留为题名一部分
    const colonIndex = findNextColon(tokens, position);
    const hasAuthorSeparator = authors.length > 0; // 已识别到作者
    // 对于 [EB] 格式如 "作者：标题[EB/OL]"，即使没有 DOT 分隔作者，
    // 当存在 COLON 时在作者之后，也应拆分（支持全角冒号）
    const hasColonSeparator = colonIndex > position;
    if (colonIndex >= position && colonIndex < titleEnd && (hasAuthorSeparator || hasColonSeparator)) {
      const colonToken = tokens[colonIndex]!;
      // position 前的 token 是否为 DOT：若是，作者已由 DOT 分隔，
      // 此时全角冒号属于题名内部（如"昌平山水记：京东考古录"），不拆分；
      // 若否，全角冒号是作者与题名的分隔符（如"许振超：标题"），应拆分。
      const authorSeparatedByDot = position > 0 && tokens[position - 1]?.type === 'DOT';
      const shouldSplit = colonToken.value === ':' || (colonToken.value === '：' && !authorSeparatedByDot);
      if (shouldSplit) {
        // 检查冒号后是否为年份/数字范围（如"数据：2000—2020"），若是则不拆分副题名
        const nextAfterColon = tokens[colonIndex + 1];
        const isYearRange = nextAfterColon && (nextAfterColon.type === 'YEAR' || nextAfterColon.type === 'NUMBER');
        if (isYearRange) {
          // 冒号后为年份，保留完整题名为一体
          title = fullText;
        } else {
          // 冒号：拆分为题名 + 副题名
          title = this.readTextUntil(tokens, position, colonIndex).trim();
          subtitle = this.readTextUntil(tokens, colonIndex + 1, titleEnd).trim();
        }
      } else {
        // 全角冒号属于题名内部：保留完整题名
        title = fullText;
      }
    } else {
      title = fullText;
    }

    // 跳过文献类型标识
    position = titleEnd;

    return { authors, title, subtitle, position };
  }

  /**
   * Pattern 2：解析作者 + 题名 + 附加字段（用冒号分隔）+ 文献类型标识
   * 格式：作者. 题名: 附加字段[文献类型标识/载体标识].
   *
   * 适用于：报告[R]、专利[P]、档案[A] 等
   *
   * @param tokens Token 序列
   * @param position 当前位置（作者已解析完毕）
   * @param optionalAuthors 作者是否为可选（默认 false）
   * @returns 解析结果，包含作者、题名、附加字段和下一个位置
   */
  protected parseTitleWithPrefix(
    tokens: Token[],
    position: number,
    
    optionalAuthors: boolean = false,
  ): { authors: Author[]; title: string; extraField: string; subtitle?: string; position: number } {
    // 解析作者
    const authorResult = optionalAuthors
      ? this.parseOptionalAuthors(tokens, position)
      : this.parseRequiredAuthors(tokens, position);
    const { authors, position: afterAuthors } = authorResult;
    position = afterAuthors;

    // 解析题名和附加字段（到文献类型标识为止）
    const titleEnd = findNextTypeIndicator(tokens, position);
    const colonIndex = findNextColon(tokens, position);

    let title: string;
    let extraField: string;
    let subtitle: string | undefined;
    if (colonIndex >= position && colonIndex < titleEnd) {
      title = this.readTextUntil(tokens, position, colonIndex).trim().replace(/\.$/, '');
      // 检查附加字段中是否有第二个冒号（题名: 副题名: 报告编号 格式）
      const remainingTokens = tokens.slice(colonIndex + 1, titleEnd);
      const secondColonIdx = remainingTokens.findIndex(t => t.type === 'COLON');
      if (secondColonIdx >= 0) {
        // 有第二个冒号：判断中间部分是否仅为年份 token
        const betweenTokens = remainingTokens.slice(0, secondColonIdx);
        const onlyYear = betweenTokens.length === 1 && betweenTokens[0]!.type === 'YEAR';
        if (onlyYear) {
          // 年份是题名结构的一部分（如"白皮书：2023：新时代..."）
          // 第一个冒号后是年份，第二个冒号后是副题名
          subtitle = this.readTextUntil(tokens, colonIndex + secondColonIdx + 2, titleEnd).trim();
          extraField = '';
        } else {
          // 正常情况：第一个冒号后是副题名，第二个冒号后是报告编号
          subtitle = this.readTextUntil(tokens, colonIndex + 1, colonIndex + secondColonIdx + 1).trim();
          extraField = this.readTextUntil(tokens, colonIndex + secondColonIdx + 2, titleEnd).trim().replace(/\.$/, '');
        }
      } else {
        extraField = this.readTextUntil(tokens, colonIndex + 1, titleEnd).trim().replace(/\.$/, '');
        // 去掉附加字段末尾的年份 token（如 "7178999X-2006BAK04A 10/10. 2013" → "7178999X-2006BAK04A 10/10"）
        // 只匹配合理年份范围（1900-2099），避免误匹配报告编号中的数字（如 "PB 91-194001"）
        if (extraField) {
          const yearMatch = extraField.match(/\.?\s*((?:19|20)\d{2})\s*$/);
          if (yearMatch) {
            extraField = extraField.replace(yearMatch[0]!, '').trim();
          }
        }
      }
    } else {
      title = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      extraField = '';
    }

    // 跳过文献类型标识
    position = titleEnd;

    return { authors, title, extraField, subtitle, position };
  }

  /**
   * Pattern 3：解析作者 + 题名 + 比例尺 + 文献类型标识
   * 格式：作者. 题名. 比例尺[文献类型标识/载体标识].
   *
   * 适用于：地图[CM]
   *
   * @param optionalAuthors 作者是否为可选（默认 false）
   */
  protected parseMapTitleAndScale(
    tokens: Token[],
    position: number,
    optionalAuthors: boolean = false,
  ): { authors: Author[]; title: string; scale: string; position: number } {
    // 解析作者
    const authorResult = optionalAuthors
      ? this.parseOptionalAuthors(tokens, position)
      : this.parseRequiredAuthors(tokens, position);
    const { authors, position: afterAuthors } = authorResult;
    position = afterAuthors;

    // 解析题名（到第一个 DOT 之前）
    const dotAfterTitle = findNextDot(tokens, position);
    const title = this.readTextUntil(tokens, position, dotAfterTitle).trim().replace(/\.$/, '');
    position = dotAfterTitle + 1;

    // 解析比例尺（到文献类型标识之前）
    const titleEnd = findNextTypeIndicator(tokens, position);
    const scale = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');

    // 跳过文献类型标识
    position = titleEnd;

    return { authors, title, scale, position };
  }

  /**
   * 跳过文献类型标识和随后的句点
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含媒体类型和下一个位置
   */
  protected skipTypeIndicator(tokens: Token[], position: number): { mediaType?: MediaType; position: number } {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    let mediaType: MediaType | undefined;
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

    return { mediaType, position };
  }

  /**
   * 解析页码（格式：: 页码）
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含页码和下一个位置
   */
  protected parsePages(tokens: Token[], position: number): { pages: string; position: number } {
    let pages = '';
    const colonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex >= position) {
      position = colonIndex + 1;
      // 只收集冒号后的连续页码 token（NUMBER/DASH/YEAR/TEXT），遇到 URL 等非页码 token 即停止
      const pageTokens: Token[] = [];
      for (let i = position; i < tokens.length; i++) {
        const t = tokens[i]!;
        if (t.type === 'URL' || t.type === 'PID' || t.type === 'COMMA' || t.type === 'DOT') break;
        if (t.type === 'NUMBER' || t.type === 'YEAR' || t.type === 'DASH' || t.type === 'TEXT') {
          pageTokens.push(t);
        } else {
          break;
        }
      }
      if (pageTokens.length > 0) {
        pages = pageTokens.map(t => t.value).join('').replace(/\.$/, '');
      }
    }
    return { pages, position };
  }

  /**
   * 解析出版信息（格式：出版地: 出版者, 出版年）
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含出版地、出版者、出版年和下一个位置
   */
  protected parsePublisherInfo(tokens: Token[], position: number): {
    publisherPlace: string;
    publisher: string;
    year: string;
    position: number;
  } {
    let publisherPlace = '';
    let publisher = '';
    let year = '';

    const colonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
    if (colonIndex >= position) {
      publisherPlace = this.readTextUntil(tokens, position, colonIndex).trim();
      position = colonIndex + 1;

      const commaIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
      if (commaIndex >= position) {
        publisher = this.readTextUntil(tokens, position, commaIndex).trim();
        position = commaIndex + 1;

        const yearToken = tokens.slice(position).find(t => t.type === 'YEAR');
        if (yearToken) {
          year = yearToken.value;
          position = tokens.indexOf(yearToken) + 1;
        }
      } else {
        publisher = this.readTextUntil(tokens, position, tokens.length).trim();
      }
    }

    return { publisherPlace, publisher, year, position };
  }

  /**
   * 解析 DOI/PID
   * @param tokens Token 序列
   * @returns DOI/PID 字符串
   */
  protected parsePID(tokens: Token[]): string | undefined {
    const pidToken = tokens.find(t => t.type === 'PID');
    return pidToken?.value;
  }

  /**
   * 解析 URL
   * @param tokens Token 序列
   * @returns URL 字符串
   */
  protected parseURL(tokens: Token[]): string | undefined {
    const urlToken = tokens.find(t => t.type === 'URL');
    return urlToken?.value?.replace(/\.$/, '');
  }

  /**
   * 读取 Token 序列直到遇到 DOT，保留空格
   * @param tokens Token 序列
   * @param start 起始位置
   * @returns 读取的文本
   */
  protected readUntilDot(tokens: Token[], start: number): string {
    return readUntilDot(tokens, start);
  }

  /**
   * 读取 Token 序列直到遇到 TYPE_INDICATOR，保留空格
   * @param tokens Token 序列
   * @param start 起始位置
   * @returns 读取的文本
   */
  protected readUntilTypeIndicator(tokens: Token[], start: number): string {
    return readUntilTypeIndicator(tokens, start);
  }

  /**
   * 查找下一个 DOT 的位置
   * @param tokens Token 序列
   * @param start 起始位置
   * @returns DOT 的位置，如果未找到则返回 tokens.length
   */
  protected findNextDot(tokens: Token[], start: number): number {
    return findNextDot(tokens, start);
  }

  /**
   * 查找下一个 TYPE_INDICATOR 的位置
   * @param tokens Token 序列
   * @param start 起始位置
   * @returns TYPE_INDICATOR 的位置，如果未找到则返回 tokens.length
   */
  protected findNextTypeIndicator(tokens: Token[], start: number): number {
    return findNextTypeIndicator(tokens, start);
  }

  /**
   * 读取 Token 序列直到遇到 COMMA 或 YEAR，保留空格
   * @param tokens Token 序列
   * @param start 起始位置
   * @returns 读取的文本
   */
  protected readUntilCommaOrYear(tokens: Token[], start: number): string {
    let result = '';
    let lastEndPosition = -1;
    let i = start;
    while (i < tokens.length) {
      const token = tokens[i]!;
      if (token.type === 'COMMA') break;
      if (token.type === 'YEAR') break;
      if (token.type === 'TEXT') {
        if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
          result += ' ';
        }
        result += token.value;
        lastEndPosition = token.position + token.value.length;
      } else if (token.type === 'DOT') {
        result += '.';
        lastEndPosition = token.position + 1;
      } else if (token.type === 'PAREN_OPEN') {
        result += '(';
        lastEndPosition = token.position + 1;
      } else if (token.type === 'PAREN_CLOSE') {
        result += ')';
        lastEndPosition = token.position + 1;
      } else if (token.type === 'NUMBER') {
        if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
          result += ' ';
        }
        result += token.value;
        lastEndPosition = token.position + token.value.length;
      } else if (token.type === 'DASH') {
        // 连字符分隔词组，添加空格
        if (result && lastEndPosition >= 0) {
          result += ' ';
        }
        lastEndPosition = token.position + token.value.length;
      } else {
        // 非文本 token（COMMA 等）：不加入结果，但更新 lastEndPosition
        // 确保后续 TEXT token 能正确检测位置间隙并插入空格
        lastEndPosition = token.position + token.value.length;
      }
      i++;
    }
    return result;
  }

  /**
   * 查找下一个 COMMA 或 YEAR 的位置
   * @param tokens Token 序列
   * @param start 起始位置
   * @returns COMMA 或 YEAR 的位置，如果未找到则返回 tokens.length
   */
  protected findNextCommaOrYear(tokens: Token[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
      if (tokens[i]?.type === 'COMMA' || tokens[i]?.type === 'YEAR') return i;
    }
    return tokens.length;
  }

  /**
   * 读取 Token 序列直到指定结束位置，保留空格
   * @param tokens Token 序列
   * @param start 起始位置
   * @param end 结束位置
   * @returns 读取的文本
   */
  protected readTextUntil(tokens: Token[], start: number, end: number): string {
    let result = '';
    let lastEndPosition = -1;
    // 跟踪最后一个内容 token 的结束位置（不含括号等结构符号）
    let lastContentEnd = -1;
    for (let i = start; i < end; i++) {
      const token = tokens[i]!;
      if (token.type === 'TEXT') {
        if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
          result += ' ';
        }
        result += token.value;
        lastEndPosition = token.position + token.value.length;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'DOT') {
        result += '.';
        lastEndPosition = token.position + 1;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'COLON') {
        // 标准 §6 使用全角冒号，但实际著录中统一使用 ASCII 冒号
        result += ':';
        lastEndPosition = token.position + 1;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'COMMA') {
        result += ',';
        lastEndPosition = token.position + 1;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'NUMBER') {
        if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
          result += ' ';
        }
        result += token.value;
        lastEndPosition = token.position + token.value.length;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'YEAR') {
        if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
          result += ' ';
        }
        result += token.value;
        lastEndPosition = token.position + token.value.length;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'DASH') {
        result += token.value;
        lastEndPosition = token.position + token.value.length;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'SLASH') {
        result += '/';
        lastEndPosition = token.position + 1;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'DOUBLE_SLASH') {
        result += '//';
        lastEndPosition = token.position + 2;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'DATE') {
        result += token.value;
        lastEndPosition = token.position + token.value.length;
        lastContentEnd = lastEndPosition;
      } else if (token.type === 'PAREN_OPEN') {
        result += '(';
        lastEndPosition = token.position + 1;
        // PAREN_OPEN 不是内容，不更新 lastContentEnd
      } else if (token.type === 'PAREN_CLOSE') {
        result += ')';
        lastEndPosition = token.position + 1;
        // PAREN_CLOSE 不是内容，恢复 lastContentEnd 以保持后续空格检测正确
        lastEndPosition = lastContentEnd >= 0 ? lastContentEnd : token.position + 1;
      } else {
        // 未显式处理的 token：更新 lastEndPosition 以保留空格检测
        lastEndPosition = token.position + token.value.length;
      }
    }
    return result;
  }
}

/**
 * 语法解析器分发器
 * 根据 token 序列判断文献类型并路由到对应的解析器
 */
export class Parser {
  private strategies: ParserStrategy[] = [];

  /**
   * 注册解析器策略
   */
  register(strategy: ParserStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 解析 token 序列
   */
  parse(tokens: Token[], options?: ParseOptions): ParserResult {
    const warnings: string[] = [];
    const errors: ParseError[] = [];

    // 尝试每个解析器策略
    for (const strategy of this.strategies) {
      if (strategy.match(tokens)) {
        try {
          const reference = strategy.parse(tokens, options);
          return { reference, warnings, errors };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          warnings.push(`解析失败: ${message}`);
          errors.push({ code: ParseErrorCode.PARSE_ERROR, message });
        }
      }
    }

    // 如果没有匹配的解析器，尝试通用解析
    return this.parseGeneric(tokens, options);
  }

  /**
   * 通用解析（当没有匹配的专用解析器时）
   */
  private parseGeneric(tokens: Token[], options?: ParseOptions): ParserResult {
    const warnings: string[] = ['使用通用解析器，结果可能不完整'];
    const errors: ParseError[] = [{ code: ParseErrorCode.GENERIC_FALLBACK, message: '未匹配任何专用解析器，使用通用解析' }];

    // 提取基本信息
    const textTokens = tokens.filter(t => t.type === 'TEXT');
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');

    // 尝试识别文献类型
    let type = 'Z' as string;
    if (typeIndicator) {
      const typeMatch = typeIndicator.value.match(/\[(\w+)/);
      if (typeMatch) {
        type = typeMatch[1]!;
      }
    }

    // 尝试提取作者和题名
    let authors: Author[] = [];
    let title = '';

    if (textTokens.length >= 2) {
      // 假设第一个文本是作者，第二个是题名
      const authorText = textTokens[0]!.value;
      authors = parseAuthors(authorText);
      title = textTokens[1]!.value;
    } else if (textTokens.length === 1) {
      title = textTokens[0]!.value;
    }

    return {
      reference: {
        type: type as never,
        authors,
        title,
        id: options?.preserveId
          ? tokens.find(t => t.type === 'NUMBER')?.value
          : undefined,
      },
      warnings,
      errors,
    };
  }
}
