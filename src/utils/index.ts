import type { Author, MediaType } from '../types/index.js';
import { MediaType as MediaTypeEnum } from '../types/index.js';

/**
 * 解析作者字符串
 * 支持中文作者（逗号分隔）和西文作者（空格分隔姓和名）
 */
export function parseAuthors(text: string): Author[] {
  if (!text.trim()) return [];

  // 使用中文逗号或英文逗号分隔
  const parts = text.split(/[,，]/);

  const authors: Author[] = [];

  for (const part of parts) {
    const name = part.trim();
    if (!name) continue;

    // 检查是否是机构作者
    if (name.includes('学会') || name.includes('协会') || name.includes('研究院') ||
        name.includes('研究所') || name.includes('出版社') || name.includes('公司') ||
        name.includes('University') || name.includes('Institute') || name.includes('Society')) {
      authors.push({ surname: name, isOrganization: true });
      continue;
    }

    // 处理中文作者
    if (/^[\u4e00-\u9fa5·]+$/.test(name)) {
      authors.push({ surname: name });
      continue;
    }

    // 处理西文作者
    // 格式：Surname, G. 或 Surname G. 或 Surname, GivenName
    const commaParts = name.split(',');
    if (commaParts.length >= 2) {
      // Surname, GivenName 格式
      authors.push({
        surname: commaParts[0]!.trim(),
        givenName: commaParts.slice(1).join(',').trim(),
      });
      continue;
    }

    // 空格分隔：GivenName Surname 或 Surname GivenName
    const spaceParts = name.split(/\s+/);
    if (spaceParts.length >= 2) {
      // 假设最后一个是姓
      authors.push({
        surname: spaceParts[spaceParts.length - 1]!,
        givenName: spaceParts.slice(0, -1).join(' '),
      });
      continue;
    }

    authors.push({ surname: name });
  }

  return authors;
}

/**
 * 格式化作者为字符串
 */
export function formatAuthors(authors: Author[]): string {
  if (authors.length === 0) return '';

  const formatted = authors.map(a => {
    if (a.isOrganization) {
      return a.surname;
    }
    if (a.givenName) {
      return `${a.surname} ${a.givenName}`;
    }
    return a.surname;
  });

  if (formatted.length > 3) {
    return formatted.slice(0, 3).join(', ') + ', et al.';
  }

  return formatted.join(', ');
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
 */
export function buildTypeIndicator(baseType: string, mediaType?: MediaType): string {
  if (mediaType) {
    return `[${baseType}/${mediaType}]`;
  }
  return `[${baseType}]`;
}
