# GB/T 7714 文献引用解析库——架构白皮书

**项目名称**：`gb7714-parser`（暂定）  
**文档版本**：v1.0  
**日期**：2026年9月7日  
**作者**：Axetroy

---

## 1. 项目愿景与目标

### 1.1 愿景
成为 JavaScript/TypeScript 生态中**首个且最完善**的、专门解析 GB/T 7714 系列国家标准参考文献格式的开源库，让中文文献的解析、验证与转换变得简单可靠。

### 1.2 核心目标
| 目标 | 说明 |
| :--- | :--- |
| **解析** | 将符合 GB/T 7714 格式的参考文献字符串，解析为结构化的 JavaScript 对象 |
| **验证** | 校验字符串是否符合国标格式规范，并给出详细的错误反馈 |
| **格式化** | 将结构化对象反向生成为符合国标的字符串（支持新旧版本） |
| **格式转换** | 在 GB/T 7714、APA、MLA 等格式之间进行双向转换（远期目标） |

### 1.3 非目标
- 不处理全文文献的语义理解或内容分析
- 不提供文献检索或网络爬取功能
- 不绑定任何特定的 UI 框架或编辑器

---

## 2. 用户画像与使用场景

### 2.1 典型用户
- **学术写作者**：需要在论文中批量处理中文参考文献
- **工具开发者**：为文献管理软件、写作插件提供国标支持
- **期刊编辑**：批量校验投稿论文的参考文献格式

### 2.2 核心使用场景
```
用户输入： "[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22."
                ↓
         gb7714-parser
                ↓
用户输出： {
  id: "1",
  type: "J",
  authors: [
    { surname: "张三", givenName: undefined, isOrganization: false },
    { surname: "李四", givenName: undefined, isOrganization: false }
  ],
  title: "人工智能在教育中的应用",
  journalTitle: "现代教育技术",
  year: "2025",
  volume: "35",
  issue: "2",
  pages: "15-22"
}
```

---

## 3. 架构设计原则

| 原则 | 说明 |
| :--- | :--- |
| **模块化** | 各功能模块低耦合高内聚，便于独立测试与替换 |
| **可扩展** | 通过插件/策略模式，轻松支持新版标准（2025）及未来修订 |
| **容错性强** | 对常见格式偏差有容忍度，并输出友好的警告信息 |
| **类型安全** | 使用 TypeScript 编写，提供完整的类型定义 |
| **性能优先** | 单条解析耗时 < 5ms，批量解析 1000 条 < 500ms |

---

## 4. 整体架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer（入口层）                     │
│   parse()  validate()  format()  convert()                  │
├─────────────────────────────────────────────────────────────┤
│                   Orchestration Layer（编排层）              │
│          Pipeline 调度、结果聚合、错误处理                    │
├─────────────────────────────────────────────────────────────┤
│                   Core Layer（核心处理层）                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Tokenizer │ │ Parser   │ │ Validator│ │ Formatter│      │
│  │  词法分析  │ │  语法解析  │ │  校验    │ │  生成    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  支持文献类型：图书[M] 期刊[J] 报纸[N] 会议录[C] 学位论文[D] │
│               报告[R] 标准[S] 专利[P] 网站/网页[EB] 档案[A]  │
│               地图[CM] 数据集[DS] 预印本[PP] 析出文献        │
├─────────────────────────────────────────────────────────────┤
│                   Domain Layer（领域模型层）                 │
│  文献类型定义（图书、期刊、报纸、会议录、学位论文、报告、     │
│               标准、专利、网站/网页、档案、地图、数据集、     │
│               预印本、析出文献）                             │
│  著录项结构（Author、Title、Year、Pages...）                │
│  标识符系统（文献类型标识、载体标识、永久标识符）             │
│  新旧版本差异（2015 vs 2025）                              │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer（基础设施层）         │
│   正则表达式引擎、错误码系统、日志系统、缓存机制              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 核心模块设计

### 5.1 词法分析器（Tokenizer）

**职责**：将输入的字符串切分成有意义的词法单元（Token）

```
输入: "[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22."
输出: [
  { type: 'BRACKET_OPEN', value: '[' },
  { type: 'NUMBER', value: '1' },
  { type: 'BRACKET_CLOSE', value: ']' },
  { type: 'AUTHOR', value: '张三，李四' },
  { type: 'DOT', value: '.' },
  { type: 'TITLE', value: '人工智能在教育中的应用' },
  { type: 'LITERAL_TYPE', value: '[J]' },
  { type: 'DOT', value: '.' },
  { type: 'JOURNAL', value: '现代教育技术' },
  // ...
]
```

