import type { Token, Author } from '../types/index.js';
import type { ReferenceUnion, ParseOptions } from '../types/index.js';
import { parseAuthors } from '../utils/index.js';

/**
 * 解析器策略接口
 * 每种文献类型实现此接口
 */
export interface ParserStrategy {
  /**
   * 检查 token 序列是否匹配此解析器
   */
  match(tokens: Token[]): boolean;

  /**
   * 解析 token 序列为文献对象
   */
  parse(tokens: Token[], options?: ParseOptions): ReferenceUnion;
}

/**
 * 解析结果
 */
export interface ParserResult {
  reference: ReferenceUnion;
  warnings: string[];
}

/**
 * 语法解析器分发器
 * 根据 token 序列判断文献类型并路由到对应的解析器
 */
export class Parser {
  private strategies: ParserStrategy[] = [];

  /**
   * 注册解析器策略
   */
  register(strategy: ParserStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 解析 token 序列
   */
  parse(tokens: Token[], options?: ParseOptions): ParserResult {
    const warnings: string[] = [];

    // 尝试每个解析器策略
    for (const strategy of this.strategies) {
      if (strategy.match(tokens)) {
        try {
          const reference = strategy.parse(tokens, options);
          return { reference, warnings };
        } catch (error) {
          warnings.push(`解析失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // 如果没有匹配的解析器，尝试通用解析
    return this.parseGeneric(tokens, options);
  }

  /**
   * 通用解析（当没有匹配的专用解析器时）
   */
  private parseGeneric(tokens: Token[], options?: ParseOptions): ParserResult {
    const warnings: string[] = ['使用通用解析器，结果可能不完整'];

    // 提取基本信息
    const textTokens = tokens.filter(t => t.type === 'TEXT');
    const typeIndicator = tokens.find(t => t.type === 'TYPE_INDICATOR');

    // 尝试识别文献类型
    let type = 'Z' as string;
    if (typeIndicator) {
      const typeMatch = typeIndicator.value.match(/\[(\w+)/);
      if (typeMatch) {
        type = typeMatch[1]!;
      }
    }

    // 尝试提取作者和题名
    let authors: Author[] = [];
    let title = '';

    if (textTokens.length >= 2) {
      // 假设第一个文本是作者，第二个是题名
      const authorText = textTokens[0]!.value;
      authors = parseAuthors(authorText);
      title = textTokens[1]!.value;
    } else if (textTokens.length === 1) {
      title = textTokens[0]!.value;
    }

    return {
      reference: {
        type: type as never,
        authors,
        title,
        id: options?.preserveId
          ? tokens.find(t => t.type === 'NUMBER')?.value
          : undefined,
      },
      warnings,
    };
  }

  /**
   * 解析作者字符串
   */
}
