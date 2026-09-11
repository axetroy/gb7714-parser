import type { Token } from '../types/index.js';
import type { Serial, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 连续出版物解析器
 *
 * 解析格式：`[序号] 作者. 题名[J]. 年, 卷(期)—年, 卷(期). 出版地: 出版者, 出版年—.`
 *
 * @example
 * ```typescript
 * const input = '[1] 中国科学技术协会. 中国科学基金[J]. 1987, 1(1)—2023, 37(6). 北京: 科学出版社, 1987—.';
 * const { reference } = parse(input);
 * // reference.type === 'J'
 * // reference.authors === [{ name: '中国科学技术协会' }]
 * // reference.title === '中国科学基金'
 * // reference.serialTitle === '中国科学基金'
 * // reference.startYear === '1987'
 * // reference.startVolume === '1'
 * // reference.startIssue === '1'
 * // reference.endYear === '2023'
 * // reference.publisherPlace === '北京'
 * // reference.publisher === '科学出版社'
 * ```
 */
export class SerialParser extends BaseParser {
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
  parse(tokens: Token[], _options?: ParseOptions): Serial {    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者和题名（含可选副题名）
    // 连续出版物可能没有作者，此时第一个 DOT 前的文本是题名而非作者
    const { authors, truncated, authorComma, subtitleSeparator: _subtitleSeparator, title, subtitle, position: afterTitle } = this.parseTitleWithOptionalSubtitle(tokens, position, true);
    position = afterTitle;

    // 跳过文献类型标识 [J]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析年卷期信息（年, 卷(期)—年, 卷(期) 或 年—）
    let startYear = '';
    let startVolume = '';
    let startIssue = '';
    let endYear: string | undefined = undefined;
    let endVolume = '';
    let endIssue = '';
    let volumeSeparator: ' ' | '' = '';

    // 查找起始年份
    const yearIndex = tokens.findIndex((t, i) => i >= position && t.type === 'YEAR');
    if (yearIndex >= position) {
      startYear = tokens[yearIndex]!.value;
      position = yearIndex + 1;    }

    // 查找起始卷号（逗号后的数字，逗号应在年份后不远处）
    const commaIndex = tokens.findIndex((t, i) => i >= position && i < position + 5 && t.type === 'COMMA');
    if (commaIndex >= position) {
      position = commaIndex + 1;
      const volumeIndex = tokens.findIndex((t, i) => i >= position && t.type === 'NUMBER');
      if (volumeIndex >= position) {
        startVolume = tokens[volumeIndex]!.value;
        position = volumeIndex + 1;
      }
    }

    // 查找起始期号（括号内的内容）
    const parenOpenIndex = tokens.findIndex((t, i) => i >= position && t.type === 'PAREN_OPEN');
    if (parenOpenIndex >= position) {
      // 检测年份和括号之间是否有空格（通过位置差判断）
      if (parenOpenIndex > 0) {
        const prevToken = tokens[parenOpenIndex - 1];
        const currToken = tokens[parenOpenIndex];
        if (prevToken && currToken && currToken.position > prevToken.position + prevToken.value.length) {
          volumeSeparator = ' ';
        }
      }
      position = parenOpenIndex + 1;
      const parenCloseIndex = tokens.findIndex((t, i) => i > position && t.type === 'PAREN_CLOSE');
      if (parenCloseIndex > position) {
        startIssue = tokens.slice(position, parenCloseIndex).map(t => t.value).join('');
        position = parenCloseIndex + 1;
      }
    }

    // 处理 "年份 (期号)" 格式（无逗号无卷号）
    if (!startVolume && !startIssue) {
      const altParenOpen = tokens.findIndex((t, i) => i >= position && t.type === 'PAREN_OPEN');
      if (altParenOpen >= position) {
        // 括号内是期号
        position = altParenOpen + 1;
        const altParenClose = tokens.findIndex((t, i) => i > position && t.type === 'PAREN_CLOSE');
        if (altParenClose > position) {
          startIssue = tokens.slice(position, altParenClose).map(t => t.value).join('');
          position = altParenClose + 1;
        }
      }
    }

    // 出版信息变量（可能在 DASH 段提前赋值）
    let publisherPlace = '';
    let publisher = '';
    let publicationStartYear = '';
    let publicationEndYear = '';

    // 查找 DASH（表示连续出版物）
    const dashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DASH');
    // 防止重复处理：如果已经解析过 DASH 后的年份，跳过后续的 DASH
    if (dashIndex >= position) {
      position = dashIndex + 1;

      // 检查 DASH 后是否紧跟 DOT（—. 表示无限期发行）
      position = this.skipWhitespace(tokens, position);
      if (position < tokens.length && tokens[position]?.type === 'DOT') {
        // 无限期发行，结束年份为空
        endYear = '';
        position++; // 跳过 DOT
      } else {
        // 查找结束年份
        const endYearIndex = tokens.findIndex((t, i) => i >= position && t.type === 'YEAR');
        if (endYearIndex >= position) {
          // 检查 DASH 和 endYear 之间是否有出版信息（如 "武汉: 中华医学会湖北分会, 1984"）
          const betweenTokens = tokens.slice(position, endYearIndex);
          const betweenColonIndex = betweenTokens.findIndex(t => t.type === 'COLON');
          if (betweenColonIndex >= 0) {
            // 有出版信息：出版地在冒号前，出版者在冒号和逗号之间
            const pubPlaceEnd = betweenTokens.findIndex((t, i) => i > betweenColonIndex && (t.type === 'COMMA' || t.type === 'DOT'));
            publisherPlace = this.readTextUntil(betweenTokens, 0, betweenColonIndex).trim();
            publisher = pubPlaceEnd >= 0
              ? this.readTextUntil(betweenTokens, betweenColonIndex + 1, pubPlaceEnd).trim().replace(/\.$$/, '')
              : this.readTextUntil(betweenTokens, betweenColonIndex + 1, betweenTokens.length).trim().replace(/\.$/, '');
            publicationStartYear = tokens[endYearIndex]!.value;
            // 有出版信息时，不设置 endYear（年份属于出版信息）
          } else {
            endYear = tokens[endYearIndex]!.value;
          }
          position = endYearIndex + 1;
        } else {
          endYear = '';
        }

        // 查找结束期号（如果有）- 在年份之后的括号
        // 注意：如果已经找到出版信息，跳过此处，让后续代码处理
        if (!publisherPlace) {
        const endParenOpenIndex = tokens.findIndex((t, i) => i >= position && t.type === 'PAREN_OPEN');
        if (endParenOpenIndex >= position && endParenOpenIndex < position + 5) {
          position = endParenOpenIndex + 1;
          const endParenCloseIndex = tokens.findIndex((t, i) => i > position && t.type === 'PAREN_CLOSE');
          if (endParenCloseIndex > position) {
            endIssue = tokens.slice(position, endParenCloseIndex).map(t => t.value).join('');
            position = endParenCloseIndex + 1;
          }
        }
        }
      }
    }

    // 跳过可能的 DOT（—. 后可能还有额外的 .）
    position = this.skipWhitespace(tokens, position);
    if (position < tokens.length && tokens[position]?.type === 'DOT') {
      position++;
    }


// 查找冒号（出版地前）- 如果已经解析过出版信息，跳过
    if (!publisherPlace) {
      const colonIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COLON');
      if (colonIndex >= position) {
        // 出版地在冒号前 - 保留尾部的点（可能是缩写如 D. C.）
        publisherPlace = this.readTextUntil(tokens, position, colonIndex).trim();
        position = colonIndex + 1;
      }

      // 查找出版者（到逗号）
      const nextCommaIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
      if (nextCommaIndex >= position) {
        publisher = this.readTextUntil(tokens, position, nextCommaIndex).trim().replace(/\.$/, '');
        position = nextCommaIndex + 1;

        // 查找出版年起始
        const pubYearIndex = tokens.findIndex((t, i) => i >= position && t.type === 'YEAR');
        if (pubYearIndex >= position) {
          publicationStartYear = tokens[pubYearIndex]!.value;
          position = pubYearIndex + 1;

          // 查找出版年结束（DASH）
          const pubDashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DASH');
          if (pubDashIndex >= position) {
            position = pubDashIndex + 1;
            // 检查 DASH 后是否有年份
            const pubEndYearIndex = tokens.findIndex((t, i) => i >= position && t.type === 'YEAR');            if (pubEndYearIndex >= position) {
              publicationEndYear = tokens[pubEndYearIndex]!.value;
              position = pubEndYearIndex + 1;
            } else {
              // 无限期发行
              publicationEndYear = '';            }
          }
        }
      }
    }

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'J' as never,
      authors,
      authorsTruncated: truncated || undefined,
      title,
      subtitle,
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
      authorComma: authorComma || undefined,
      volumeSeparator: volumeSeparator || undefined,
    };
  }
}