### 5.2 语法解析器（Parser）

**职责**：将 Token 序列按语法规则组装成结构化对象

**核心策略**：采用**责任链模式**，每种文献类型（期刊、图书、学位论文等）是一个独立的处理器，由分发器判断并路由。

```typescript
interface ParserStrategy {
  match(tokens: Token[]): boolean;
  parse(tokens: Token[]): Reference;
}

class JournalParser implements ParserStrategy { /* 解析期刊 */ }
class BookParser implements ParserStrategy { /* 解析图书 */ }
class ThesisParser implements ParserStrategy { /* 解析学位论文 */ }
class ProceedingsParser implements ParserStrategy { /* 解析会议录 */ }
class ReportParser implements ParserStrategy { /* 解析报告 */ }
class StandardParser implements ParserStrategy { /* 解析标准 */ }
class PatentParser implements ParserStrategy { /* 解析专利 */ }
class WebPageParser implements ParserStrategy { /* 解析网站、网页 */ }
class ArchiveParser implements ParserStrategy { /* 解析档案 */ }
class MapParser implements ParserStrategy { /* 解析地图 */ }
class DatasetParser implements ParserStrategy { /* 解析数据集 */ }
class PreprintParser implements ParserStrategy { /* 解析预印本 */ }
class ComponentPartParser implements ParserStrategy { /* 解析析出文献 */ }
// ... 更多文献类型
```

**标引体系支持**（GB/T 7714-2025 第 9 章）：

| 标引体系 | 说明 | 解析策略 |
| :--- | :--- | :--- |
| **顺序编码制** | 引文采用序号标注 `[1]`、`[2]`，参考文献表按引文序号排序 | 通过 `id` 字段解析序号 |
| **著者-出版年制** | 引文采用 `(作者, 年)` 标注，参考文献表按责任者字顺和出版年排序 | 解析作者+年份组合，支持同一年多篇文献的 `a,b,c` 后缀区分 |

### 5.3 校验器（Validator）

**职责**：验证解析结果是否符合国标规范

**校验维度**：
- **必填字段**：不同文献类型有不同必填要求（见 6.2 字段映射表）
- **格式规范**：
  - 作者人数限制（3人以上加"等"或"et al."）
  - 日期格式（YYYY 或 YYYY-MM-DD）
  - 标准编号格式（如 "GB/T 3792—2021"）
  - 专利申请号格式
- **逻辑一致**：
  - 卷号和期号是否配套
  - 电子资源是否包含载体标识
  - 网站/网页是否包含引用日期和访问路径
- **版本兼容**：检查字段是否符合所选标准版本（2015/2025）

### 5.4 格式化器（Formatter）

**职责**：将结构化对象反向生成为符合 GB/T 7714 的字符串

**版本支持**：
- `format2015()`：输出符合旧版标准（GB/T 7714-2015）
- `format2025()`：输出符合新版标准（GB/T 7714-2025，2025年12月发布）

**新旧版本主要差异**：

| 变化项 | 2015 版 | 2025 版 |
| :--- | :--- | :--- |
| 文献类型名称 | 专著 `M` | 图书 `M` |
| 电子公告标识 | `EB`（电子公告） | `EB`（网站、网页） |
| 舗图标识 | 无 | `CM`（地图） |
| 新增文献类型 | 无 | 档案 `A`、地图 `CM`、数据集 `DS`、预印本 `PP` |
| 新增载体标识 | 无 | 缩微资料 `MM` |
| 标识符术语 | 数字对象唯一标识符(DOI) | 永久标识符(PID) |
| 日期术语 | 公告日期、更新日期、引用日期 | 创建/发布或修改日期、引用日期 |

---

## 6. 数据模型设计

### 6.1 核心类型定义

