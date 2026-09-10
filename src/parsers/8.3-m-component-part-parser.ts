import type { Token, Author, MediaType } from '../types/index.js';
import type { ComponentPart, ParseOptions } from '../types/index.js';
import { BaseParser } from './base.js';
import { parseTypeIndicator, parseAuthors } from '../utils/index.js';

/**
 * 析出文献解析器
 *
 * 解析格式：`[序号] 作者. 析出文献题名//图书作者. 图书题名. 出版地: 出版者, 出版年: 析出文献页码.`
 *
 * @example
 * ```typescript
 * const input = '[1] 王五. 深度学习在自然语言处理中的应用//李四. 人工智能前沿研究. 北京: 科学出版社, 2023: 125-150.';
 * const { reference } = parse(input);
 * // reference.type === 'Z'
 * // reference.authors === [{ name: '王五' }]
 * // reference.title === '深度学习在自然语言处理中的应用'
 * // reference.host.authors === [{ name: '李四' }]
 * // reference.host.title === '人工智能前沿研究'
 * // reference.host.publisherPlace === '北京'
 * // reference.host.publisher === '科学出版社'
 * // reference.host.year === '2023'
 * // reference.pages === '125-150'
 * ```
 */
export class ComponentPartParser extends BaseParser {
  /**
   * 检查是否匹配析出文献格式
   * 析出文献的特征是包含 // 分隔符
   */
  match(tokens: Token[]): boolean {
    // 检查是否包含 // 分隔符
    if (!tokens.some(t => t.type === 'DOUBLE_SLASH')) return false;
    // [C] 会议录由 ProceedingsParser 处理
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');
    if (typeIndicator && /^\[C(\/OL)?\]$/.test(typeIndicator.value)) return false;
    return true;
  }

