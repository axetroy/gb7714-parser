# AGENTS.md

## 项目概述

GB/T 7714 参考文献格式解析库，用于解析、校验和格式化符合中国国家标准的学术参考文献。

## 环境配置

- Node.js >= 20
- 安装依赖：`npm install`
- 构建项目：`npm run build`
- 运行测试：`npm test`
- 类型检查：`npm run typecheck`
- 代码规范检查：`npm run lint`

## 代码风格

- TypeScript 严格模式
- 使用 ESM 模块（import/export）
- 文件命名：kebab-case（如 `journal-parser.ts`）
- 导出模式：命名导出，通过 `index.ts` 创建桶文件
- 类型定义：集中在 `src/types/index.ts`

## 项目结构

```
src/
├── types/index.ts          # 核心类型定义（17种文献类型、5种载体标识）
├── tokenizer/index.ts      # 词法分析器 - 将输入字符串切分为词法单元
├── parsers/
│   ├── base.ts            # 解析器策略接口和分发器
│   ├── journal-parser.ts  # 期刊 [J] 解析器
│   ├── book-parser.ts     # 图书 [M] 解析器
│   ├── thesis-parser.ts   # 学位论文 [D] 解析器
│   ├── proceedings-parser.ts  # 会议录 [C] 解析器
│   ├── report-parser.ts   # 报告 [R] 解析器
│   ├── standard-parser.ts # 标准 [S] 解析器
│   ├── patent-parser.ts   # 专利 [P] 解析器
│   ├── web-page-parser.ts # 网站/网页 [EB] 解析器
│   ├── archive-parser.ts  # 档案 [A] 解析器
│   ├── map-parser.ts      # 地图 [CM] 解析器
│   ├── dataset-parser.ts  # 数据集 [DS] 解析器
│   ├── preprint-parser.ts # 预印本 [PP] 解析器
│   ├── component-part-parser.ts  # 析出文献解析器
│   └── index.ts           # 解析器导出
├── validator/index.ts     # 校验器 - 验证引用是否符合 GB/T 7714 规范
├── formatter/index.ts     # 格式化器 - 将结构化对象转换为 GB/T 7714 字符串
├── utils/index.ts         # 工具函数
└── index.ts               # 主入口 API
```

## 测试说明

- 测试文件位于 `src/__tests__/` 目录
- 运行所有测试：`npm test`
- 运行特定测试文件：`npx vitest run src/__tests__/journal-parser.test.ts`
- 监听模式：`npm run test:watch`
- 测试覆盖率：`npm run test:coverage`

## 核心约定

### 解析器模式

每种文献类型都有一个专门的解析器，实现 `ParserStrategy` 接口：

```typescript
interface ParserStrategy {
  match(tokens: Token[]): boolean;
  parse(tokens: Token[], options?: ParseOptions): ReferenceUnion;
}
```

### 引用类型系统

- 所有文献类型都继承自 `Reference` 基接口
- 使用 `ReferenceType` 枚举进行类型区分
- 特定类型的字段通过接口扩展添加（如 `Journal`、`Book`）

### Token 类型

需要识别的关键 Token：

- `TYPE_INDICATOR`：文献类型标识 [J]、[M]、[D]、[EB/OL] 等
- `BRACKET_OPEN/CLOSE`：文献序号 [1]
- `DOT`：句点
- `COMMA`：字段分隔符
- `COLON`：子字段分隔符（出版地: 出版者）
- `URL`：网址
- `YEAR`：四位数年份

## 常见任务

### 添加新文献类型

1. 在 `src/types/index.ts` 的 `ReferenceType` 枚举中添加类型
2. 在 types 文件中创建继承自 `Reference` 的接口
3. 在 `src/parsers/` 中创建实现 `ParserStrategy` 的解析器
4. 在 `src/index.ts` 中注册解析器
5. 在 `src/validator/index.ts` 中添加校验规则
6. 在 `src/formatter/index.ts` 中添加格式化方法
7. 编写测试

### 修改解析逻辑

1. 确定要修改的解析器（位于 `src/parsers/`）
2. 更新 `match()` 方法的检测逻辑
3. 更新 `parse()` 方法的提取逻辑
4. 运行测试：`npm test`

## 标准参考

- GB/T 7714-2015（旧版）
- GB/T 7714-2025（新版，2025年12月发布）
- 本库优先支持 2025 版本，同时保持向后兼容

## Git 规范

- 提交信息格式：`feat:`、`fix:`、`refactor:`、`test:`、`docs:`
- 分支命名：`feature/xxx`、`fix/xxx`
- PR 标题应具有描述性
- 提交前运行：`npm run typecheck && npm test`