```typescript
// 文献类型枚举（对齐 GB/T 7714-2025 附录 A.1）
enum ReferenceType {
  M = 'M',   // 图书（旧称"专著"）
  J = 'J',   // 期刊
  N = 'N',   // 报纸
  C = 'C',   // 会议录
  D = 'D',   // 学位论文
  R = 'R',   // 报告
  S = 'S',   // 标准
  P = 'P',   // 专利
  EB = 'EB', // 网站、网页（旧称"电子公告"）
  A = 'A',   // 档案（2025新增）
  CM = 'CM', // 地图（旧称"舆图"）
  DS = 'DS', // 数据集（2025新增）
  PP = 'PP', // 预印本（2025新增）
  G = 'G',   // 汇编
  CP = 'CP', // 计算机程序
  DB = 'DB', // 数据库
  Z = 'Z',   // 其他
}

// 电子资源载体标识枚举（对齐 GB/T 7714-2025 附录 A.2）
enum MediaType {
  MT = 'MT', // 磁带（magnetic tape）
  DK = 'DK', // 磁盘（disk）
  CD = 'CD', // 光盘（CD-ROM）
  OL = 'OL', // 联机网络（online）
  MM = 'MM', // 缩微资料（microform materials，2025新增）
}

// 核心文献接口
interface Reference {
  id?: string;                    // 序号（顺序编码制）
  type: ReferenceType;            // 文献类型
  mediaType?: MediaType;          // 电子资源载体标识（电子资源必备）
  authors: Author[];              // 作者列表
  title: string;                  // 题名
  subtitle?: string;              // 其他题名信息（副题名、分卷书名等）
  otherAuthors?: Author[];        // 其他责任者（译者、编者等）
  version?: string;               // 版本
  publisherPlace?: string;        // 出版地
  publisher?: string;             // 出版者
  year?: string;                  // 出版年
  pages?: string;                 // 页码
  url?: string;                   // 获取和访问路径
  pid?: string;                   // 永久标识符（DOI、URN等）
  accessDate?: string;            // 引用日期（YYYY-MM-DD）
  // ... 按类型扩展的额外字段（见 TypeSpecificFields）
}

// 作者模型
interface Author {
  surname: string;                // 姓
  givenName?: string;             // 名
  isOrganization?: boolean;       // 是否为机构作者
}

// 日期字段格式规范（GB/T 7714-2025 7.5.4.2, 7.6）
// - 出版年：YYYY（如 2025）
// - 月/日：YYYY-MM-DD（如 2025-09-07）
// - 创建/发布或修改日期：(YYYY-MM-DD)（置于括号内）
// - 引用日期：[YYYY-MM-DD]（置于方括号内）

// 析出文献接口（用于图书中的析出文献、连续出版物中的析出文献）
interface ComponentPart extends Reference {
  host: HostReference;            // 出处文献信息
}

// 出处文献接口
interface HostReference {
  authors?: Author[];             // 出处文献作者
  title: string;                  // 出处文献题名
  subtitle?: string;              // 出处文献其他题名信息
  version?: string;               // 版本
  publisherPlace?: string;        // 出版地
  publisher?: string;             // 出版者
  year?: string;                  // 出版年
}

// 期刊中的析出文献特有字段（GB/T 7714-2025 8.5）
interface JournalArticle extends Reference {
  type: ReferenceType.J;
  journalTitle: string;           // 刊名
  journalSubtitle?: string;       // 刊名其他题名信息
  year: string;                   // 年
  volume?: string;                // 卷
  issue?: string;                 // 期（含合期号，如 "8/9/10"）
  onlineDate?: string;            // 在线出版日期（YYYY-MM-DD）
  articleNumber?: string;         // 文章编号（无页码时使用）
  supplement?: string;            // 增刊标识（如 "增刊 2"、"S1"）
}

// 图书接口
interface Book extends Reference {
  type: ReferenceType.M;
  isbn?: string;                  // ISBN
  reprint?: string;               // 印刷版次（如 "刻本"、"影印本"）
}

// 学位论文接口
interface Thesis extends Reference {
  type: ReferenceType.D;
  awardPlace?: string;            // 学位授予单位所在地
  awardInstitution: string;       // 学位授予单位（必备）
  awardYear?: string;             // 学位授予年
  supervisor?: string;            // 导师
}

// 会议录接口
interface Proceedings extends Reference {
  type: ReferenceType.C;
  conferenceName?: string;        // 会议名称
  conferenceYear?: string;        // 会议年份
}

// 报告接口
interface Report extends Reference {
  type: ReferenceType.R;
  reportNumber?: string;          // 报告编号
  releaseDate?: string;           // 发布日期（YYYY-MM-DD）
}

// 标准接口（GB/T 7714-2025 8.9）
interface Standard extends Reference {
  type: ReferenceType.S;
  standardNumber: string;         // 标准编号（必备，如 "GB/T 3792—2021"）
  standardName: string;           // 标准名称（必备）
}

// 专利接口
interface Patent extends Reference {
  type: ReferenceType.P;
  patentNumber: string;           // 专利申请号（必备）
  announceDate?: string;          // 公告(公开)日期（YYYY-MM-DD）
}

// 网站、网页接口（GB/T 7714-2025 8.11）
interface WebPage extends Reference {
  type: ReferenceType.EB;
  createDate?: string;            // 创建或修改日期（YYYY-MM-DD）
  accessDate: string;             // 引用日期（必备，[YYYY-MM-DD]）
}

// 档案接口（GB/T 7714-2025 8.12）
interface Archive extends Reference {
  type: ReferenceType.A;
  archiveNumber?: string;         // 档号
  collectionPlace?: string;       // 收藏者所在地
  collector?: string;             // 收藏者
  formedDate?: string;            // 形成日期
}

// 地图接口（GB/T 7714-2025 8.13）
interface Map extends Reference {
  type: ReferenceType.CM;
  scale?: string;                 // 比例尺（如 "1 : 25 000"）
  dimensions?: string;            // 尺寸（纸质单幅地图必备，如 "128 cm × 84 cm"）
}

// 数据集接口（GB/T 7714-2025 8.14）
interface Dataset extends Reference {
  type: ReferenceType.DS;
  platform?: string;              // 发布平台
  releaseDate?: string;           // 发布或修改日期（YYYY-MM-DD）
  accessDate: string;             // 引用日期（必备，[YYYY-MM-DD]）
}

// 预印本接口（GB/T 7714-2025 8.15）
interface Preprint extends Reference {
  type: ReferenceType.PP;
  platform?: string;              // 出版平台（如 arXiv、ChinaXiv）
  createDate?: string;            // 创建或修改日期（YYYY-MM-DD）
  accessDate: string;             // 引用日期（必备，[YYYY-MM-DD]）
}
```

