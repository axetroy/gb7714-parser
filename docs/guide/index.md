# 简介

GB/T 7714 Parser 是一个用于解析、校验和格式化 GB/T 7714 参考文献格式的 TypeScript 库。

## 特性

- ✅ 完整支持 GB/T 7714-2015 和 GB/T 7714-2025 标准
- ✅ 支持 17 种文献类型
- ✅ 支持顺序编码制和著者-出版年制
- ✅ 支持连续出版物解析
- ✅ 支持 DOI 解析
- ✅ TypeScript 编写，提供完整类型定义
- ✅ ESM/CJS 双格式输出

## 安装

```bash
npm install gb7714-parser
```

## 快速开始

```typescript
import { parse, format, validate } from 'gb7714-parser';

// 解析参考文献
const result = parse(
  '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.'
);
console.log(result.reference);
// {
//   type: 'J',
//   authors: [{ surname: '张三' }, { surname: '李四' }],
//   title: '人工智能在教育中的应用',
//   journalTitle: '现代教育技术',
//   year: '2025',
//   volume: '35',
//   issue: '2',
//   pages: '15-22'
// }

// 校验格式
const report = validate(result.reference);
console.log(report.valid); // true

// 格式化输出
const str = format(result.reference);
console.log(str);
```

## 在线体验

访问 [Playground](/playground/) 在线体验解析、格式化和校验功能。
