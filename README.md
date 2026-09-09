# gb7714-parser

[![npm version](https://img.shields.io/npm/v/gb7714-parser.svg)](https://www.npmjs.com/package/gb7714-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GB/T 7714 参考文献格式解析库，适用于中文学术论文的参考文献解析、校验与格式化。

## 特性

- ✅ 完整支持 GB/T 7714-2015 和 GB/T 7714-2025 标准
- ✅ 支持 17 种文献类型（期刊、图书、学位论文、会议录、报告、标准、专利、网站/网页、档案、地图、数据集、预印本等）
- ✅ 支持顺序编码制和著者-出版年制
- ✅ 支持连续出版物解析（标准 §8.4）
- ✅ 支持 DOI 解析（自动提取到 pid 字段）
- ✅ 支持正文引用标注解析（parseCitation API）
- ✅ TypeScript 编写，提供完整类型定义
- ✅ ESM/CJS 双格式输出
- ✅ 容错性强，对常见格式偏差有容忍度

## 安装

```bash
npm install gb7714-parser
```

## 快速开始

```typescript
import { parse, format, validate } from "gb7714-parser";

// 解析参考文献（来自 GB/T 7714-2025 标准 B.4 示例）
const result = parse(
  "[1] 于潇，刘义，柴跃廷，等. 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报（自然科学版），2012，52(11): 1518-1523.",
);
console.log(result.reference);
// {
//   type: 'J',
//   authors: [{ name: '于潇' }, { name: '刘义' }, { name: '柴跃廷' }],
//   title: '互联网药品可信交易环境中主体资质审核备案模式',
//   journalTitle: '清华大学学报（自然科学版）',
//   year: '2012',
//   volume: '52',
//   issue: '11',
//   pages: '1518-1523'
// }

// 校验格式
const report = validate(result.reference);
console.log(report.valid); // true

// 格式化输出
const str = format(result.reference);
console.log(str);
// 于潇, 刘义, 柴跃廷, 等 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报（自然科学版）, 2012, 52(11): 1518-1523.
```

## API

### parse(input, options?)

解析单条参考文献字符串。

```typescript
function parse<T extends ReferenceUnion = ReferenceUnion>(
  input: string,
  options?: ParseOptions,
): { reference: T; warnings: string[] };
```

**参数**

| 参数    | 类型           | 说明             |
| :------ | :------------- | :--------------- |
| input   | `string`       | 参考文献字符串   |
| options | `ParseOptions` | 解析选项（可选） |

**ParseOptions**

```typescript
interface ParseOptions {
  version?: "2015" | "2025"; // 标准版本，默认 '2025'
  strict?: boolean; // 严格模式，默认 false
  preserveId?: boolean; // 是否保留序号
  citationStyle?: "numeric" | "author-date"; // 标引体系
}
```

### parseAll(inputs, options?)

批量解析参考文献。

```typescript
function parseAll<T extends ReferenceUnion = ReferenceUnion>(
  inputs: string[],
  options?: ParseOptions,
): { reference: T; warnings: string[] }[];
```

### validate(reference, options?)

校验文献格式。

```typescript
function validate(
  reference: ReferenceUnion,
  options?: { version?: StandardVersion; strict?: boolean },
): ValidationReport;
```

**ValidationReport**

```typescript
interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  level: "error" | "warning";
}
```

### format(reference, options?)

将结构化对象格式化为符合 GB/T 7714 的字符串。

```typescript
function format(reference: ReferenceUnion, options?: FormatOptions): string;
```

**FormatOptions**

```typescript
interface FormatOptions {
  version?: "2015" | "2025"; // 输出标准版本，默认 '2025'
  citationStyle?: "citationStyle" | "author-date"; // 标引体系
  includeAccessDate?: boolean; // 是否输出引用日期
}
```

### parseCitation(citation)

解析正文中的引用标注。

```typescript
function parseCitation(citation: string): {
  type: "numeric" | "author-date";
  ids?: string[];
  author?: string;
  year?: string;
  suffix?: string;
};
```

**示例**

```typescript
import { parseCitation } from "gb7714-parser";

// 顺序编码制
const result1 = parseCitation("[1]");
console.log(result1.type); // 'numeric'
console.log(result1.ids); // ['1']

const result2 = parseCitation("[1,2,3]");
console.log(result2.ids); // ['1', '2', '3']

const result3 = parseCitation("[1-5]");
console.log(result3.ids); // ['1', '2', '3', '4', '5']

// 著者-出版年制
const result4 = parseCitation("(张三, 2025)");
console.log(result4.type); // 'author-date'
console.log(result4.author); // '张三'
console.log(result4.year); // '2025'
```

## 支持的文献类型

| 类型标识 | 名称       | 说明                             |
| :------- | :--------- | :------------------------------- |
| `J`      | 期刊       | Journal article                  |
| `M`      | 图书       | Book (旧称"专著")                |
| `D`      | 学位论文   | Dissertation/Thesis              |
| `C`      | 会议录     | Conference proceedings           |
| `R`      | 报告       | Report                           |
| `S`      | 标准       | Standard                         |
| `P`      | 专利       | Patent                           |
| `EB`     | 网站/网页  | Website/Webpage (旧称"电子公告") |
| `A`      | 档案       | Archive (2025新增)               |
| `N`      | 报纸       | Newspaper                        |
| `CM`     | 地图       | Map (旧称"舆图")                 |
| `DS`     | 数据集     | Dataset (2025新增)               |
| `PP`     | 预印本     | Preprint (2025新增)              |
| `G`      | 汇编       | Compilation                      |
| `CP`     | 计算机程序 | Computer program                 |
| `DB`     | 数据库     | Database                         |
| `Z`      | 其他       | Other                            |

## 解析示例

### 期刊 [J]

```typescript
// 来自 GB/T 7714-2025 标准 B.4 示例
const result = parse(
  "[1] 于潇，刘义，柴跃廷，等. 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报（自然科学版），2012，52(11): 1518-1523.",
);
```

### 图书 [M]

```typescript
// 来自 GB/T 7714-2025 标准 B.1 示例
const result = parse(
  "[1] 博伯尔. 银行业的未来与人工智能[M]. 徐超，译. 北京: 清华大学出版社, 2023: 35.",
);
```

### 学位论文 [D]

```typescript
// 来自 GB/T 7714-2025 标准 B.6 示例
const result = parse(
  "[1] 王琦. 融合星载 GNSS-R 和 SAR 数据的高时空分辨率土壤湿度反演方法研究[D]. 武汉: 武汉大学, 2022: 87.",
);
```

### 在线文献 [J/OL]

```typescript
// 来自 GB/T 7714-2025 标准 B.4 示例
const result = parse(
  "[1] Myburg A A, Grattapaglia D, Tuskan G A, et al. The genome of Eucalyptus grandis[J/OL]. Nature, 2014, 510: 356-362.",
);
```

### 带 DOI 的文献

```typescript
// 使用标准期刊示例 + DOI
const result = parse(
  "[1] 于潇，刘义，柴跃廷，等. 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报（自然科学版），2012，52(11): 1518-1523. DOI:10.1234/test",
);
console.log(result.reference.pid); // 'DOI:10.1234/test'
```

## 高级用法

### 自定义解析器

```typescript
import { Parser, JournalParser, BookParser } from "gb7714-parser";

const parser = new Parser();
parser.register(new JournalParser());
parser.register(new BookParser());

const tokens = tokenize(
  "[1] 于潇，刘义，柴跃廷，等. 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报（自然科学版），2012，52(11): 1518-1523.",
);
const result = parser.parse(tokens);
```

### 类型安全

```typescript
import { parse, Journal } from "gb7714-parser";

// 使用泛型获取精确类型
const { reference } = parse<Journal>(
  "[1] 于潇，刘义，柴跃廷，等. 互联网药品可信交易环境中主体资质审核备案模式[J]. 清华大学学报（自然科学版），2012，52(11): 1518-1523.",
);
console.log(reference.journalTitle); // '清华大学学报（自然科学版）' - 无需类型断言
```

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 测试
npm test

# 类型检查
npm run typecheck

# 代码规范检查
npm run lint
```

## 许可证

[MIT](LICENSE)

## 相关资源

Markdown 文件

- [GB/T 7714-2025 信息与文献 参考文献著录规则](./GB-T%207714-2025/《信息与文献%20参考文献著录规则》GB-T%207714-2025.md)

PDF 文件

- [GB/T 7714-2025 信息与文献 参考文献著录规则](./GB-T%207714-2025/《信息与文献%20参考文献著录规则》GB-T%207714-2025.pdf)

## 致谢

本库基于 GB/T 7714-2015 和 GB/T 7714-2025 国家标准开发，旨在为中文学术写作提供参考文献格式支持。
