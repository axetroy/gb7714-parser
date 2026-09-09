/**
 * GB/T 7714 文献引用解析库
 *
 * @example
 * ```typescript
 * import { parse, format, validate } from 'gb7714-parser';
 *
 * // 解析
 * const result = parse('[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.');
 * console.log(result.reference);
 *
 * // 校验
 * const report = validate(result.reference);
 * console.log(report.valid);
 *
 * // 格式化
 * const str = format(result.reference);
 * console.log(str);
 * ```
 *
 * @packageDocumentation
 */

// 导出类型
export type {
  Author,
  Reference,
  ReferenceUnion,
  Journal,
  Newspaper,
  Serial,
  Book,
  Thesis,
  Proceedings,
  Report,
  Standard,
  Patent,
  WebPage,
  Archive,
  Map,
  Dataset,
  Preprint,
  ComponentPart,
  Compilation,
  ComputerProgram,
  Database,
  Other,
  HostReference,
  ParseOptions,
  FormatOptions,
  ParseResult,
  ParseError,
  ValidationReport,
  ValidationError,
  ParseCitationResult,
  CitationStyle,
  StandardVersion,
  Token,
  TokenType,
} from './types/index.js';

export { ReferenceType, MediaType, ParseErrorCode, ValidationErrorCode } from './types/index.js';

// 导出核心功能
import { tokenize } from './tokenizer/index.js';
import { Parser } from './parsers/index.js';
import { JournalParser } from './parsers/index.js';
import { NewspaperParser } from './parsers/index.js';
import { SerialParser } from './parsers/index.js';
import { BookParser } from './parsers/index.js';
import { ThesisParser } from './parsers/index.js';
import { ProceedingsParser } from './parsers/index.js';
import { ReportParser } from './parsers/index.js';
import { StandardParser } from './parsers/index.js';
import { PatentParser } from './parsers/index.js';
import { WebPageParser } from './parsers/index.js';
import { ArchiveParser } from './parsers/index.js';
import { MapParser } from './parsers/index.js';
import { DatasetParser } from './parsers/index.js';
import { PreprintParser } from './parsers/index.js';
import { ComponentPartParser } from './parsers/index.js';
import { AuthorDateParser } from './parsers/index.js';
import { ComputerProgramParser } from './parsers/index.js';
import { DatabaseParser } from './parsers/index.js';
import { validate as validateFn } from './validator/index.js';
import { format as formatFn, formatCitation as formatCitationFn } from './formatter/index.js';
import type { ReferenceUnion, ParseOptions, FormatOptions, ValidationReport, StandardVersion, ParseCitationResult, ParseResult } from './types/index.js';

// 创建默认解析器实例并注册策略
const defaultParser = new Parser();
defaultParser.register(new AuthorDateParser()); // 著者-出版年制优先
defaultParser.register(new ComponentPartParser()); // 析出文献解析器优先
defaultParser.register(new JournalParser());
defaultParser.register(new NewspaperParser());
defaultParser.register(new SerialParser()); // 连续出版物解析器
defaultParser.register(new BookParser());
defaultParser.register(new ThesisParser());
defaultParser.register(new ProceedingsParser());
defaultParser.register(new ReportParser());
defaultParser.register(new StandardParser());
defaultParser.register(new PatentParser());
defaultParser.register(new WebPageParser());
defaultParser.register(new ArchiveParser());
defaultParser.register(new MapParser());
defaultParser.register(new DatasetParser());
defaultParser.register(new PreprintParser());
defaultParser.register(new ComputerProgramParser());
defaultParser.register(new DatabaseParser());

/**
 * 解析单条参考文献
 *
 * @param input - 参考文献字符串
 * @param options - 解析选项
 * @returns 解析结果
 *
 * @example
 * ```typescript
 * // 基础用法
 * const result = parse('[1] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22.');
 * console.log(result.reference.title); // '人工智能'
 *
 * // 使用泛型获取精确类型
 * const { reference } = parse<Journal>('[1] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22.');
 * console.log(reference.journalTitle); // '现代教育技术' - 无需类型断言
 * ```
 */
export function parse<T extends ReferenceUnion = ReferenceUnion>(input: string, options?: ParseOptions): ParseResult & { reference: T } {
  const tokens = tokenize(input);
  return defaultParser.parse(tokens, options) as unknown as ParseResult & { reference: T };
}

/**
 * 批量解析参考文献
 *
 * @param inputs - 参考文献字符串数组
 * @param options - 解析选项
 * @returns 解析结果数组
 */
export function parseAll<T extends ReferenceUnion = ReferenceUnion>(inputs: string[], options?: ParseOptions): (ParseResult & { reference: T })[] {
  return inputs.map(input => parse<T>(input, options));
}

