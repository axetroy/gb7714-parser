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
  ValidationReport,
  ValidationError,
  CitationStyle,
  StandardVersion,
  Token,
  TokenType,
} from './types/index.js';

export { ReferenceType, MediaType } from './types/index.js';

// 导出核心功能
import { tokenize } from './tokenizer/index.js';
import { Parser } from './parsers/index.js';
import { JournalParser } from './parsers/index.js';
import { NewspaperParser } from './parsers/index.js';
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
import { validate as validateFn } from './validator/index.js';
import { format as formatFn } from './formatter/index.js';
import type { ReferenceUnion, ParseOptions, FormatOptions, ValidationReport, StandardVersion } from './types/index.js';

// 创建默认解析器实例并注册策略
const defaultParser = new Parser();
defaultParser.register(new AuthorDateParser()); // 著者-出版年制优先
defaultParser.register(new ComponentPartParser()); // 析出文献解析器优先
defaultParser.register(new JournalParser());
defaultParser.register(new NewspaperParser());
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
export function parse<T extends ReferenceUnion = ReferenceUnion>(input: string, options?: ParseOptions): { reference: T; warnings: string[] } {
  const tokens = tokenize(input);
  return defaultParser.parse(tokens, options) as { reference: T; warnings: string[] };
}

/**
 * 批量解析参考文献
 *
 * @param inputs - 参考文献字符串数组
 * @param options - 解析选项
 * @returns 解析结果数组
 */
export function parseAll<T extends ReferenceUnion = ReferenceUnion>(inputs: string[], options?: ParseOptions): { reference: T; warnings: string[] }[] {
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

// 导出类以便高级用法
export {
  Parser,
  JournalParser,
  NewspaperParser,
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
} from './parsers/index.js';
export { Validator } from './validator/index.js';
export { Formatter } from './formatter/index.js';
export { Tokenizer, tokenize } from './tokenizer/index.js';

// 导出工具函数
export { parseAuthors, formatAuthors, isValidDate, isValidYear, parseTypeIndicator, buildTypeIndicator } from './utils/index.js';