### 6.2 文献类型与字段映射

| 文献类型 | 必填字段 | 可选字段 | 规范章节 |
| :--- | :--- | :--- | :--- |
| 图书 [M] | 题名 | 作者、其他题名信息、文献载体标识、其他责任者、版本、出版地、出版者、出版年、引文页码、获取和访问路径、永久标识符 | 8.2 |
| 图书中的析出文献 | 析出文献题名、图书题名 | 析出文献作者、析出文献其他题名信息、文献载体标识、析出文献其他责任者、图书主要责任者、图书其他题名信息、版本、出版地、出版者、出版年、析出文献页码、获取和访问路径、永久标识符 | 8.3 |
| 连续出版物 [J] | 题名 | 作者、其他题名信息、文献载体标识、年卷期或其他标识、出版地、出版者、出版年、获取和访问路径、永久标识符 | 8.4 |
| 连续出版物中的析出文献 [J] | 析出文献题名、连续出版物题名 | 析出文献作者、析出文献其他题名信息、文献载体标识、析出文献其他责任者、其他题名信息、年卷期/版次标识与页码、获取和访问路径、永久标识符 | 8.5 |
| 会议录 [C] | 题名 | 作者、其他题名信息、文献载体标识、会议名称、会议年份、引文页码、获取和访问路径、永久标识符 | 8.6 |
| 学位论文 [D] | 题名、学位授予单位 | 作者、其他题名信息、文献载体标识、学位授予单位所在地、学位授予年、引文页码、获取和访问路径、永久标识符 | 8.7 |
| 报告 [R] | 题名 | 作者、其他题名信息、报告编号、文献载体标识、发布日期、引文页码、获取和访问路径、永久标识符 | 8.8 |
| 标准 [S] | 标准编号、标准名称 | 文献载体标识、获取和访问路径、永久标识符 | 8.9 |
| 专利 [P] | 专利申请者/所有者、题名、专利申请号 | 其他题名信息、文献载体标识、公告(公开)日期、引文页码、获取和访问路径、永久标识符 | 8.10 |
| 网站 [EB] | 题名、文献载体标识、引用日期、获取和访问路径 | 作者、其他题名信息、创建或修改日期 | 8.11.2 |
| 网页 [EB] | 题名、文献载体标识、引用日期、获取和访问路径 | 作者、其他题名信息、创建或修改日期、永久标识符 | 8.11.3 |
| 档案 [A] | 题名 | 作者、其他题名信息、档号、文献载体标识、收藏者所在地、收藏者、形成日期、引文页码、获取和访问路径、永久标识符 | 8.12 |
| 地图 [CM] | 题名 | 作者、其他题名信息、比例尺、文献载体标识、版本、出版地、出版者、出版年、尺寸、获取和访问路径、永久标识符 | 8.13 |
| 数据集 [DS] | 题名、引用日期 | 作者、其他题名信息、文献载体标识、版本、发布平台、发布或修改日期、获取和访问路径、永久标识符 | 8.14 |
| 预印本 [PP] | 题名、引用日期、获取和访问路径 | 作者、其他题名信息、文献载体标识、版本、出版平台、创建或修改日期、永久标识符 | 8.15 |

