import type { Token } from '../types/index.js';
import type { Map, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';

/**
 * 地图解析器
 *
 * 解析格式：`[序号] 作者. 题名. 比例尺[CM]. 版本. 出版地: 出版者, 出版年. 尺寸.`
 *
 * @example
 * ```typescript
 * const input = '[1] 自然资源部. 中华人民共和国地图. 1:1000000[CM]. 第2版. 北京: 中国地图出版社, 2023. 120cm×90cm.';
 * const { reference } = parse(input);
 * // reference.type === 'CM'
 * // reference.authors === [{ name: '自然资源部' }]
 * // reference.title === '中华人民共和国地图'
 * // reference.scale === '1:1000000'
 * // reference.version === '第2版'
 * // reference.publisherPlace === '北京'
 * // reference.publisher === '中国地图出版社'
 * // reference.year === '2023'
 * // reference.dimensions === '120cm×90cm'
 * ```
 */
export class MapParser extends BaseParser {
  /**
   * 检查是否匹配地图格式
   */
  match(tokens: Token[]): boolean {
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (!typeIndicator) return false;

    // 检查文献类型是否是地图 [CM] 或 [CM/OL]
    return /^\[(CM|CM\/OL)\]$/.test(typeIndicator.value);
  }

  /**
   * 解析地图文献
   */
  parse(tokens: Token[], _options?: ParseOptions): Map {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析作者、题名和比例尺（到文献类型标识 [CM]）
    const { authors, title, scale, titleSeparator, position: _afterTitle } = this.parseMapTitleAndScale(tokens, position);
    // 检测作者间逗号
    let authorComma: string | undefined;
    for (let i = 0; i < _afterTitle; i++) {
      if (tokens[i]!.type === 'COMMA') {
        authorComma = tokens[i]!.value;
        break;
      }
    }

    // 跳过文献类型标识 [CM]
    const { mediaType, position: afterType } = this.skipTypeIndicator(tokens, position);
    position = afterType;

    // 检测析出文献格式 [CM]//宿主题名
    let host: import('../types/index.js').HostReference | undefined;
    const doubleSlashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DOUBLE_SLASH');
    if (doubleSlashIndex >= position) {
      position = doubleSlashIndex + 1;
      // 解析宿主信息
      const hostTitleEnd = this.findNextDot(tokens, position);
      if (hostTitleEnd > position) {
        const hostTitle = this.readTextUntil(tokens, position, hostTitleEnd).trim().replace(/\.$/, '');
        position = hostTitleEnd + 1;
        position = this.skipWhitespace(tokens, position);
        
        let hostPublisherPlace = '';
        let hostPublisher = '';
        let hostYear = '';
        const hostColonIndex = tokens.findIndex((t, i) => i >= position && (t.value === ':' || t.value === '：'));
        if (hostColonIndex >= position) {
          hostPublisherPlace = this.readTextUntil(tokens, position, hostColonIndex).trim();
          position = hostColonIndex + 1;
          const hostCommaIndex = tokens.findIndex((t, i) => i >= position && t.type === 'COMMA');
          if (hostCommaIndex >= position) {
            hostPublisher = this.readTextUntil(tokens, position, hostCommaIndex).trim();
            position = hostCommaIndex + 1;
            const hostYearToken = tokens.slice(position).find(t => t.type === 'YEAR');
            if (hostYearToken) {
              hostYear = hostYearToken.value;
              position = tokens.indexOf(hostYearToken) + 1;
            }
          }
        }
        
        host = {
          title: hostTitle,
          publisherPlace: hostPublisherPlace || undefined,
          publisher: hostPublisher || undefined,
          year: hostYear || undefined,
        };
      }
    }

    // 解析版本（如果有）
    let version: string | undefined;
    const versionEnd = this.findNextDot(tokens, position);
    if (versionEnd > position) {
      const versionText = this.readTextUntil(tokens, position, versionEnd).trim();
      if (versionText && !versionText.includes(':') && !versionText.includes('：')) {
        version = versionText;
        position = versionEnd + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析出版信息（出版地: 出版者, 出版年）
    let publisherPlace = '';
    let publisher = '';
    let year = '';
    let pages = '';

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
          // 检查年份后是否有页码（如 "1982: 6"）
          position = this.skipWhitespace(tokens, position);
          if (tokens[position]?.type === 'COLON') {
            position++;
            position = this.skipWhitespace(tokens, position);
            const pageToken = tokens[position];
            if (pageToken && pageToken.type === 'NUMBER') {
              pages = pageToken.value.replace(/\.$/, '');
              position++;
            }
          }
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

    // 解析尺寸（如果有）
    let dimensions: string | undefined;
    const dimensionsText = this.readTextUntil(tokens, position, tokens.length).trim();
    if (dimensionsText && /\d+\s*cm/.test(dimensionsText)) {
      dimensions = dimensionsText.replace(/\.$/, '');
    }

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: 'CM' as never,
      authors,
      
      title,
      scale: scale || undefined,
      titleSeparator: titleSeparator || undefined,
      authorComma: authorComma || undefined,
      version,
      publisherPlace: publisherPlace || undefined,
      publisher: publisher || undefined,
      pages: pages || undefined,
      year: year || undefined,
      dimensions,
      url,
      pid: pid || undefined,
      host,
      mediaType,
    };
  }
}
