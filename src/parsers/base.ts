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
   * 检测 position 与下一个 TYPE_INDICATOR 之间是否存在 DOT（作者与题名的分隔符）。
   * 标准著录格式为「主要责任者. 题名[类型标识]」；若类型标识之前没有 DOT，
   * 说明该文献无主要责任者，著录直接从题名开始（如标准 B.1 示例[8]「康熙字典：巳集上 水部[M]」、
   * B.8 标准文献「GB/T 3792—2021 信息与文献 资源描述[S]」）。
   *
   * @param tokens Token 序列
   * @param position 当前位置（序号之后）
   * @returns 是否存在作者分隔符（DOT）
   */
  protected hasAuthorSeparator(tokens: Token[], position: number): boolean {
    const typeIndicatorIndex = findNextTypeIndicator(tokens, position);
    for (let i = position; i < typeIndicatorIndex && i < tokens.length; i++) {
      if (tokens[i]?.type === 'DOT') return true;
    }
    return false;
  }

  /**
   * 解析必有作者（格式：作者.）
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含作者数组和下一个位置
   */
  protected parseRequiredAuthors(tokens: Token[], position: number): { authors: Author[]; truncated: string | undefined; position: number; preDotText?: string } {
    const authorsText = readUntilDot(tokens, position);
    position = findNextDot(tokens, position) + 1;
    const { authors, truncated } = parseAuthors(authorsText);
    return { authors, truncated, position };
  }

  /**
   * 解析可选作者（格式：作者. 或 直接是题名）
   * @param tokens Token 序列
   * @param position 当前位置
   * @returns 解析结果，包含作者数组和下一个位置
   */
  protected parseOptionalAuthors(tokens: Token[], position: number): { authors: Author[]; truncated: string | undefined; position: number; preDotText?: string } {
    let authors: Author[] = [];
    let truncated: string | undefined;
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
        // 若文本含全角括号（如"机构（分支）"），更可能是题名而非作者
        const authorText = beforeDot.trim();
        const hasParen = authorText.includes('\uFF08') || authorText.includes('\uFF09');
        if (hasParen) {
          // 不是作者，将 DOT 前文本纳入题名范围
          position = dotIndex + 1;
          return { authors, truncated: truncated || undefined, position, preDotText: authorText };
        } else {
          const { authors: _a2, truncated: _t2 } = parseAuthors(authorText);
          authors = _a2;
          truncated = _t2 || undefined;
          position = dotIndex + 1;
        }
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
        const { authors: _a2, truncated: _t2 } = parseAuthors(authorText);
        authors = _a2;
        truncated = _t2 || undefined;
        // 不移动 position：让外层 parseTitleWithOptionalSubtitle 重新扫描 TYPE_INDICATOR
        // position 保持原位，外层会从当前位置找到 TYPE_INDICATOR 并跳过
      }
    }
    return { authors, truncated, position };
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
  ): { authors: Author[]; truncated: string | undefined; title: string; subtitle?: string; position: number } {
    // 无作者检测：类型标识 [X] 之前没有 DOT 时，著录直接从题名开始，
    // 此时不能把题名文本误解析为作者（标准 B.1 示例[8]「康熙字典：巳集上 水部[M]」等）。
    // 例外：当 optionalAuthors=true 且存在 COLON（如"作者：标题"格式）时，允许解析作者。
    const noDot = !this.hasAuthorSeparator(tokens, position);
    const hasColonBeforeType = (() => {
      const ti = findNextTypeIndicator(tokens, position);
      return tokens.slice(position, ti).some(t => t.type === 'COLON');
    })();
    const noAuthor = noDot && !(optionalAuthors && hasColonBeforeType);

    // 解析作者
    const authorResult = noAuthor
      ? { authors: [] as Author[], truncated: undefined, position, preDotText: undefined as string | undefined }
      : optionalAuthors
        ? this.parseOptionalAuthors(tokens, position)
        : this.parseRequiredAuthors(tokens, position);
    const { authors, truncated, position: afterAuthors, preDotText } = authorResult;
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
      // 无作者模式（noAuthor）下没有 DOT 分隔作者，全角冒号视为题名内部符号
      // （如无作者图书"康熙字典：巳集上 水部[M]"，"巳集上 水部"是卷次而非副题名）；
      // ASCII 冒号始终拆分副题名（与有作者路径一致，如"中国铁路史: 1876-1949[M]"）；
      // 全角冒号在有作者时应拆分副题名（标准 §6.2："："用于其他题名信息）
      const shouldSplit = colonToken.value === ':' || (colonToken.value === '：' && !noAuthor);
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

    // 若 parseOptionalAuthors 检测到 DOT 前有含括号的题名文本，将其前缀加入题名
    if (preDotText && title) {
      title = preDotText + '. ' + title;
    }

    // 跳过文献类型标识
    position = titleEnd;

    return { authors, truncated, title, subtitle, position };
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
  ): { authors: Author[]; truncated: string | undefined; title: string; extraField: string; subtitle?: string; position: number } {
    // 无作者检测：类型标识前没有 DOT 时，著录直接从题名开始，
    // 不能把题名文本误解析为作者。例外：optionalAuthors=true 且存在 COLON 时允许解析作者。
    const noDot = !this.hasAuthorSeparator(tokens, position);
    const hasColonBeforeType = (() => {
      const ti = findNextTypeIndicator(tokens, position);
      return tokens.slice(position, ti).some(t => t.type === 'COLON');
    })();
    const noAuthor = noDot && !(optionalAuthors && hasColonBeforeType);

    // 解析作者
    const authorResult = noAuthor
      ? { authors: [] as Author[], truncated: undefined, position }
      : optionalAuthors
        ? this.parseOptionalAuthors(tokens, position)
        : this.parseRequiredAuthors(tokens, position);
    const { authors, truncated, position: afterAuthors } = authorResult;
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

    return { authors, truncated, title, extraField, subtitle, position };
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
  ): { authors: Author[]; truncated: string | undefined; title: string; scale?: string; position: number } {
    // 无作者检测：类型标识前没有 DOT 时，著录直接从题名开始，
    // 不能把题名文本误解析为作者。例外：optionalAuthors=true 且存在 COLON 时允许解析作者。
    const noDot = !this.hasAuthorSeparator(tokens, position);
    const hasColonBeforeType = (() => {
      const ti = findNextTypeIndicator(tokens, position);
      return tokens.slice(position, ti).some(t => t.type === 'COLON');
    })();
    const noAuthor = noDot && !(optionalAuthors && hasColonBeforeType);

    // 解析作者
    const authorResult = noAuthor
      ? { authors: [] as Author[], truncated: undefined, position }
      : optionalAuthors
        ? this.parseOptionalAuthors(tokens, position)
        : this.parseRequiredAuthors(tokens, position);
    const { authors, truncated, position: afterAuthors } = authorResult;
    position = afterAuthors;

    // 解析题名（到第一个 DOT、COLON 或 TYPE_INDICATOR 之前，取较前者）
    // COLON 分隔副题名/卷次，不应包含在题名中
    const dotAfterTitle = findNextDot(tokens, position);
    const typeIndicatorPos = findNextTypeIndicator(tokens, position);
    const colonPos = tokens.findIndex((t, i) => i >= position && t.type === 'COLON');
    const titleEndPos = Math.min(
      typeIndicatorPos,
      dotAfterTitle,
      colonPos >= 0 ? colonPos : tokens.length,
    );
    let title = this.readTextUntil(tokens, position, titleEndPos).trim().replace(/\.$/, '');
    position = titleEndPos;

    // 解析比例尺：在 TYPE_INDICATOR 之前、DOT 之后的文本
    // 情况1：TYPE_INDICATOR 紧跟题名（如 "题名[CM]."）→ 无比例尺
    // 情况2：题名后有点号再是比例尺（如 "题名. 比例尺[CM]."）
    let scale: string | undefined = undefined;
    if (tokens[position]?.type === 'TYPE_INDICATOR') {
      // 类型标识紧跟题名，无比例尺
      position++; // 跳过 [CM]
      if (tokens[position]?.type === 'DOT') position++; // 跳过 .
    } else {
      // 跳过当前位置的 DOT（如果有的话），再找下一个分隔符
      if (tokens[position]?.type === 'DOT') position++;
      const scaleEnd = Math.min(
        findNextDot(tokens, position),
        findNextTypeIndicator(tokens, position),
      );
      const scaleText = this.readTextUntil(tokens, position, scaleEnd).trim().replace(/\.$/, '');
      // 判断是否为比例尺：包含冒号或纯数字模式（如 "1:25 000"）
      // 不含冒号但有中文的（如 "第 2 册"）视为题名的一部分
      if (scaleText && /[:：]/.test(scaleText)) {
        scale = scaleText;
      } else if (scaleText && /^\d/.test(scaleText)) {
        // 纯数字开头可能是比例尺
        scale = scaleText;
      } else {
        // 非比例尺文本（如卷次），合并入题名
        title = title + '. ' + scaleText;
      }
      position = scaleEnd;
      if (tokens[position]?.type === 'TYPE_INDICATOR') position++;
      if (tokens[position]?.type === 'DOT') position++;
    }

    return { authors, truncated, title, scale, position };
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
    } else {
      // 无类型标识时的 EB 回退检测：(DATE) [DATE]. URL 模式（标准 §8.11 无类型标识示例）
      const hasParenDate = tokens.some(t => t.type === 'PAREN_OPEN');
      const hasBracketDate = tokens.some(t => t.type === 'BRACKET_OPEN' && t.value === '[');
      const hasURL = tokens.some(t => t.type === 'URL');
      if (hasParenDate && hasBracketDate && hasURL) {
        type = 'EB';
      }
    }

    // 尝试提取作者和题名
    let authors: Author[] = [];
    let _truncated = false;
    let title = '';
    let createDate: string | undefined;
    let accessDate: string | undefined;
    let url: string | undefined;

    if (textTokens.length >= 2) {
      // 假设第一个文本是作者，第二个是题名
      const authorText = textTokens[0]!.value;
      const { authors: _ga, truncated: _gt } = parseAuthors(authorText);
      authors = _ga;
      title = textTokens[1]!.value;
    } else if (textTokens.length === 1) {
      title = textTokens[0]!.value;
    }

    // EB 回退：提取创建日期、引用日期和 URL
    if (type === 'EB') {
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]!;
        if (t.type === 'PAREN_OPEN') {
          const next = tokens[i + 1];
          if (next?.type === 'DATE') {
            createDate = next.value;
          }
        }
        if (t.type === 'BRACKET_OPEN' && i + 1 < tokens.length && tokens[i + 1]?.type === 'DATE') {
          accessDate = tokens[i + 1]!.value;
        }
        if (t.type === 'URL') {
          url = t.value.replace(/\.$/, '');
        }
      }
      errors.shift(); // 移除 GENERIC_FALLBACK 错误，EB 回退属于正常解析
      warnings.shift(); // 移除通用解析警告
    }

    return {
      reference: {
        type: type as never,
        authors,
        title,
        createDate,
        accessDate,
        url,
        id: options?.preserveId
          ? tokens.find(t => t.type === 'NUMBER')?.value
          : undefined,
        authorsTruncated: _truncated || undefined,
      },
      warnings,
      errors,
    };
  }
}
