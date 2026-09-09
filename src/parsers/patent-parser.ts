import type { Token } from '../types/index.js';
import type { Patent, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 专利解析器
 *
 * 解析格式：`[序号] 发明人. 题名: 专利申请号[P]. 公告日期.`
 *
 * @example
 * ```typescript
 * const input = '[1] 赵六. 一种基于深度学习的图像识别方法: CN202310123456[P]. 2023-06-15.';
 * const { reference } = parse(input);
 * // reference.type === 'P'
 * // reference.authors === [{ name: '赵六' }]
 * // reference.title === '一种基于深度学习的图像识别方法'
 * // reference.patentNumber === 'CN202310123456'
 * // reference.announceDate === '2023-06-15'
 * ```
 */
export class PatentParser extends BaseParser {
  /**
   * 检查是否匹配专利格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是专利 [P] 或 [P/OL]
    return /^\[(P|P\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析专利文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Patent {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析发明人
    const { authors, position: afterAuthors } = this.parseRequiredAuthors(tokens, position);
    position = afterAuthors;

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名和专利申请号（到文献类型标识 [P]）
    let title = '';
    let patentNumber = '';
    const titleEnd = this.findNextTypeIndicator(tokens, position);

    // 查找冒号来分离题名和专利申请号
    const colonIndex = tokens.findIndex((t, i) => i >= position && i < titleEnd && (t.value === ':' || t.value === '：'));

    if (colonIndex >= position && colonIndex < titleEnd) {
      title = this.readTextUntil(tokens, position, colonIndex).trim().replace(/\.$/, '');
      position = colonIndex + 1;
      patentNumber = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '').replace(/\.\d+$/, '');
      position = titleEnd;
    } else {
      title = this.readTextUntil(tokens, position, titleEnd).trim().replace(/\.$/, '');
      position = titleEnd;
    }

    // 跳过文献类型标识 [P]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 解析公告日期
    let announceDate = '';
    const dateToken = tokens.slice(position).find(t => t.type === 'DATE');
    if (dateToken) {
      announceDate = dateToken.value;
      position = tokens.indexOf(dateToken) + 1;
    }

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'P' as never,
      authors,
      title,
      patentNumber: patentNumber || '',
      announceDate: announceDate || undefined,
      url,
      pid: pid || undefined,
      mediaType,
    };
  }
}