  /**
   * 解析析出文献
   */
  parse(tokens: Token[], _options?: ParseOptions): ComponentPart {
    let position = 0;

    // 跳过序号 [1]
    position = this.skipReferenceNumber(tokens, position);

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析析出文献作者
    // 如果文本直接以 [类型]// 开头（无作者），跳过作者解析，从 // 前提取题名
    const doubleSlashIndex = tokens.findIndex((t, i) => i >= position && t.type === 'DOUBLE_SLASH');
    const typeIndicatorSection = doubleSlashIndex >= 0 ? tokens.slice(position, doubleSlashIndex) : [];
    // 判断是否有作者：查找 [类型] 前面是否紧跟着 DOT（表示作者已结束）
    // 格式 A: 题名[类型]// （无作者）：DOT 不在 TYPE_INDICATOR 前
    // 格式 B: 作者. 题名[类型]// （有作者）：DOT 在 TYPE_INDICATOR 前，且 DOT 后有文本
    const typeIndicatorIdx = typeIndicatorSection.findIndex(t => t.type === 'TYPE_INDICATOR');
    // 有作者的条件：[类型] 前面存在 DOT，且 DOT 后还有文本（非空）
    // 格式 A: 题名[类型]// → 无 DOT，无作者
    // 格式 B: 作者. 题名[类型]// → 有 DOT 且在 [类型] 前有文本
    const dotBeforeTypeIndicator = typeIndicatorIdx >= 0 &&
      typeIndicatorSection.slice(0, typeIndicatorIdx).some(t => t.type === 'DOT');
    const hasTextAfterDot = dotBeforeTypeIndicator &&
      typeIndicatorSection.slice(0, typeIndicatorIdx).some((_token, i, arr) => {
        const dotIdx = arr.findIndex((x, j) => j <= i && x.type === 'DOT');
        return dotIdx >= 0 && arr.slice(dotIdx + 1, typeIndicatorIdx).some(x => x.type === 'TEXT' && x.value.trim());
      });
    const hasAuthor = dotBeforeTypeIndicator && hasTextAfterDot;
    let authors: Author[] = [];
    // 记录提取题名的起始位置
    let titleStart = position;
    if (hasAuthor) {
      const authorResult = this.parseRequiredAuthors(tokens, position);
      authors = authorResult.authors;
      titleStart = authorResult.position;
      position = authorResult.position;
    } else if (typeIndicatorIdx >= 0) {
      // 无作者格式：题名[类型]//主文献作者. 主文献题名...
      position = doubleSlashIndex + 1;
    } else {
      // 无法确定，回退到原来的逻辑
      const authorResult = this.parseRequiredAuthors(tokens, position);
      authors = authorResult.authors;
      titleStart = authorResult.position;
      position = authorResult.position;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析析出文献题名（到 //）
    let componentTitle = '';
    let componentType: string = 'Z'; // 默认类型
    let componentMediaType: MediaType | undefined;
    if (doubleSlashIndex >= titleStart) {
      componentTitle = this.readTextUntil(tokens, titleStart, doubleSlashIndex).trim().replace(/\.$/, '');
      // 尝试从题名中提取文献类型标识（从文本中提取）
      const typeMatch = componentTitle.match(/\[([A-Z\/]+)\]$/);
      if (typeMatch) {
        const typeIndicator = typeMatch[1];
        if (typeIndicator) {
          const parsed = parseTypeIndicator(`[${typeIndicator}]`);
          componentType = parsed.baseType || 'Z';
          componentMediaType = parsed.mediaType;
          // 移除题名中的类型标识
          componentTitle = componentTitle.replace(/\s*\[([A-Z\/]+)\]\s*$/, '').trim();
        }
      } else {
        // 检查是否在 DOUBLE_SLASH 之前有 TYPE_INDICATOR token（用 titleStart 而非 position）
        const typeIndicatorToken = tokens.slice(titleStart, doubleSlashIndex).find(t => t.type === 'TYPE_INDICATOR');
        if (typeIndicatorToken) {
          const parsed = parseTypeIndicator(typeIndicatorToken.value);
          componentType = parsed.baseType || 'Z';
          componentMediaType = parsed.mediaType;
        }
      }
      position = doubleSlashIndex + 1;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析图书作者（如果有）
    let hostAuthors: Author[] = [];
    const nextDotIndex = this.findNextDot(tokens, position);
    if (nextDotIndex > position) {
      const hostAuthorText = this.readTextUntil(tokens, position, nextDotIndex).trim();
      // 检查是否是作者（包含逗号或中文）
      if (hostAuthorText.includes(',') || hostAuthorText.includes('，') || /^[\u4e00-\u9fa5]+$/.test(hostAuthorText)) {
        hostAuthors = parseAuthors(hostAuthorText);
        position = nextDotIndex + 1;
      }
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析图书题名
    let hostTitle = '';
    const hostTitleEnd = this.findNextDot(tokens, position);
    if (hostTitleEnd > position) {
      hostTitle = this.readTextUntil(tokens, position, hostTitleEnd).trim().replace(/\.$/, '');
      position = hostTitleEnd + 1;
    }

    // 跳过空白
    position = this.skipWhitespace(tokens, position);

    // 解析出版信息（出版地: 出版者, 出版年）
    let publisherPlace = '';
    let publisher = '';
    let year = '';

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

    // 解析析出文献页码（如果有）
    const { pages } = this.parsePages(tokens, position);

    // 解析 URL
    const url = this.parseURL(tokens);

    // 解析 DOI/PID
    const pid = this.parsePID(tokens);

    return {
      type: componentType as never, // 析出文献继承原始文献类型
      authors,
      title: componentTitle,
      mediaType: componentMediaType,
      host: {
        authors: hostAuthors.length > 0 ? hostAuthors : undefined,
        title: hostTitle,
        publisherPlace: publisherPlace || undefined,
        publisher: publisher || undefined,
        year: year || undefined,
      },
      pages: pages || undefined,
      url,
      pid: pid || undefined,
    };
  }
}
