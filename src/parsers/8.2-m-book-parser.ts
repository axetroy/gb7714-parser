import type { Token } from '../types/index.js';
import type { Book, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 图书解析器
 *
 * 解析格式：`[序号] 作者. 书名[M]. 出版地: 出版者, 年份: 页码.`
 *
 * @example
 * ```typescript
 * const input = '[1] 周志华. 机器学习[M]. 北京: 清华大学出版社, 2016: 420.';
 * const { reference } = parse(input);
 * // reference.type === 'M'
 * // reference.authors === [{ name: '周志华' }]
 * // reference.title === '机器学习'
 * // reference.publisherPlace === '北京'
 * // reference.publisher === '清华大学出版社'
 * // reference.year === '2016'
 * // reference.pages === '420'
 * ```
 *
 * @example
 * ```typescript
 * // 英文图书
 * const input = '[2] Goodfellow I, Bengio Y, Courville A. Deep learning[M]. MIT press, 2016.';
 * const { reference } = parse(input);
 * // reference.authors.length === 3
 * ```
 *
 * @example
 * ```typescript
 * // 带版本的图书
 * const input = '[3] authors. Programming language[M]. 3rd ed. Publisher, 2020.';
 * const { reference } = parse(input);
 * // reference.version === '3rd ed'
 * ```
 */
export class BookParser extends BaseParser {
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
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    const { authors, truncated, authorComma, subtitleSeparator, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [M] 和随后的 .
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析版本（如果有）
    // 标准 §7.4: 版本宜用阿拉伯数字、序数缩写形式或其他标识表示
    // 支持格式: "第3版", "3版", "新1版", "V1.0", "3rd ed", "Rev. ed", "修订版", "刻本", "影印本" 等
    // 注意：skipTypeIndicator 已跳过 [M] 后的 DOT，所以 position 指向 DOT 后的第一个 token
    let version: string | undefined;
    const versionPattern = /^(第?\d+\s*版|新\d+\s*版|V\d+\.\d+|[0-9]+(?:st|nd|rd|th)\s*ed|Rev\.\s*ed\.?|修订版|新版|刻本|影印本)$/i;
    // 保存当前 position，以便回退
    const versionStartPos = position;
    // 收集连续的 NUMBER/TEXT/DOT token 直到遇到分隔符
    const versionTokens: Token[] = [];
    while (position < tokens.length) {
      const t = tokens[position]!;
      if (t.type === 'COMMA' || t.type === 'COLON') break;
      if (t.type === 'DOT') {
        // 允许 DOT 在版本字符串内部（如 "Rev. ed."）
        versionTokens.push(t);
        position++;
      } else if (t.type === 'NUMBER' || t.type === 'TEXT') {
        versionTokens.push(t);
        position++;
      } else {
        break;
      }
    }
    // 检查收集到的 token 组合是否匹配版本模式
    // 使用原始 token 值拼接，保留原始间距（如 "2 版" 中的空格）
    let versionCandidate = '';
    for (let j = 0; j < versionTokens.length; j++) {
      if (j > 0) {
        const prev = versionTokens[j - 1]!;
        const curr = versionTokens[j]!;
        const gap = curr.position - (prev.position + prev.value.length);
        versionCandidate += ' '.repeat(Math.max(0, gap));
      }
      versionCandidate += versionTokens[j]!.value;
    }
    if (versionTokens.length > 0 && versionPattern.test(versionCandidate)) {
      version = versionCandidate;
      // 跳过版本后的 DOT（如果有）
      if (tokens[position]?.type === 'DOT') position++;
      position = this.skipWhitespace(tokens, position);
    } else {
      // 不是版本，回退到 versionStartPos
      position = versionStartPos;
    }

    // 解析译者（如果有）
    // 格式：在版本之后、出版信息之前，查找 "姓名，译." 或 "姓名 译." 模式
    let otherAuthors: import('../types/index.js').Author[] | undefined;
    const translatorMatch = this.parseTranslator(tokens, position);
    if (translatorMatch) {
      otherAuthors = translatorMatch.authors;
      position = translatorMatch.position;
    }

    // 再次尝试解析版本（译者可能在版本之前，如"译. 2 版."）
    if (!version) {
      const vStart = position;
      const vTokens: Token[] = [];
      while (position < tokens.length) {
        const t = tokens[position]!;
        if (t.type === 'DOT' || t.type === 'COMMA' || t.type === 'COLON') break;
        if (t.type === 'NUMBER' || t.type === 'TEXT') {
          vTokens.push(t);
          position++;
        } else {
          break;
        }
      }
      let vCandidate = '';
      for (let j = 0; j < vTokens.length; j++) {
        if (j > 0) {
          const prev = vTokens[j - 1]!;
          const curr = vTokens[j]!;
          const gap = curr.position - (prev.position + prev.value.length);
          vCandidate += ' '.repeat(Math.max(0, gap));
        }
        vCandidate += vTokens[j]!.value;
      }
      if (vTokens.length > 0 && versionPattern.test(vCandidate)) {
        version = vCandidate;
        if (tokens[position]?.type === 'DOT') position++;
        position = this.skipWhitespace(tokens, position);
      } else {
        position = vStart;
      }
    }

    // 解析出版信息（出版地: 出版者, 年份: 页码）
    const publisherInfo = this.readPublisherInfo(tokens, position);
    const publisherPlace = publisherInfo.place;
    const publisher = publisherInfo.publisher;
    const year = publisherInfo.year;
    const alternativeYear = publisherInfo.alternativeYear;

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
          // 保留原始间距（如"序 2-3"中的空格）
          let pageStr = '';
          for (let j = 0; j < pageTokens.length; j++) {
            if (j > 0) {
              const prev = pageTokens[j - 1]!;
              const curr = pageTokens[j]!;
              const gap = curr.position - (prev.position + prev.value.length);
              pageStr += ' '.repeat(Math.max(0, gap));
            }
            pageStr += pageTokens[j]!.value;
          }
          pages = pageStr.replace(/\.$/, '');
        }
      }
    }

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    // 解析 URL（如果有）
    const url = this.parseURL(tokens);

    return {
      type: 'M' as never,
      authors,
      authorsTruncated: truncated || undefined,
      authorComma,
      subtitleSeparator,
      title,
      subtitle,
      publisherPlace: publisherPlace || undefined,
      publisher: publisher || undefined,
      year: year || undefined,
      alternativeYear: alternativeYear || undefined,
      version,
      pages,
      pid: pid || undefined,
      mediaType,
      otherAuthors,
      url,
    };
  }

  /**
   * 解析译者（其他责任者）
   * 格式：在版本之后、出版信息之前，查找 "姓名，译." 或 "姓名 译." 模式
   */
  private parseTranslator(tokens: Token[], position: number): { authors: import('../types/index.js').Author[]; position: number } | undefined {
    // 查找 "译" 关键词
    const translatorIndex = tokens.findIndex((t, i) =>
      i >= position && t.type === 'TEXT' && /译$/.test(t.value.trim())
    );
    if (translatorIndex < position) return undefined;

    // 往前找译者姓名边界：停止在 DOT/COMMA/COLON 之前的位置
    let start = translatorIndex;
    while (start > position) {
      const prev = tokens[start - 1]!;
      if (prev.type === 'DOT' || prev.type === 'COLON') break;
      // 跳过 COMMA（包括全角），继续向前
      if (prev.type === 'COMMA') {
        start--;
        continue;
      }
      // 是 TEXT/NUMBER 等有效 token，继续向前
      start--;
    }

    // 提取所有文本 token（包括逗号和"译"）作为译者姓名
    const nameTokens = tokens.slice(start, translatorIndex + 1);
    if (nameTokens.length === 0) return undefined;

    // 拼接姓名：TEXT token 直接拼接，COMMA token 替换为对应分隔符
    const nameParts = nameTokens.map(t => {
      if (t.type === 'COMMA') return '，';
      return t.value;
    });
    const name = nameParts.join('').replace(/[，,。.]+$/, '').trim();
    if (!name) return undefined;

    // 跳过 "译" 和随后的 DOT
    let pos = translatorIndex + 1;
    pos = this.skipWhitespace(tokens, pos);
    if (tokens[pos]?.type === 'DOT') pos++;

    return {
      authors: [{ name }],
      position: pos,
    };
  }

  private readPublisherInfo(tokens: Token[], start: number): {
    place: string;
    publisher: string;
    year: string;
    alternativeYear?: string;
  } {
    let place = '';
    let publisher = '';
    let year = '';
    let alternativeYear: string | undefined;

    let i = start;
    let phase: 'place' | 'publisher' | 'year' = 'place';
    let lastEndPosition = -1;
    let yearFound = false;

    while (i < tokens.length) {
      const token = tokens[i]!;

      // 冒号：从出版地切换到出版者
      if (token.value === ':' || token.value === '：') {
        if (phase === 'place') {
          phase = 'publisher';
          lastEndPosition = -1;
        }
        i++;
        continue;
      }

      // 逗号：从出版者切换到年份（出版地中的逗号保留）
      if (token.type === 'COMMA' || token.value === '，') {
        if (phase === 'publisher' && yearFound) {
          phase = 'year';
          lastEndPosition = -1;
        } else if (phase === 'place') {
          // 检查后面是否有冒号，如果有则逗号是出版地的一部分（如 "Cambridge, Mass.:"）
          // 如果没有冒号，逗号只是分隔符（如 "Oxford university press, 2016"）
          const remainingTokens = tokens.slice(i + 1);
          const hasColon = remainingTokens.some(t => t.type === 'COLON');
          if (hasColon) {
            place += ',';
          }
        } else if (phase === 'publisher') {
          // 检查逗号后是否是年份，如果是则不添加逗号（由格式化器处理）
          const nextToken = tokens[i + 1];
          if (nextToken && nextToken.type === 'YEAR') {
            // 逗号是出版者和年份之间的分隔符，不添加到publisher
          } else {
            // 逗号是出版者的一部分（如 "Group, Inc."）
            publisher += ',';
          }
        }
        lastEndPosition = token.position + token.value.length;
        i++;
        continue;
      }

      // 年份：记录年份并开始收集替代年份
      if (token.type === 'YEAR') {
        year = token.value;
        yearFound = true;
        // 如果在出版者阶段遇到年份，切换到年份阶段
        if (phase === 'publisher') {
          phase = 'year';
          lastEndPosition = -1;
        }
        i++;
        // 检查年份后面是否有括号内容作为替代年份
        // 跳过空白和可能的逗号
        let j = i;
        while (j < tokens.length && tokens[j]!.type === 'TEXT' && /\s/.test(tokens[j]!.value)) j++;
        if (j < tokens.length && tokens[j]!.type === 'PAREN_OPEN') {
          // 收集括号内的内容（保留原始括号字符）
          const altYearTokens: Token[] = [];
          j++; // skip PAREN_OPEN
          while (j < tokens.length && tokens[j]!.type !== 'PAREN_CLOSE') {
            altYearTokens.push(tokens[j]!);
            j++;
          }
          const altYearText = altYearTokens.map(t => t.value).join('');
          if (altYearText) {
            // 保留原始括号（如 "(清同治四年)" 或 "（清同治四年）"）
            // j 当前指向 PAREN_CLOSE，所以关闭括号在 j-1
            const openParen = tokens[j - altYearTokens.length - 1]!.value;
            const closeParen = tokens[j]!.value;
            alternativeYear = openParen + altYearText + closeParen;
          }
          i = j + 1; // skip PAREN_CLOSE
          continue;
        }
        continue;
      }

      // 替代年份的括号内容已在上面处理，跳过
      if (yearFound && token.type === 'PAREN_OPEN') {
        i++;
        continue;
      }
      if (yearFound && token.type === 'PAREN_CLOSE') {
        i++;
        continue;
      }

      if (token.type === 'TEXT') {
        // 计算与上一个 token 之间的空格数
        const gap = lastEndPosition >= 0 ? token.position - lastEndPosition : 0;
        const spaces = gap > 0 ? ' '.repeat(gap) : '';

        if (phase === 'place') {
          if (token.type === 'COMMA' || token.value === '，') {
            place += ',';
          } else {
            place += spaces + token.value;
          }
          lastEndPosition = token.position + token.value.length;
        } else if (phase === 'publisher') {
          publisher += spaces + token.value;
          lastEndPosition = token.position + token.value.length;
        }
      } else if (token.type === 'DASH' || token.type === 'SLASH') {
        // DASH（如 McGraw-Hill）、SLASH（如 Health/Lippincott）不加空格前缀
        if (phase === 'place') {
          place += token.value;
          lastEndPosition = token.position + token.value.length;
        } else if (phase === 'publisher') {
          publisher += token.value;
          lastEndPosition = token.position + token.value.length;
        }
      } else if (token.type === 'BRACKET_OPEN' || token.type === 'BRACKET_CLOSE') {
        // 方括号内容（如 [S.l.]）保留在出版地中
        if (phase === 'place') {
          place += token.value;
          lastEndPosition = token.position + token.value.length;
        }
      } else if (token.type === 'DOT' && !yearFound) {
        // 缩写点号（如 "Mass."、"Inc."）保留在当前位置
        if (phase === 'place') {
          place += '.';
          lastEndPosition = token.position + 1;
        } else if (phase === 'publisher') {
          publisher += '.';
          lastEndPosition = token.position + 1;
        }
      }

      i++;
    }

    return { place: place.trim(), publisher: publisher.trim(), year, alternativeYear };
  }
}