/**
 * 校验文献格式
 *
 * @param input - 文献字符串或解析后的文献对象
 * @param options - 校验选项
 * @returns 校验报告
 *
 * @example
 * ```typescript
 * // 校验字符串
 * const report = validate('[1] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22.');
 * console.log(report.valid); // true
 *
 * // 校验解析后的对象
 * const result = parse('[1] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22.');
 * const report = validate(result.reference);
 * console.log(report.valid); // true
 * ```
 */
export function validate(
  input: string | ReferenceUnion,
  options?: { version?: StandardVersion; strict?: boolean }
): ValidationReport {
  // 如果是字符串，先解析再校验
  if (typeof input === 'string') {
    const result = parse(input, { version: options?.version });
    return validateFn(result.reference, options);
  }
  return validateFn(input, options);
}

/**
 * 格式化文献对象为字符串
 *
 * @param reference - 文献对象
 * @param options - 格式化选项
 * @returns 格式化后的字符串
 *
 * @example
 * ```typescript
 * const result = parse('[1] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22.');
 * const str = format(result.reference);
 * console.log(str);
 * ```
 */
export function format(reference: ReferenceUnion, options?: FormatOptions): string {
  return formatFn(reference, options);
}

/**
 * 格式化正文引用标注
 *
 * @example
 * ```typescript
 * import { formatCitation } from 'gb7714-parser';
 *
 * // 顺序编码制
 * const ref = parse('[1] 张三. 论文[J]. 期刊, 2025.').reference;
 * console.log(formatCitation(ref)); // "[1]"
 *
 * // 著者-出版年制
 * console.log(formatCitation(ref, { citationStyle: 'author-date' })); // "(张三, 2025)"
 * ```
 */
export function formatCitation(reference: ReferenceUnion, options?: FormatOptions): string {
  return formatCitationFn(reference, options);
}

/**
 * 解析正文中的引用标注
 *
 * 支持格式：
 * - 顺序编码制：[1]、[1,2]、[1-3]
 * - 著者-出版年制：(张三, 2025)、(张三等, 2025)
 *
 * @param citation - 引用标注字符串
 * @returns 解析结果
 *
 * @example
 * ```typescript
 * import { parseCitation } from 'gb7714-parser';
 *
 * // 顺序编码制
 * const result1 = parseCitation('[1]');
 * console.log(result1.type); // 'numeric'
 * console.log(result1.ids); // ['1']
 *
 * const result2 = parseCitation('[1,2,3]');
 * console.log(result2.ids); // ['1', '2', '3']
 *
 * const result3 = parseCitation('[1-5]');
 * console.log(result3.ids); // ['1', '2', '3', '4', '5']
 *
 * // 著者-出版年制
 * const result4 = parseCitation('(张三, 2025)');
 * console.log(result4.type); // 'author-date'
 * console.log(result4.author); // '张三'
 * console.log(result4.year); // '2025'
 * ```
 */
export function parseCitation(citation: string): ParseCitationResult {
  const trimmed = citation.trim();

  // 顺序编码制：[1] 或 [1,2,3] 或 [1-5]
  const numericMatch = trimmed.match(/^\[(\d+(?:[,，]\d+)*(?:[-—]\d+)?)\]$/);
  if (numericMatch) {
    const content = numericMatch[1]!;
    const ids: string[] = [];

    // 解析逗号分隔的序号
    const parts = content.split(/[,，]/);
    for (const part of parts) {
      // 检查是否是范围（如 1-5）
      const rangeMatch = part.match(/^(\d+)[-—](\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]!, 10);
        const end = parseInt(rangeMatch[2]!, 10);
        for (let i = start; i <= end; i++) {
          ids.push(String(i));
        }
      } else {
        ids.push(part);
      }
    }

    return { type: 'numeric', ids };
  }

  // 著者-出版年制：(张三, 2025) 或 (张三等, 2025)
  const authorDateMatch = trimmed.match(/^\(([^,，]+)[,，]\s*(\d{4})\s*(?:,\s*([^)]+))?\)$/);
  if (authorDateMatch) {
    return {
      type: 'author-date',
      author: authorDateMatch[1]!.trim(),
      year: authorDateMatch[2],
      suffix: authorDateMatch[3]?.trim(),
    };
  }

  // 无法识别的格式，返回 unknown 类型并保留原始输入
  return { type: 'unknown', input: citation };
}

// 导出类以便高级用法
export {
  Parser,
  JournalParser,
  NewspaperParser,
  SerialParser,
  BookParser,
  ThesisParser,
  ProceedingsParser,
  ReportParser,
  StandardParser,
  PatentParser,
  WebPageParser,
  ArchiveParser,
  MapParser,
  DatasetParser,
  PreprintParser,
  ComponentPartParser,
  AuthorDateParser,
  ComputerProgramParser,
  DatabaseParser,
} from './parsers/index.js';
export { Validator } from './validator/index.js';
export { Formatter } from './formatter/index.js';
export { Tokenizer, tokenize } from './tokenizer/index.js';

// 导出工具函数
export { parseAuthors, formatAuthors, isValidDate, isValidYear, parseTypeIndicator, buildTypeIndicator } from './utils/index.js';
