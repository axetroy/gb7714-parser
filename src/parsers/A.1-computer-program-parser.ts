import type { Token } from '../types/index.js';
import type { ComputerProgram, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 计算机程序解析器
 *
 * 解析格式：`[序号] 作者. 程序名[CP]. 版本. 运行环境. 出版地: 出版者, 出版年.`
 *
 * @example
 * ```typescript
 * const input = '[1] 科技公司. 图像处理软件[CP]. V2.0. Windows 10. 北京: 科技出版社, 2023.';
 * const { reference } = parse(input);
 * // reference.type === 'CP'
 * // reference.authors === [{ name: '科技公司' }]
 * // reference.title === '图像处理软件'
 * // reference.programVersion === 'V2.0'
 * // reference.runtimeEnvironment === 'Windows 10'
 * // reference.publisherPlace === '北京'
 * // reference.publisher === '科技出版社'
 * // reference.year === '2023'
 * ```
 */
export class ComputerProgramParser extends BaseParser {
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
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者
    const { authors, position: afterAuthors } = this.parseRequiredAuthors(tokens, position);
    position = afterAuthors;

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析题名
    const { title, position: afterTitle } = this.parseTitle(tokens, position);
    position = afterTitle;

    // 跳过文献类型标识 [CP]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

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

    // 解析出版信息（出版地: 出版者, 出版年）
    const { publisherPlace, publisher, year } = this.parsePublisherInfo(tokens, position);

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

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
}
