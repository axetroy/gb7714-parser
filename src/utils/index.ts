import type { Author, MediaType, Token } from '../types/index.js';
import { MediaType as MediaTypeEnum } from '../types/index.js';

/**
 * 过滤 "et al" 和 "等" 的正则表达式
 */
const ET_AL_PATTERN = /^(etal|et\s+al\.?|等)$/i;

/**
 * 解析作者字符串
 * 支持中文作者（逗号分隔）和西文作者
 *
 * @param text - 作者字符串，多个作者用逗号分隔
 * @returns 解析结果：作者数组 + 是否截断（原文含"等"/"et al."）
 *
 * @example
 * ```typescript
 * parseAuthors('张三');           // { authors: [{name:'张三'}], truncated: false }
 * parseAuthors('张三, 李四, 王五, 等');  // { authors: [{name:'张三'},{name:'李四'},{name:'王五'}], truncated: true }
 * parseAuthors('John Smith, et al.');    // { authors: [{name:'John Smith'}], truncated: true }
 * ```
 */
export function parseAuthors(text: string): { authors: Author[]; truncated: boolean } {
  if (!text.trim()) return { authors: [], truncated: false };

  // 使用中文逗号或英文逗号分隔
  const parts = text.split(/[,，]/);

  const authors: Author[] = [];
  let truncated = false;

  for (const part of parts) {
    const name = part.trim();
    if (!name) continue;

    // 检测 "et al" 和 "等"
    if (ET_AL_PATTERN.test(name)) {
      truncated = true;
      continue;
    }

    // 检查是否是机构作者
    if (name.includes('学会') || name.includes('协会') || name.includes('研究院') ||
        name.includes('研究所') || name.includes('出版社') || name.includes('公司') ||
        name.includes('University') || name.includes('Institute') || name.includes('Society')) {
      authors.push({ name, isOrganization: true });
      continue;
    }

    // 保留原始字符串，不拆分姓名
    authors.push({ name });
  }

  return { authors, truncated };
}

/**
 * 格式化作者为字符串
 */
export function formatAuthors(authors: Author[], truncated?: boolean, locale?: 'zh' | 'en'): string {
  if (authors.length === 0) return '';

  const formatted = authors.map(a => a.name);
  // 优先使用 truncated 标志，否则按作者数量判断
  const shouldTruncate = truncated !== undefined ? truncated : formatted.length > 3;
  if (shouldTruncate) {
    const suffix = locale === 'en' ? 'et al.' : '等';
    return formatted.slice(0, 3).join(', ') + `, ${suffix}`;
  }

  return formatted.join(', ');
}

/**
 * 从 token 序列中读取文本直到遇到 DOT，保留空格
 */
export function readUntilDot(tokens: Token[], start: number): string {
  let result = '';
  let lastEndPosition = -1;
  let i = start;
  while (i < tokens.length && tokens[i]?.type !== 'DOT') {
    const token = tokens[i]!;
    if (token.type === 'TEXT') {
      if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
        result += ' ';
      }
      result += token.value;
      lastEndPosition = token.position + token.value.length;
    } else if (token.type === 'COMMA') {
      result += ',';
      lastEndPosition = token.position + 1;
    } else if (token.type === 'NUMBER') {
      if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
        result += ' ';
      }
      result += token.value;
      lastEndPosition = token.position + token.value.length;
    }
    i++;
  }
  return result;
}

/**
 * 从 token 序列中读取文本直到遇到 TYPE_INDICATOR，保留空格
 */
export function readUntilTypeIndicator(tokens: Token[], start: number): string {
  let result = '';
  let lastEndPosition = -1;
  let i = start;
  while (i < tokens.length && tokens[i]?.type !== 'TYPE_INDICATOR') {
    const token = tokens[i]!;
    if (token.type === 'TEXT') {
      if (result && lastEndPosition >= 0 && token.position > lastEndPosition) {
        result += ' ';
      }
      result += token.value;
      lastEndPosition = token.position + token.value.length;
    } else if (token.type === 'DOT') {
      result += '.';
      lastEndPosition = token.position + 1;
    } else if (token.type === 'COLON') {
      result += token.value;
      lastEndPosition = token.position + 1;
    }
    i++;
  }
  return result;
}

/**
 * 查找下一个 DOT 的位置
 */
export function findNextDot(tokens: Token[], start: number): number {
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i]?.type === 'DOT') return i;
  }
  return tokens.length;
}

/**
 * 查找下一个 TYPE_INDICATOR 的位置
 */
export function findNextTypeIndicator(tokens: Token[], start: number): number {
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i]?.type === 'TYPE_INDICATOR') return i;
  }
  return tokens.length;
}

/**
 * 查找下一个 COLON 的位置
 */
export function findNextColon(tokens: Token[], start: number): number {
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i]?.type === 'COLON') return i;
  }
  return tokens.length;
}

/**
 * 检查字符串是否是有效的日期格式
 */
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * 检查字符串是否是有效的年份格式
 */
export function isValidYear(year: string): boolean {
  return /^\d{4}$/.test(year);
}

/**
 * 截取字符串到指定长度
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * 移除字符串末尾的句点
 */
export function removeTrailingDot(str: string): string {
  return str.replace(/\.$/, '');
}

/**
 * 规范化空白字符
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * 解析类型指示符，提取基础类型和 mediaType
 * 例如："[J/OL]" -> { baseType: "J", mediaType: MediaType.OL }
 */
export function parseTypeIndicator(indicator: string): { baseType: string; mediaType?: MediaType } {
  // 移除方括号
  const content = indicator.replace(/[[\]]/g, '');

  // 分割基础类型和载体标识
  const parts = content.split('/');

  const baseType = parts[0] || '';
  let mediaType: MediaType | undefined;

  if (parts.length > 1) {
    const mediaStr = parts[1]?.toUpperCase();
    if (mediaStr && mediaStr in MediaTypeEnum) {
      mediaType = MediaTypeEnum[mediaStr as keyof typeof MediaTypeEnum];
    }
  }

  return { baseType, mediaType };
}

/**
 * 构建类型指示符字符串
 * 例如：baseType="J", mediaType=MediaType.OL -> "[J/OL]"
 * 标准 §8.9.1：标准化文件中"文献类型标识"为可选项
 */
export function buildTypeIndicator(baseType: string, mediaType?: MediaType, includeTypeIndicator: boolean = true): string {
  if (!includeTypeIndicator) {
    return '';
  }
  if (mediaType) {
    return `[${baseType}/${mediaType}]`;
  }
  return `[${baseType}]`;
}