---

## 7. 关键流程

### 7.1 解析主流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 输入字符串 │───▶│ 词法分析 │───▶│ 语法解析 │───▶│ 结果校验 │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                     │
                                              ┌──────▼──────┐
                                              │  返回结果/   │
                                              │  抛出错误   │
                                              └─────────────┘
```

### 7.2 错误处理策略

| 错误级别 | 说明 | 处理方式 |
| :--- | :--- | :--- |
| **Fatal** | 严重格式错误，无法继续 | 抛出异常，终止解析 |
| **Warning** | 部分信息缺失或格式存疑 | 输出警告日志，继续解析 |
| **Info** | 建议性提示（如旧版格式提醒） | 仅记录，不影响结果 |

---

## 8. API 设计（草案）

### 8.1 核心 API

```typescript
// 解析单条文献
function parse(input: string, options?: ParseOptions): ParseResult;

// 批量解析
function parseAll(inputs: string[], options?: ParseOptions): ParseResult[];

// 校验格式
function validate(input: string, options?: { version?: '2015' | '2025' }): ValidationReport;

// 格式化输出
function format(ref: Reference, options?: FormatOptions): string;

// 格式转换（远期）
function convert(input: string, from: Format, to: Format): string;
```

### 8.2 配置选项

```typescript
interface ParseOptions {
  version?: '2015' | '2025';     // 标准版本，默认 '2025'
  strict?: boolean;              // 严格模式，默认 false（容错模式）
  preserveId?: boolean;          // 是否保留序号
  locale?: 'zh' | 'en';          // 输出语言
  citationStyle?: 'numeric' | 'author-date'; // 标引体系：顺序编码制 | 著者-出版年制
}

interface FormatOptions {
  version?: '2015' | '2025';     // 输出标准版本，默认 '2025'
  citationStyle?: 'numeric' | 'author-date'; // 标引体系
  includeAccessDate?: boolean;   // 是否输出引用日期（网站/网页必备）
}
```

---

## 9. 技术选型

| 领域 | 方案 | 理由 |
| :--- | :--- | :--- |
| 语言 | TypeScript 5.x | 类型安全，提高代码可靠性 |
| 测试 | Vitest + 快照测试 | 对格式解析类库，快照测试能高效验证输出 |
| 构建 | tsup | 快速打包，支持 ESM/CJS 双格式 |
| 代码规范 | ESLint + Prettier | 保持代码风格一致 |
| 文档 | TypeDoc + 示例站点 | 生成高质量 API 文档 |

---

## 10. 里程碑规划

| 阶段 | 时间 | 交付内容 |
| :--- | :--- | :--- |
| **Phase 0** | 第1-2周 | 确定数据模型，编写核心类型定义（Reference、Author、各文献类型接口） |
| **Phase 1** | 第3-4周 | 实现词法分析器 + 图书[M]/期刊[J]/学位论文[D]解析器 |
| **Phase 2** | 第5-6周 | 实现校验器 + 格式化器（支持 2015/2025 双版本） |
| **Phase 3** | 第7-8周 | 补充会议录[C]/报告[R]/标准[S]/专利[P]/网站网页[EB]解析器 |
| **Phase 4** | 第9-10周 | 补充档案[A]/地图[CM]/数据集[DS]/预印本[PP]/析出文献解析器 |
| **Phase 5** | 第11-12周 | 完善测试（覆盖率 > 90%）、编写文档、发布 v1.0 |

---

## 11. 风险与应对

| 风险 | 应对策略 |
| :--- | :--- |
| 国标中大量"宜""可"等模糊表述 | 采用可配置的严格度模式，把选择权交给用户 |
| 现实中的参考文献格式千差万别 | 广泛收集真实样本（知网、万方等），构建测试集 |
| 2025 新版国标刚发布，生态未成熟 | 优先支持新版，同时保留对旧版的兼容 |
| 析出文献格式复杂（图书析出、期刊析出） | 设计独立的 ComponentPart 解析器，支持 `//` 分隔符识别 |
| 多语言文献混排（中日韩西俄） | 基于字符特征进行语言检测，按文种分类处理 |
| 日期格式多样（年月日、仅年份、纪年） | 实现灵活的日期解析器，支持多种格式转换 |
