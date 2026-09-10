import type { Author, FormatOptions } from '../types/index.js';

/**
 * 格式化器基类
 * 提供所有类型格式化器共享的工具方法
 *
 * 对应 parsers/base.ts 的 BaseParser 角色
 */
export abstract class BaseFormatter {
  protected options: FormatOptions;

  constructor(options: FormatOptions) {
    this.options = options;
  }

  /**
   * 格式化作者列表
   * - 有 authorsTruncated 标记 → 使用原文截断文本（"等"或"et al."）
   * - 超过3个作者 → 前3个 + "等"或"et al."（根据 locale）
   * - 无责任者 → 空字符串（顺序编码制可省略，§7.1.3）
   */
  protected formatAuthors(authors: Author[], truncated?: string): string {
    if (authors.length === 0) return '';
    const formatted = authors.map(a => a.name);
    // 优先使用截断标记，否则按作者数量判断
    if (truncated !== undefined) {
      return formatted.slice(0, 3).join(', ') + ', ' + truncated;
    }
    if (formatted.length > 3) {
      const suffix = this.options.locale === 'en' ? 'et al.' : '等';
      return formatted.slice(0, 3).join(', ') + `, ${suffix}`;
    }
    return formatted.join(', ');
  }

  /**
   * 格式化年份
   * 标准 §7.5.4.1：如有其他纪年形式时，应将原有的纪年形式置于"（ ）"内
   */
  protected formatYear(year?: string, alternativeYear?: string): string {
    if (!year) return '';
    if (alternativeYear) {
      return `${year}（${alternativeYear}）`;
    }
    return year;
  }

  /**
   * 检查 URL 中是否包含永久标识符
   * 标准 §7.9.1：获取和访问路径中含永久标识符时，可不重复著录永久标识符
   */
  protected urlContainsPid(url?: string, pid?: string): boolean {
    if (!url || !pid) return false;
    // 检查 URL 中是否包含 DOI 或 PID
    const lowerUrl = url.toLowerCase();
    const lowerPid = pid.toLowerCase();
    return lowerUrl.includes(lowerPid) || lowerUrl.includes('doi.org') || lowerUrl.includes('doi:');
  }

  /**
   * 生成永久标识符后缀（如未被 URL 包含）
   * 2015 版著录为 "DOI:xxx"，2025 版著录为 "PID:xxx"
   */
  protected pidSuffix(pid?: string, url?: string): string {
    if (!pid || this.urlContainsPid(url, pid)) return '';
    return this.options.version === '2015' ? `DOI:${pid}` : `PID:${pid}`;
  }
}
